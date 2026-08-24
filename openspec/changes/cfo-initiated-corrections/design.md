## Изучено перед проектированием

- `apps/backend/src/corrections/entities/correction.entity.ts`,
  `correction-cfo-status.entity.ts`, `remark.entity.ts` — текущая модель.
- `apps/backend/src/corrections/corrections.service.ts` — полный цикл
  `send`/`cfoApprove`/`cfoReturn`/`cancelCfoDecision`/`resubmit`/`sendToDtoe`/
  `dtoeApprove`/`dtoeReturn`/`resubmitToDtoe`, `findAll`, `checkAccess`,
  `getStats`, `toDetailDto`, `recomputeStatusAfterCfoAction`.
- `apps/backend/src/org/entities/cfo.entity.ts`, `filial-cfo-link.entity.ts`.
- `apps/backend/src/database/seed.ts` — справочник `CFOS` (17 строк, без
  ДТОиР), демо-пользователь `dtoe@demo.local` (роль `DTOE`, `cfoId = null`).
- `apps/backend/AGENTS.md` — модель данных, статусная модель, `synchronize:
  true` в dev (нет системы миграций в проекте на момент этого change).
- `apps/frontend/app/(private)/corrections/create/*`,
  `.../corrections/[humanId]/components/remarks-list/*`,
  `.../corrections/[humanId]/lib/permissions.ts`,
  `.../dashboard/components/{cfo-dashboard,cfo-corrections-overview,dtoe-dashboard,filial-corrections-overview}.tsx`,
  `.../dashboard/constants.ts` (`DASHBOARD_KIND_BY_ROLE`, `STAGE_GROUPS`).
- `openspec/changes/cfo-cabinet/{proposal,design}.md` — паттерн донат-график +
  независимые фильтры + таблица, решение «не вводить `/cfo`, оставить единый
  `/dashboard`».
- `openspec/specs/role-scoped-sections/spec.md` — контракт единого дашборда,
  рендеринг по роли, отдельный сценарий для DTOE.

## Backend

### Модель данных

`Correction` (`apps/backend/src/corrections/entities/correction.entity.ts`):

```ts
export enum InitiatorKind { FILIAL = 'FILIAL', CFO = 'CFO' }
export enum TargetKind { FILIAL = 'FILIAL', DTOE = 'DTOE' }
```

- `filialId` → `nullable`. Смысл не меняется для `initiatorKind = FILIAL`
  («филиал-владелец»); для `initiatorKind = CFO` — всегда `null`.
- `initiatorKind: InitiatorKind` (`default: FILIAL` — обратная совместимость
  для уже существующих строк без бэкфилла, т.к. `synchronize: true` не
  создаёт миграций с ручным backfill; DEFAULT покрывает существующие данные
  автоматически при добавлении колонки).
- `initiatorFilialId: number | null` — дублирует `filialId` по смыслу при
  `initiatorKind = FILIAL` (оставлено для симметрии со стороной CFO и чтобы
  `filialId` можно было использовать для обоих смыслов без обязательного
  join на `initiatorFilialId`).
- `initiatorCfoId: number | null`, `initiatorCfo: Relation<Cfo> | null` —
  заполнены при `initiatorKind = CFO`.
- `targetKind: TargetKind | null` — куда фактически направлено (заполняется
  в `sendAsCfo`, `null` до направления).
- `CorrectionStatus` — 5 новых значений: `UNDER_FILIAL_REVIEW`,
  `PARTIALLY_APPROVED_BY_FILIALS`, `RETURNED_FOR_REVISION_BY_FILIAL`,
  `RESUBMITTED_TO_FILIALS`, `ALL_FILIALS_APPROVED` — зеркало
  `UNDER_CFO_REVIEW`/`PARTIALLY_APPROVED`/`RETURNED_FOR_REVISION`/
  `RESUBMITTED`/`ALL_CFO_APPROVED`.
- Новая `OneToMany` — `filialStatuses: CorrectionFilialStatus[]`.

