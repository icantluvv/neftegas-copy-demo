## Изучено перед проектированием

- `apps/backend/src/fact-packages/entities/fact-package.entity.ts`,
  `fact-packages.service.ts` (`create`, `submit`, `submitCfoOwnPackage`,
  `checkAccess`, `isPackageOwner`, `toDetailDto`) — эталонная реализация той
  же механики, уже работает в проде для модуля «Факт».
- `apps/backend/src/corrections/entities/correction.entity.ts`,
  `corrections.service.ts` (`create`, `sendToDtoe`, `checkAccess`, `findAll`,
  `toDetailDto`, `deleteCorrection`) — текущее состояние (включает
  неиспользованный `InitiatorKind`/`TargetKind`/`CorrectionFilialStatus`-
  скаффолдинг из первой, более широкой версии этого change — удаляется).
- `apps/frontend/app/(private)/fact/files/lib/permissions.ts`,
  `fact-submit-panel.tsx`, `cfo-create-own-package-button.tsx` — фронтовый
  паттерн для переиспользования.
- `apps/frontend/app/(private)/corrections/[humanId]/lib/permissions.ts`,
  `create/page.tsx`, `create/create-correction-form.tsx`,
  `dashboard/components/cfo-corrections-overview.tsx`.

## Backend

### Модель данных

`Correction` (`apps/backend/src/corrections/entities/correction.entity.ts`):

- Удалить: `InitiatorKind`, `TargetKind`, `initiatorFilialId`,
  `initiatorCfo`/`initiatorCfoId`, `targetKind`, `filialStatuses` relation.
- Добавить (зеркало `FactPackage`):
  ```ts
  @ManyToOne(() => Cfo, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cfoId' })
  cfo: Relation<Cfo> | null;
  @Column({ type: 'int', nullable: true })
  cfoId: number | null;
  ```
  Doc-комментарий на классе: «Ровно одно из `filialId`/`cfoId` заполнено —
  `filialId` при создании Филиалом, `cfoId` при создании ЦФО (тогда пакет
  направляется сразу в ДТОиР, минуя цикл согласования)».
- Удалить `entities/correction-filial-status.entity.ts`.
- Откатить `entities/remark.entity.ts` — убрать `filialId`/`filial` (не
  нужен без филиала-проверяющего).
- `corrections.module.ts` — убрать регистрацию `CorrectionFilialStatus`.
- `CorrectionStatus` — без изменений (никаких новых значений не требуется:
  ЦФО-владелец использует тот же `DRAFT`/`UNDER_DTOE_REVIEW`/
  `RETURNED_BY_DTOE`/`APPROVED_BY_DTOE`, что и обычный цикл).

### Сервис (`corrections.service.ts`)

- `create()`: guard — `(role === FILIAL && filialId != null) || (role ===
  CFO && cfoId != null)`. При `role === CFO`: `cfoId: user.cfoId!, filialId:
  null`. При `role === FILIAL` — без изменений.
- `sendToDtoe()` — новая ветка перед существующей:
  ```ts
  const isCfoOwner = user.role === Role.CFO && correction.cfoId === user.cfoId;
  if (isCfoOwner) {
    if (![CorrectionStatus.DRAFT, CorrectionStatus.RETURNED_BY_DTOE].includes(correction.status)) {
      throw new BadRequestException('...');
    }
    // checkPackageComplete() — переиспользуется, как в send()
    // status -> UNDER_DTOE_REVIEW, sentToDtoeAt, notify dtoeUsers(), log
    return ...;
  }
  // существующая ветка: cfoStatuses.some(...) && status === ALL_CFO_APPROVED
  ```
- `checkAccess()`: `Role.CFO` — `correction.cfoId === user.cfoId || cfoStatuses.exist(...)`.
- `findAll()`: `Role.CFO` — `OR c.cfoId = :myCfoId`.
- `toDetailDto()`: добавить `isCfoOwner: user.role === Role.CFO && correction.cfoId != null && user.cfoId === correction.cfoId`.
  Существующий `filial: { id: correction.filial!.id, ... }` — заменить `!`
  на условный блок (`correction.filial ? {...} : null`), схема — nullable.
