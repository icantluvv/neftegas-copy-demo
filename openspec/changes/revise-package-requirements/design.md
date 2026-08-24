## Изучено перед проектированием

- `apps/backend/src/org/entities/package-requirement.entity.ts` — плоский
  список требований, `kind` (`MAIN_EXCEL`/`EXCEL_SHEET`/`DOCUMENT`; `MAIN_EXCEL`
  фактически не используется — основной Excel-слот создаётся в коде отдельно,
  не через `PackageRequirement`), `isRequired`, `order`, `responsibleCfoId`.
- `apps/backend/src/corrections/entities/document-slot.entity.ts` —
  `requirementId = null` означает основной Excel-слот; иначе — ссылка на
  `PackageRequirement`.
- `apps/backend/src/corrections/corrections.service.ts` —
  `checkPackageComplete()` (используется в `send()`/`resubmit()`-подобных
  местах и в `toDetailDto()` для `packageComplete`/`missingRequirements`);
  `create()` — фильтрует `correctionType.requirements` по `kind in
  [EXCEL_SHEET, DOCUMENT]`, создаёт по одному `DocumentSlot` на каждое
  требование плюс основной Excel-слот.
- `apps/backend/src/corrections/corrections.mapper.ts` —
  `toDocumentSlotDto()`, откуда фронт получает `isRequired`/`responsibleCfo`
  по каждому слоту.
- `apps/backend/src/database/seed.ts` — `reqRepo.save([...])` (3 требования
  для типа STANDARD), `seedCorrection()` — демо-генератор, жёстко
  деструктурирует `const [reqExcelSheet, reqDoo] = requirements;` и
  использует их `.id`/`.name` в текстах замечаний/файлов на всём протяжении
  функции (несколько статусов сценария).
- `apps/frontend/app/(private)/corrections/[humanId]/components/package-completeness.tsx` —
  плоская таблица `detail.slots`, колонки `Элемент`/`Обязателен`/`Проверяет
  ЦФО`/`Текущая версия`/действия.

## Backend

### Модель данных

`PackageRequirement` (`apps/backend/src/org/entities/package-requirement.entity.ts`):

```ts
@Column({ nullable: true })
choiceGroupKey: string | null;

@Column({ default: '' })
groupLabel: string;
```

`choiceGroupKey` — произвольная строка, общая для требований-альтернатив
(например, `'mtr_package'`); `null` — требование независимое, поведение не
меняется. `groupLabel` — текст заголовка группы для UI (например «Перечень
комплекта МТР (ХС)»); хранится на каждой строке группы (денормализация по
аналогии с уже принятым паттерном `namePattern`/`fileFormat` в этой же
сущности — не вводит новую сущность-группу ради одного текстового поля).

### Правило комплектности (`checkPackageComplete()`)

```ts
private checkPackageComplete(correction: Correction) {
  const missing: string[] = [];
  const mainSlot = correction.slots.find((s) => s.requirementId == null);
  if (!mainSlot || (mainSlot.versions?.length ?? 0) === 0) {
    missing.push('Excel корректировка');
  }

  const requiredReqs =
    correction.correctionType.requirements?.filter((r) => r.isRequired) ?? [];
  const bySlot = (reqId: number) =>
    correction.slots.find((s) => s.requirementId === reqId);

  const groups = new Map<string, PackageRequirement[]>();
  for (const req of requiredReqs) {
    if (!req.choiceGroupKey) {
      const slot = bySlot(req.id);
      if (!slot || (slot.versions?.length ?? 0) === 0) missing.push(req.name);
      continue;
    }
    groups.set(req.choiceGroupKey, [
      ...(groups.get(req.choiceGroupKey) ?? []),
      req,
    ]);
  }

  for (const reqs of groups.values()) {
    const anyFilled = reqs.some((req) => {
      const slot = bySlot(req.id);
      return slot && (slot.versions?.length ?? 0) > 0;
    });
    if (!anyFilled) {
      missing.push(
        `${reqs[0].groupLabel} (один из: ${reqs.map((r) => r.name).join(' / ')})`,
      );
    }
  }

  return { complete: missing.length === 0, missing };
}
```

Формат строки для незаполненной группы в `missing` — человекочитаемый текст
для сообщения `400` (`Пакет не укомплектован: ${missing.join(', ')}`, уже
существующий паттерн в `send()`), не структурированный объект — фронт не
парсит `missing`, только показывает как есть (см. `send-for-review-form.tsx`).

### Мапper

`toDocumentSlotDto()` дополняется:
```ts
choiceGroupKey: slot.requirement?.choiceGroupKey ?? null,
groupLabel: slot.requirement?.groupLabel || null,
```

### Сид

`apps/backend/src/database/seed.ts`, требования типа STANDARD — полная замена:

```ts
const requirements = await reqRepo.save([
  { correctionTypeId: correctionType.id, kind: PackageRequirementKind.DOCUMENT,
    name: 'Согласованная служебная записка', isRequired: true, order: 1 },
  { correctionTypeId: correctionType.id, kind: PackageRequirementKind.DOCUMENT,
    name: 'Пакет обосновывающих документов', isRequired: true, order: 2 },
  { correctionTypeId: correctionType.id, kind: PackageRequirementKind.DOCUMENT,
    name: 'Локальный сметный расчёт (ПД)', isRequired: true, order: 3,
    choiceGroupKey: 'mtr_package', groupLabel: 'Перечень комплекта МТР (ХС)' },
  { correctionTypeId: correctionType.id, kind: PackageRequirementKind.DOCUMENT,
    name: 'ХЗ-х ТКП', isRequired: true, order: 4,
    choiceGroupKey: 'mtr_package', groupLabel: 'Перечень комплекта МТР (ХС)' },
]);
```