Новая сущность `apps/backend/src/corrections/entities/correction-filial-status.entity.ts`
(файл уже создан) — полное зеркало `CorrectionCfoStatus`: `correctionId`,
`filialId`, `status: FilialStatusValue` (`PENDING`/`APPROVED`/`RETURNED`),
`isRequired`, `decidedById`, `decidedAt`, `@Unique(['correctionId',
'filialId'])`.

`Remark` (`entities/remark.entity.ts`, уже отредактирован) — `filialId:
number | null`, `filial: Relation<Filial> | null`; `issuerLabel` расширен:
`cfo → filial → 'ДТОиР'`.

Регистрация в `corrections.module.ts`: добавить `CorrectionFilialStatus` и
`Filial` (если ещё не импортирован для новых relation) в
`TypeOrmModule.forFeature([...])`.

### Сид (`apps/backend/src/database/seed.ts`)

Добавить в массив `CFOS` 18-ю запись `{ code: 'ДТОиР', slug: 'dtoe' }`. В
двойном цикле `for (filial) for (cfo) linkRepo.save(...)` — явно исключить
эту запись (`if (cfo.code === 'ДТОиР') continue;`), чтобы она не попадала в
обычный список ЦФО, которых филиал выбирает при направлении. Демо-пользователь
`dtoe@demo.local` остаётся с `role: Role.DTOE`, `cfoId` не проставляется —
связь между ролью и Cfo-строкой смысловая (по коду), не по FK, т.к.
`dtoeApprove`/`dtoeReturn` продолжают работать через `user.role === Role.DTOE`,
не через `user.cfoId`.

### Сервис (`corrections.service.ts`)

- `create()`: guard `user.role !== Role.FILIAL || user.filialId == null` →
  `(user.role === Role.FILIAL && user.filialId != null) || (user.role ===
  Role.CFO && user.cfoId != null)`. При `role === CFO`:
  `initiatorKind: InitiatorKind.CFO`, `initiatorCfoId: user.cfoId`,
  `filialId: null`, `initiatorFilialId: null`. При `role === FILIAL` —
  текущее поведение + `initiatorKind: InitiatorKind.FILIAL`,
  `initiatorFilialId: user.filialId`.
- Новый `sendAsCfo(user, humanId, dto: SendAsCfoDto)`:
  - guard: `correction.initiatorCfoId === user.cfoId && user.role ===
    Role.CFO`.
  - `checkPackageComplete()` — переиспользуется без изменений.
  - `target === 'FILIAL'`: цикл по `dto.filialIds`, `save`/`update`
    `CorrectionFilialStatus` (паттерн идентичен циклу по `cfoIds` в `send()`),
    `status → UNDER_FILIAL_REVIEW`, `targetKind → FILIAL`, уведомления
    `filialUsers(filialId)` для каждого филиала.
  - `target === 'DTOE'`: `status → UNDER_DTOE_REVIEW`, `targetKind → DTOE`,
    `sentToDtoeAt: new Date()`, уведомление `dtoeUsers()` — переиспользует
    текст/паттерн `sendToDtoe()`.
  - Из `ALL_FILIALS_APPROVED` тот же эндпоинт с `target: 'DTOE'` переводит в
    `UNDER_DTOE_REVIEW` — отдельного действия «направить в ДТОиР после
    филиалов» не вводится.
- Новые `filialApprove`/`filialReturn`/`cancelFilialDecision` — построчные
  копии `cfoApprove`/`cfoReturn`/`cancelCfoDecision` с заменой
  `cfoStatuses`→`filialStatuses`, `CfoStatusValue`→`FilialStatusValue`,
  `user.cfoId`→`user.filialId`, `Role.CFO`→`Role.FILIAL`.
- Новый `resubmitToFilials` — копия `resubmit()` с той же заменой; вызывающий
  — `initiatorCfoId === user.cfoId` (автор, не проверяющий).
- Новый приватный `recomputeStatusAfterFilialAction()` — копия
  `recomputeStatusAfterCfoAction()` со статусами из 2.3 плана (см.
  `proposal.md`).
- `leaveRemark()`: третья ветка `user.role === Role.FILIAL` — находит
  `myFilialStatus` в `correction.filialStatuses`, требует `PENDING`,
  `remark.filialId = user.filialId`.