- `deleteCorrection()`: guard — `(FILIAL && filialId owner) || (CFO && cfoId owner)`, статус `DRAFT`.
- Уведомления/лог в `sendToDtoe()`/`dtoeApprove()`/`dtoeReturn()` для
  ЦФО-владельца — текст «ЦФО «{cfo.code}» направил корректировку» вместо
  «Филиал «{filial.code}»…» (условный `correction.filial ? ... : correction.cfo!.code`,
  как в `fact-packages.service.ts`'s `ownerUsers()`/логах).

Никаких новых DTO — `send-to-dtoe` не принимает тело ни в старой, ни в новой
ветке.

## Frontend

### Создание корректировки ролью CFO

`apps/frontend/app/(private)/corrections/create/page.tsx` — гвард `user.role
!== "FILIAL"` → `!["FILIAL", "CFO"].includes(user.role)`. Форма
(`create-correction-form.tsx`) не меняется — один и тот же выбор типа,
`useCreateCorrection` уже не требует владельца в теле запроса.

`apps/frontend/app/(private)/constants.ts` — пункт «Создать корректировку»:
`roles: ["FILIAL"]` → `roles: ["FILIAL", "CFO"]`.

`apps/frontend/app/(private)/dashboard/components/cfo-corrections-overview.tsx` —
добавить persistent-кнопку «+ Создать корректировку» (`<Link
href="/corrections/create">`), по образцу `filial-corrections-overview.tsx`.

### Карточка корректировки — отправка владельцем-ЦФО

`.../corrections/[humanId]/lib/permissions.ts`:
```ts
export function canSendToDtoeAsOwner(detail: CorrectionDetail): boolean {
  return detail.isCfoOwner
    && (detail.status === "DRAFT" || detail.status === "RETURNED_BY_DTOE")
    && detail.missingRequirements.length === 0;
}
```
`canUploadSlotFile` — расширить `detail.isFilialOwner` → `(detail.isFilialOwner || detail.isCfoOwner)`.

Панель отправки — при `detail.isCfoOwner` рендерится упрощённый вариант (по
образцу `fact-submit-panel.tsx`'s `isCfoOwner`-ветки): заголовок «Пакет
готов к направлению», одна кнопка «Направить в ДТОиР» →
`useSendCorrectionToDtoe({ humanId })`, без выбора ЦФО. Обычный
`SendForReviewForm` (выбор ЦФО) при `isCfoOwner` не рендерится.

## Дизайн (UI)

Кнопка «Направить в ДТОиР» для владельца-ЦФО — тот же `Button` `variant="default"`,
что и существующая кнопка «Направить в ДТОиР» в `cfo-statuses.tsx` для
обычного цикла (тот же текст, тот же визуальный вес) — паритет, не
самостоятельный редизайн. Кнопка «+ Создать корректировку» в кабинете ЦФО —
идентична существующей в кабинете Филиала (`buttonVariants()`, тот же
`+ Создать …` текст с заменой существительного).

**Открыто**: нет — сужение scope убрало все пункты, требовавшие дизайн-
решений (пикер направления, блок действий филиала-проверяющего).

## API Shape

Новых путей нет. Изменения существующих схем (`api/src/components/schemas/`):

- `correction.yaml` — `Correction`: `filialId` → nullable; добавить `cfoId`
  (nullable integer). `CorrectionCreateInput` — без изменений (по-прежнему
  только `correctionTypeId`).
- `correction-detail.yaml` — `CorrectionDetail`: добавить `isCfoOwner`
  (boolean, required); `filial` — nullable.

Изменения существующих путей (`api/src/paths/`):

- `corrections.yaml` — `POST`: `description` — «Доступно ролям FILIAL и CFO».
- `corrections-human-id-send-to-dtoe.yaml` — `description` — «Для владельца-
  ЦФО (пакет создан им самим) направление разрешено сразу из DRAFT/
  RETURNED_BY_DTOE, без требования согласования другими ЦФО».

Обратная совместимость: все изменения аддитивны/расширяют допустимые роли,
существующие клиенты не ломаются.

## Files / Owners

| Область | Файлы |
|---|---|
| API | `api/src/paths/corrections.yaml`, `corrections-human-id-send-to-dtoe.yaml`, `components/schemas/correction.yaml`, `correction-detail.yaml` |
| Backend | `apps/backend/src/corrections/**`, `database/seed.ts` |
| Frontend | `apps/frontend/app/(private)/corrections/**`, `dashboard/components/cfo-corrections-overview.tsx`, `constants.ts`, `packages/api/base/codegen/**` (генерация) |

## Readiness Decision

`ready` — модель данных и API Shape спроектированы полностью, узкий scope не
оставляет открытых вопросов по дизайну.

## Тестовая стратегия

- **Риск**: P1.
- **TDD-порядок**: по каждому Requirement из
  `specs/cfo-initiated-corrections/spec.md` — failing test → минимальная
  реализация → green → refactor. Backend: `corrections.service.spec.ts`
  (зеркалить describe-блоки `submit`/`isCfoOwner` из
  `fact-packages.service.spec.ts`) + один e2e-сценарий (или ручной smoke,
  см. известный баг Bun/Jest e2e в этом окружении). Frontend:
  `permissions.unit.test.ts` (`canSendToDtoeAsOwner`), component-тесты для
  `create-correction-form` (доступ CFO), submit-panel (ветка владельца).
- **Тестовые данные**: `apps/backend/src/database/seed.ts` — добавить одну
  демо-корректировку с `cfoId` заполненным (в статусе `DRAFT` или
  `UNDER_DTOE_REVIEW`), чтобы UI можно было проверить вручную без прохождения
  сценария.
- **Роли для тестов**: `cfo.angnks@demo.local`, `dtoe@demo.local`
  (существующие демо-аккаунты).