`seedCorrection()` — деструктуризация `[reqExcelSheet, reqDoo]` и все
использования (`addFileVersion(excelSheetSlot, ...)`, тексты замечаний про
«ДОО», имена демо-файлов `d-listy.xlsx`/`doo.pdf`) переписываются под новый
состав: 4 демо-слота вместо 3, замечание ДТОиР/ЦФО в демо-сценарии переносится
на один из новых обязательных документов (например, «Пакет обосновывающих
документов» вместо «ДОО»). Файл переименовывается по смыслу (например,
`obosnovanie.pdf` вместо `doo.pdf`).

### Уже засеянные среды

`onDelete: 'RESTRICT'` на `DocumentSlot.requirement` не позволит удалить
строки `PackageRequirement` («D-листы»/«ДОО»/«Дефектная ведомость»), пока на
них ссылаются существующие `document_slots` уже созданных корректировок.
Стратегия для уже существующих сред (в частности `infra-db-1` этой сессии):
**не удалять** старые строки `PackageRequirement` физически — переименовать
их `name` на новые значения по одному (`UPDATE package_requirements SET
name = 'Согласованная служебная записка', is_required = true WHERE name =
'D-листы' AND correction_type_id = ...` и т.д.), добавить недостающую 4-ю
строку (`ХЗ-х ТКП`) и проставить `choice_group_key`/`group_label` двум
строкам-альтернативам. Это сохраняет ссылочную целостность уже созданных
`document_slots` (их `label` в самой таблице `document_slots` — это снимок на
момент создания слота, не читается заново из `PackageRequirement.name`, см.
`document-slot.entity.ts` — `label: string`, отдельная колонка) и не требует
удаления. Точные SQL-команды — в `tasks.md`.

## Frontend

### Отображение группы

`package-completeness.tsx` — строки с одинаковым `choiceGroupKey` в
`detail.slots` группируются под общей подписью `groupLabel` (например,
доп. строка-разделитель перед первой строкой группы с текстом «Перечень
комплекта МТР (ХС) — выберите один вариант»), колонка «Обязателен» для
строк группы показывает не жёсткое «Да», а контекстное значение: «Да (один из
двух)», которое становится «Выполнено» после того, как одна из строк группы
получила файл (`slot.isFilled`).

Конкретная вёрстка (визуальный разделитель, иконка, отступы) — не выбрана
пользователем на момент написания design.md, см. «Дизайн (UI)» ниже.

## Дизайн (UI)

Пользователь не передавал макет для группового блока «Перечень комплекта МТР
(ХС)». Решение по умолчанию (переиспользование существующих паттернов
`DataTable`, без нового визуального примитива):

- Между обычными строками таблицы и строками группы — минимальный
  визуальный разделитель: жирная подпись-строка `groupLabel` с пометкой
  «выберите один вариант» (`text-xs text-muted-foreground`, тот же класс, что
  уже используется для подсказок в этом компоненте, см. текст под таблицей
  «Замечание оставляется кнопкой...»).
- Обе строки группы остаются в общей таблице (не выносятся в отдельный
  блок/аккордеон) — так проще всего дать загрузить файл в любую из двух, не
  вводя новых интерактивных паттернов.
- Колонка «Обязателен»: для независимых требований — «Да»/«Нет», как
  сейчас; для строк группы — «Да (один из группы)», без дополнительной
  бейдж-графики.
- Цветовой акцент/иконки для группы не вводятся — минимальное текстовое
  решение до получения дизайн-указаний.

**Открыто**: нужен ли пользователю визуально более выраженный груп-блок
(рамка, фон, аккордеон, радио-переключатель вместо двух строк с независимой
загрузкой) — ждём указаний, при получении фиксируется здесь немедленно (см.
`proposal.md` → «Процессное примечание»).

## API Shape

`api/src/components/schemas/document-slot.yaml` (или актуальный файл со
схемой `DocumentSlot`, см. точное имя в `api/src/openapi.yaml`) — добавить:

```yaml
choiceGroupKey:
  type: string
  nullable: true
groupLabel:
  type: string
  nullable: true
```

Аддитивно, обратная совместимость сохраняется — существующие клиенты,
игнорирующие новые поля, продолжают работать. Изменений путей нет — только
схема, уже используемая в ответах `GET /corrections/{humanId}` через
`CorrectionDetail.slots`.

## Files / Owners

| Область | Файлы | Владелец |
|---|---|---|
| API | `api/src/components/schemas/document-slot.yaml`, `api/src/openapi.yaml` | разработчик, создавший этот change |
| Backend | `apps/backend/src/org/entities/package-requirement.entity.ts`, `apps/backend/src/corrections/corrections.service.ts`, `corrections.mapper.ts`, `apps/backend/src/database/seed.ts` | тот же |
| Frontend | `apps/frontend/app/(private)/corrections/[humanId]/components/package-completeness.tsx`, Kubb-кодоген | тот же |

## Readiness Decision

`ready with conditions` — backend/данные полностью специфицированы; условие
— визуальное решение группы в «Дизайн (UI)» временное (решение по умолчанию),
frontend-задача может быть завершена по умолчанию и скорректирована позже без
блокировки backend/API-задач.

## Тестовая стратегия

P1. TDD: failing unit-тест `checkPackageComplete` (через `send()`, т.к.
метод приватный) — «группа не заполнена → элемент группы в `missing`»,
«заполнен один из двух → группа не в `missing`, направление разрешено»,
«заполнены оба → тоже не в `missing`» → минимальная реализация → green.
Frontend — component-тест на рендер группового заголовка и на то, что после
загрузки файла в один вариант группа перестаёт блокировать (косвенно, через
`packageComplete`, не отдельный клиентский расчёт — фронт не дублирует
бизнес-правило, только отображает `missingRequirements` с бэкенда).