- `findAll()`: `user.role === Role.CFO` — `OR c.initiatorCfoId = :cfoId`
  (видит и то, где проверяющий через `cfoStatuses`, и то, что создал сам).
  Новая ветка `user.role === Role.FILIAL` — помимо `c.filialId = :filialId`,
  добавить `OR EXISTS (correction_filial_statuses с filialId = :filialId)`.
- `checkAccess()`: добавить `initiatorCfoId === user.cfoId` для `Role.CFO`;
  `Role.FILIAL` — либо `filialId === user.filialId`, либо есть строка
  `filialStatuses` с этим `filialId`.
- `getStats()`: новые статусы учитываются в `inReviewStatuses`/
  `returnedStatuses`-подобных массивах (иначе дашборды посчитают их как
  «прочее» — молчаливая потеря данных в UI).
- Все места, где сейчас `correction.filial.code`/`correction.filialId`
  читаются напрямую для текста уведомления/лога (`send`, `resubmit`,
  `cfoReturn`, `dtoeApprove`, `dtoeReturn`, `resubmitToDtoe`,
  `recomputeStatusAfterCfoAction`, `toDetailDto`) — обернуть в проверку
  `initiatorKind === FILIAL` или ввести приватный helper
  `initiatorLabel(correction)`/`initiatorUsers(manager, correction)`,
  возвращающий `filialUsers(filialId)` либо `cfoUsers(initiatorCfoId)`.
- `deleteCorrection()`: guard расширяется — `(FILIAL && filialId owner) ||
  (CFO && initiatorCfoId owner)`.

### DTO

Новый `apps/backend/src/corrections/dto/send-as-cfo.dto.ts`:
```ts
export class SendAsCfoDto {
  @IsEnum(TargetKind) target: TargetKind;
  @IsOptional() @IsArray() @IsInt({ each: true }) filialIds?: number[];
}
```
Валидация «`filialIds` обязателен и непуст при `target = FILIAL`» —
class-validator `@ValidateIf`/кастомный decorator либо явная проверка в
сервисе (`BadRequestException`, единообразно с существующим стилем сервиса,
где часть валидаций уже в сервисе, а не в DTO — см. `LoginDto`, известный
техдолг из отдельного change, не переносим этот паттерн сюда).

## Frontend

### Создание корректировки ролью CFO

`apps/frontend/app/(private)/corrections/create/create-correction-form.tsx` —
после выбора типа корректировки и комплектации пакета форма для роли `CFO`
показывает переключатель направления (Radio/Tabs — см. «Дизайн (UI)» ниже):
«Направить филиалам» → мультиселект (источник — `CorrectionDetail.availableFilials`,
аналог `availableCfos`) / «Направить в ДТОиР» → без доп. полей. Отправка —
новый Kubb-хук `useSendCorrectionAsCfo`.

`apps/frontend/app/(private)/constants.ts` — `navItems`, пункт «Создать
корректировку»: `roles: ["FILIAL"]` → `roles: ["FILIAL", "CFO"]`.

### Действия филиала-проверяющего

`apps/frontend/app/(private)/corrections/[humanId]/components/remarks-list/remarks-action-bar.tsx` —
после существующего блока условий ЦФО добавляется симметричный блок для
`isFilialReviewer` (аналог `isCfoReviewer` в `CorrectionDetail`) — кнопки
«Согласовать»/«Оставить замечание»/«Вернуть на доработку»/«Отменить решение»,
видимые при `myFilialStatus?.status === 'PENDING'` (для отмены — при статусе
≠ `PENDING`, зеркало `canCancelCfoDecision`).

`.../lib/permissions.ts` — новые `canApproveAsFilial`, `canFinalizeReturnAsFilial`,
`canCancelFilialDecision` — построчные копии `canApproveAsCfo`,
`canFinalizeReturnAsCfo`, `canCancelCfoDecision` с заменой поля.

### Кабинет ДТОиР

`apps/frontend/app/(private)/dashboard/components/dtoe-dashboard.tsx` +
новый `dtoe-corrections-overview.tsx` — по образцу
`cfo-corrections-overview.tsx`: донат-график (группы статусов, переиспользовать
`STAGE_GROUPS`/`DonutChart` из `dashboard/constants.ts` и `donut-chart.tsx`),
независимый фильтр по статусу и по инициатору (Филиал/ЦФО — новое поле,
т.к. у ДТОиР, в отличие от ЦФО, нет своего "myStatus"-фильтра, только общий
статус корректировки), таблица `UNDER_DTOE_REVIEW` + история решений.

### Дашборд филиала

`apps/frontend/app/(private)/dashboard/components/filial-corrections-overview.tsx` —
новый раздел/вкладка «На согласовании (от ЦФО)»: корректировки с
`initiatorKind = CFO`, где `myFilialStatus` присутствует, отдельно от списка
корректировок, созданных самим филиалом (текущий `useGetCorrections({
pageSize: 100 })` уже вернёт оба множества после правки `findAll()` — различие
по `initiatorKind` на фронте, без нового запроса).

## Дизайн (UI)

На момент создания этого change пользователь не передал конкретные макеты,
цвета или расположение новых элементов. Ниже — рабочие решения по умолчанию
(переиспользование существующих паттернов проекта), которые **будут заменены
по мере получения дизайн-указаний от пользователя** — при получении новых
указаний этот раздел обновляется первым, до или одновременно с кодом.

Решения по умолчанию (наследуют уже принятые в `cfo-cabinet`/
`filial-corrections-overview`/`correction-detail-page`):

- Переключатель направления в форме создания (Филиалы / ДТОиР) — стандартный
  `RadioGroup`/`Tabs` примитив из `apps/frontend/src/components/ui`, без
  нового визуального стиля.
- Блок действий филиала-проверяющего — визуально идентичен существующему
  блоку действий ЦФО (`RemarksActionBar`): те же варианты `Button`
  (`default`/`outline`/`destructive`), тот же `flex flex-wrap gap-2`.
  Различий в цвете/иконках между «решением ЦФО» и «решением филиала» не
  вводится — оба находятся в одной карточке корректировки, различаются только
  подписью роли, не стилем.
- `DtoeCorrectionsOverview` — визуально идентичен `CfoCorrectionsOverview`
  (тот же донат-график, та же компоновка фильтров и таблицы) — паритет
  функциональности, не самостоятельный редизайн.
- Заголовки кабинетов, названия колонок таблиц — по аналогии с уже принятыми
  формулировками `cfo-cabinet`/`filial-corrections-overview` («Направленные
  корректировки», «Распределение по статусам»); для ДТОиР — «На проверке у
  ДТОиР» вместо «Направленные корректировки» (ДТОиР не направляет, а
  принимает).
- Кнопка удаления черновика ЦФО-инициированной корректировки — тот же
  паттерн иконки (SVG-крестик), что уже используется в
  `filial-corrections-overview.tsx` для черновиков филиала.

**Открыто**: точный текст лейблов направления («Направить филиалам» vs иная
формулировка), порядок элементов в форме создания, нужен ли отдельный
цветовой акцент для ЦФО-инициированных корректировок в общих списках (чтобы
визуально отличать от филиал-инициированных) — ждём указаний пользователя.

## API Shape

Новые пути (`api/src/paths/`):

| Метод | Путь | Роль | Request | Response |
|---|---|---|---|---|
| `POST` | `/corrections/{humanId}/send-as-cfo` | `CFO` (автор) | `SendAsCfoRequest { target: FILIAL\|DTOE, filialIds?: integer[] }` | `200 CorrectionDetail`; `400` (пакет не укомплектован / `filialIds` пуст при `target=FILIAL`); `403` (не автор) |
| `POST` | `/corrections/{humanId}/filial-approve` | `FILIAL` (проверяющий) | — | `200 CorrectionDetail`; `400` (уже принято решение); `403` |
| `POST` | `/corrections/{humanId}/filial-return` | `FILIAL` (проверяющий) | — | `200 CorrectionDetail`; `400` (нет открытых замечаний / уже принято решение); `403` |
| `POST` | `/corrections/{humanId}/cancel-filial-decision` | `FILIAL` (проверяющий) | — | `200 CorrectionDetail`; `400` (решение ещё не принято / уже в ДТОиР); `403` |
| `POST` | `/corrections/{humanId}/resubmit-to-filials` | `CFO` (автор) | `{ filialIds: integer[] }` | `200 CorrectionDetail`; `403` |

`POST /corrections` — `security`/роли расширяются на `CFO`, без изменения
схемы `CreateCorrectionRequest`.

Изменения схем (`api/src/components/schemas/`):
- `correction.yaml` — `status` enum +5 значений; добавить `initiatorKind`,
  `initiatorFilial` (nullable `FilialSummary`), `initiatorCfo` (nullable
  `CfoSummary`), `targetKind` (nullable).
- `correction-detail.yaml` — добавить `filialStatuses:
  CorrectionFilialStatus[]`, `myFilialStatus` (nullable), `isFilialReviewer`
  (boolean), `availableFilials: FilialSummary[]`.
- Новая `correction-filial-status.yaml` — зеркало `correction-cfo-status.yaml`.

Обратная совместимость: все новые поля — аддитивные (nullable/с дефолтом),
существующие поля/эндпоинты не меняют форму ответа. `POST /corrections`
меняет только допустимые роли (расширение прав, не breaking для существующих
клиентов).

Файлы: `api/src/openapi.yaml` (регистрация путей), `api/src/paths/corrections-human-id-send-as-cfo.yaml`,
`-filial-approve.yaml`, `-filial-return.yaml`, `-cancel-filial-decision.yaml`,
`-resubmit-to-filials.yaml`, `api/src/components/schemas/correction.yaml`,
`correction-detail.yaml`, новая `correction-filial-status.yaml`.

## Files / Owners

| Область | Файлы | Владелец первой задачи |
|---|---|---|
| API | `api/src/**` (см. API Shape) | разработчик, создавший этот change |
| Backend | `apps/backend/src/corrections/**`, `database/seed.ts` | по готовности API-задачи 1.1 |
| Frontend | `apps/frontend/app/(private)/**`, `packages/api/base/codegen/**` (генерация) | по готовности API-задачи 1.1 |

## Readiness Decision

`ready with conditions` — модель данных и API Shape спроектированы полностью;
условие: открытый вопрос «список филиалов, доступных ЦФО при направлении»
(все активные vs через `FilialCfoLink` в обратную сторону) и раздел «Дизайн
(UI)» требуют подтверждения пользователя до финализации соответствующих
frontend-задач (backend и API-задачи не блокированы этим вопросом — реализуют
вариант по умолчанию «все активные филиалы», см. `proposal.md`, Impact →
Вне области).

## Тестовая стратегия

- **Риск**: P0 (новая capability, новая модель данных, новые права).
- **TDD-порядок**: по каждому Requirement из
  `specs/cfo-initiated-corrections/spec.md` — failing test → минимальная
  реализация → green → refactor. Backend: `corrections.service.spec.ts`
  (unit, зеркалить существующие describe-блоки для `cfoApprove`/`cfoReturn`/
  `sendToDtoe`) + `*.e2e-spec.ts` для сквозных HTTP-сценариев. Frontend:
  `permissions.unit.test.ts` (guard-функции филиала-проверяющего),
  component-тесты для `create-correction-form`, `remarks-action-bar`,
  `dtoe-corrections-overview`, `filial-corrections-overview`; один E2E —
  happy path ЦФО создаёт → направляет филиалу → филиал согласовывает → ЦФО
  направляет в ДТОиР → ДТОиР согласовывает.
- **Тестовые данные**: `apps/backend/src/database/seed.ts` — добавить
  минимум одну демо-корректировку с `initiatorKind = CFO` в статусе
  `UNDER_FILIAL_REVIEW` (аналог существующего цикла `DEMO_STATUSES`), чтобы
  UI можно было разрабатывать без прохождения сценария вручную.
- **Роли для тестов**: `cfo.angnks@demo.local`, `filial.donbassgaz@demo.local`,
  `dtoe@demo.local` (существующие демо-аккаунты, `apps/backend/src/database/seed.ts`).
- **Verification gates**: см. `proposal.md` → «Обязательные уровни
  проверки» и финальные задачи в `tasks.md`.
