# Design: planning-2027-package-review

Источники: постановка задачи пользователем в текущей сессии («сделать модуль
план на 2027 — все те же самые кнопки/действия, что в корректировке, 1:1, но
не связано, а индивидуально; согласование — те же ЦФО через FilialCFO;
структура пакета — как в корректировке, не фиксированный список»),
`apps/backend/src/corrections/**` (реализация-образец, полностью прочитана —
entities, service, controller, mapper, DTO), `apps/backend/AGENTS.md`
(«Статусная модель корректировки» — использована как отправная точка, но с
поправкой: код `corrections.service.ts` — единственный источник истины по
фактическим guard-условиям, т.к. AGENTS.md местами расходится с реализацией,
см. ниже), корневой `AGENTS.md` («Роли и матрица доступа», «Бизнес-правила и
защита от некорректных состояний»), `openspec/changes/fact-package-review/`
(образец оформления клонированного домена).

Readiness Decision: **ready** — API Shape ниже полностью специфицирован по
образцу существующего, работающего домена `corrections`; открытых вопросов,
блокирующих backend/API/create-detail работу, не осталось. Единственный
открытый пункт (состав экрана `/planning/files`) не блокирует эти три ветки,
см. `proposal.md` → «Исключено из объёма работ».

## Модель предметной области

`Plan` — прямой аналог `Correction`, с независимыми таблицами/entities:

| corrections (образец, только для справки) | planning (новый, независимый) |
|---|---|
| `Correction`, `correction_human_id_seq` (`COR-`) | `Plan`, `plan_human_id_seq` (`PLN-`) |
| `CorrectionType` | `PlanType` |
| `PackageRequirement` | `PlanPackageRequirement` |
| `DocumentSlot` | `PlanDocumentSlot` |
| `FileVersion` | `PlanFileVersion` |
| `CorrectionCfoStatus`, `CfoStatusValue` | `PlanCfoStatus`, `PlanCfoStatusValue` (отдельный enum, не переиспользует corrections) |
| `Remark`, `RemarkStatus`, `remark_human_id_seq` (`REM-`) | `PlanRemark`, `PlanRemarkStatus`, `plan_remark_human_id_seq` (`PLR-`) |
| `CorrectionHistoryEntry` | `PlanHistoryEntry` |

**Не реплицируется**: `initiatorKind`/`targetKind`/`CorrectionFilialStatus` и
пять «зеркальных» статусов (`UNDER_FILIAL_REVIEW`,
`PARTIALLY_APPROVED_BY_FILIALS`, `RETURNED_FOR_REVISION_BY_FILIAL`,
`RESUBMITTED_TO_FILIALS`, `ALL_FILIALS_APPROVED`) — это задекларированный в
`Correction`-entity, но нигде не реализованный в `corrections.service.ts`
код (подтверждено чтением сервиса — ни один метод не работает с этими
полями/статусами). Плану нужен только реально работающий цикл
FILIAL→CFO→DTOE, поэтому он не переносится.

### Статусная модель плана (`PlanStatus`)

Прямое отражение **фактического** поведения `corrections.service.ts` (не
таблицы из `apps/backend/AGENTS.md`, которая по факту чтения кода в этой
сессии местами расходится с реализацией — см. пометки ниже):

| Значение | Соответствие статусу корректировки |
|---|---|
| `DRAFT` | `DRAFT` |
| `UNDER_CFO_REVIEW` | `UNDER_CFO_REVIEW` |
| `PARTIALLY_APPROVED` | `PARTIALLY_APPROVED` |
| `RETURNED_FOR_REVISION` | `RETURNED_FOR_REVISION` |
| `RESUBMITTED` | `RESUBMITTED` |
| `ALL_CFO_APPROVED` | `ALL_CFO_APPROVED` |
| `UNDER_DTOE_REVIEW` | `UNDER_DTOE_REVIEW` |
| `RETURNED_BY_DTOE` | `RETURNED_BY_DTOE` |
| `APPROVED_BY_DTOE` | `APPROVED_BY_DTOE` (финал) |

`SENT_TO_DTOE` (зарезервированный, нигде не используемый в `corrections`
статус) не переносится.

Переходы, guard-условия и инициаторы — построчная копия таблицы «Full status
state machine», зафиксированной чтением `corrections.service.ts` в этой
сессии:

| From | Действие | Актор | Guard | To | Побочные эффекты |
|---|---|---|---|---|---|
| — | `create` (`POST /plans`) | FILIAL | `user.filialId` задан | `DRAFT` | Создаёт главный Excel-слот + слоты по `PlanPackageRequirement` типа плана; запись в историю |
| `DRAFT` | `updatePlanType` (`POST /:humanId/change-type`) | FILIAL-владелец | статус `DRAFT` | `DRAFT` | Пересоздаёт слоты, зависящие от типа (с unlink файлов) |
| `DRAFT` | `deletePlan` (`DELETE /:humanId`) | FILIAL-владелец | статус `DRAFT` | (удалён) | Каскад, unlink файлов |
| `DRAFT` | `send` (`POST /:humanId/send`) | FILIAL-владелец | пакет полностью укомплектован; все `cfoIds` ∈ активные `FilialCfoLink` филиала | `UNDER_CFO_REVIEW` | Создаёт/сбрасывает `PlanCfoStatus` в `PENDING` для выбранных ЦФО; уведомление ЦФО |
| любой (ЦФО `PENDING`) | `cfoApprove` (`POST /:humanId/cfo-approve`) | CFO | своя запись `PlanCfoStatus.status = PENDING` | пересчёт (`ALL_CFO_APPROVED` / `PARTIALLY_APPROVED` / `UNDER_CFO_REVIEW`) | Своя запись → `APPROVED`; автозакрытие собственных открытых замечаний; уведомления при полном согласовании |
| любой (ЦФО `PENDING`) | `leaveRemark` (`POST /:humanId/remarks`) | CFO/DTOE | CFO: своя запись `PENDING`; DTOE: план `UNDER_DTOE_REVIEW` | без изменений (статус меняется отдельным действием `cfoReturn`/`dtoeReturn`) | Создаёт `PlanRemark` |
| любой (ЦФО `PENDING`) | `cfoReturn` (`POST /:humanId/cfo-return`) | CFO | своя запись `PENDING`; ≥1 собственное `OPEN`-замечание | `RETURNED_FOR_REVISION` | Своя запись → `RETURNED`; уведомление филиала |
| решённый статус | `cancelCfoDecision` (`POST /:humanId/cfo-cancel`) | CFO | своя запись ≠ `PENDING`; план не в `{UNDER_DTOE_REVIEW, RETURNED_BY_DTOE, APPROVED_BY_DTOE}` | пересчёт | Своя запись → `PENDING` |
| `RETURNED_FOR_REVISION` | `resubmit` (`POST /:humanId/resubmit`) | FILIAL-владелец | — | пересчёт (обычно `RESUBMITTED`) | Сбрасывает выбранные ЦФО в `PENDING`; уведомление |
| — (собственное замечание) | `markRemarkFixed` (`POST /:humanId/remarks/:id/fix`) | FILIAL-владелец | — | (только замечание) `FIXED_BY_FILIAL` | — |
| — (собственное замечание) | `reopenRemark` (`POST /:humanId/remarks/:id/reopen`) | CFO-автор замечания | — | (план) `RETURNED_FOR_REVISION`, (замечание) `REOPENED` | Своя запись → `RETURNED`; уведомление |
| — (собственное замечание, `OPEN`) | `deleteRemark` (`DELETE /:humanId/remarks/:id`) | автор замечания | статус `OPEN`, `authorId = user.id` | — (удалено) | — |
| `ALL_CFO_APPROVED` | `sendToDtoe` (`POST /:humanId/send-to-dtoe`) | любой CFO с записью на плане | план в `ALL_CFO_APPROVED` | `UNDER_DTOE_REVIEW` | `sentToDtoeAt`; уведомление ДТОиР |
| `UNDER_DTOE_REVIEW` | `dtoeApprove` (`POST /:humanId/dtoe-approve`) | DTOE | — | `APPROVED_BY_DTOE` | `decidedAt`; уведомление филиала |
| `UNDER_DTOE_REVIEW` | `dtoeReturn` (`POST /:humanId/dtoe-return`) | DTOE | ≥1 `OPEN`-замечание с `cfoId = null` | `RETURNED_BY_DTOE` | Уведомление филиала |
| `RETURNED_BY_DTOE` | `resubmitToDtoe` (`POST /:humanId/resubmit-to-dtoe`) | FILIAL-владелец | — | `UNDER_DTOE_REVIEW` | Уведомление ДТОиР |

Центральный пересчёт (`recomputePlanStatusAfterCfoAction`, портирование
`recomputeStatusAfterCfoAction`): среди всех `isRequired=true`
`PlanCfoStatus` — если хоть один `RETURNED` → `RETURNED_FOR_REVISION`; иначе
если все `APPROVED` (и есть хотя бы одна запись) → `ALL_CFO_APPROVED`; иначе
если есть хоть одна `APPROVED` → `PARTIALLY_APPROVED`; иначе →
`UNDER_CFO_REVIEW`.

Доступ (`checkAccess`): FILIAL видит планы своего филиала; CFO видит планы,
где есть его `PlanCfoStatus`; DTOE/ADMIN видят все (аудит).

### Слоты / состав пакета плана

Табличная модель, зеркало `corrections`: `PlanType` (`id`, `code`, `name`,
`description`, `isActive`, `requirements: PlanPackageRequirement[]`);
`PlanPackageRequirement` (`kind`: `MAIN_EXCEL`|`EXCEL_SHEET`|`DOCUMENT`,
`name`, `isRequired`, `responsibleCfoId`, `namePattern`, `fileFormat`,
`order`, `choiceGroupKey`, `groupLabel`). При `create()` всегда один главный
`PlanDocumentSlot` (`requirementId = null`, `label = 'Excel плана'`) + слот на
каждое требование `EXCEL_SHEET`/`DOCUMENT` типа плана. Комплектация
проверяется тем же алгоритмом `checkPackageComplete`, что и в `corrections`
(включая `choiceGroupKey`-группы «выбрать один из»).

`PlanType`/`PlanPackageRequirement` живут в `apps/backend/src/planning/entities/`
(не в `org/`) — это специфика модуля плана, не общая orgstructure-справочная
сущность (`Filial`/`Cfo`/`FilialCfoLink` остаются в `org/` и переиспользуются
как есть).

### Замечание плана (`PlanRemark`)

Поля/правила — зеркало `Remark`: `id`, `humanId` (`PLR-000001`),
`planId` (CASCADE), `cfoId` (nullable — null = ДТОиР), `authorId`,
`createdAt`, `relatedSlotId`, `fileVersionId`, `sheetName`/`rowRef`/`cellRef`,
`description`, `requiredAction`, `status` (`PlanRemarkStatus`:
`OPEN`→`FIXED_BY_FILIAL`→`CLOSED`/`REOPENED`), `closedById`, `closedAt`.
Права: создание — CFO (своя запись `PENDING`) либо DTOE (план
`UNDER_DTOE_REVIEW`); «исправлено» — только FILIAL-владелец плана; «повторно
открыть» — только CFO-автор; удаление — только автор, только `OPEN`.

## Backend

Новый домен `apps/backend/src/planning/`, параллельный `corrections`, **не
изменяет** `corrections` и его таблицы:

```
planning/
  entities/
    plan.entity.ts                  (Plan, PlanStatus)
    plan-type.entity.ts             (PlanType)
    plan-package-requirement.entity.ts (PlanPackageRequirement, PlanRequirementKind)
    plan-document-slot.entity.ts    (PlanDocumentSlot)
    plan-file-version.entity.ts     (PlanFileVersion)
    plan-cfo-status.entity.ts       (PlanCfoStatus, PlanCfoStatusValue)
    plan-remark.entity.ts           (PlanRemark, PlanRemarkStatus)
    plan-history-entry.entity.ts    (PlanHistoryEntry)
  dto/
    create-plan.dto.ts
    update-plan-type.dto.ts
    cfo-selection.dto.ts
    remark-create.dto.ts
    remark-reopen.dto.ts
    upload-file.dto.ts
    find-plans-query.dto.ts
  planning.mapper.ts
  planning.service.ts
  planning.controller.ts
  files.controller.ts               (GET /plan-files/{id}/download)
  planning.module.ts
  planning.service.spec.ts
  planning.mapper.spec.ts
```

Переиспользуется: `FilialCfoLink`/`Cfo`/`Filial` (`org`), `User`/`Role`
(`users`), `Notification` (`notifications`, +nullable `planId`),
`RolesGuard`/`@Roles` (`common`); файловое хранение — тот же инлайн-паттерн
`fs.mkdir`+`fs.writeFile` под `UPLOADS_DIR`, поддиректория
`planning/<year>/<month>` (без общего файлового сервиса — как и в
`corrections`/`fact-packages`, не рефакторим существующие домены в рамках
этого change).

`PlanningService` — методы, зеркалящие `CorrectionsService`: `create`,
`updatePlanType`, `deletePlan`, `findAll`, `findOne`, `uploadFileVersion`,
`send`, `cfoApprove`, `leaveRemark`, `cfoReturn`, `cancelCfoDecision`,
`resubmit`, `markRemarkFixed`, `reopenRemark`, `deleteRemark`, `sendToDtoe`,
`dtoeApprove`, `dtoeReturn`, `resubmitToDtoe`,
`recomputePlanStatusAfterCfoAction`, `checkPackageComplete`, `checkAccess`,
`notifyUsers`/`cfoUsers`/`filialUsers`/`dtoeUsers`. Все операции, меняющие
статус — в `dataSource.transaction`, структура — 1:1 с
`corrections.service.ts` (`this.log(...)`, `this.notifyUsers(...)`).

Guard на уровне контроллера: `@UseGuards(JwtAuthGuard, RolesGuard)` + сервисные
проверки владения — двойная защита, как в `corrections` (guard не проверяет
владение конкретной записью, это делает сервис).

`Notification.entity.ts`: добавить nullable `planId` (`@ManyToOne`, CASCADE)
рядом с `correctionId`/`factPackageId` — паттерн «ровно одно из трёх полей
заполнено» уже заложен комментарием в существующем коде.

Seed (`apps/backend/src/database/seed.ts`): 1–2 демо `PlanType` с
`PlanPackageRequirement` (аналог текущих `CorrectionType`-сидов), чтобы можно
было руками создать план через UI/API после реализации.

## Frontend

`apps/frontend/app/(private)/planning/` — структура зеркалит
`apps/frontend/app/(private)/corrections/[humanId]/` + `dashboard/`:

```
planning/
  page.tsx                          (рабочий стол — дашборд-карточки по роли)
  create/
    page.tsx
    components/create-plan-form.tsx
  [humanId]/
    page.tsx
    not-found-screen.tsx
    plan-detail-skeleton.tsx
    components/
      plan-detail-view.tsx
      plan-header.tsx
      package-completeness.tsx      (слоты + загрузка версий)
      send-for-review-form.tsx      (выбор ЦФО + отправка)
      resubmit-panel.tsx
      cfo-statuses.tsx
      return-remark-dialog.tsx
      history-log.tsx
      remarks-list/
        remarks-list.tsx
        remarks-columns.tsx
        remarks-action-bar.tsx
        remark-actions-cell.tsx
    edit/
      page.tsx
      components/edit-plan-type-form.tsx
    lib/
      permissions.ts
      use-invalidate-plan.ts
```

Kubb-клиент генерируется из обновлённого `api/src/openapi.yaml`; ручное
редактирование `apps/frontend/packages/api/*/codegen/` запрещено (правило
`openspec/config.yaml`).

Каждый интерактивный элемент документируется по схеме «Что это / Кто видит /
Когда активен / Что происходит» — `apps/frontend/AGENTS.md`.

`apps/frontend/app/(private)/constants.ts` уже указывает модуль «План на
2027» на `/planning` с квик-экшенами Рабочий стол/Файлы/Уведомления — правки
не требуются, кроме проверки, что `/planning/create` доступен из этих
экшенов там, где нужно (аналог кнопки «Создать корректировку» на дашборде
`corrections`, роль `FILIAL`).

## API Shape

Базовый путь `/plans`, тег `Plans`, авторизация — `cookieAuth` (как у
остальных путей), роли — как в матрице `proposal.md`.

- `GET /plans?status=&filialId=&cfoId=&planTypeId=&q=&onlyWithRemarks=&page=&pageSize=`
  — список, видимость по роли (`checkAccess`). Response: `PaginatedPlans`.
- `POST /plans` — тело `{planTypeId: number}`. Только FILIAL. Response:
  `PlanDetail`.
- `GET /plans/{humanId}` — карточка. Response: `PlanDetail`. 403/404 по
  правам доступа.
- `DELETE /plans/{humanId}` — только FILIAL-владелец, статус `DRAFT`.
  Response: `204`.
- `POST /plans/{humanId}/change-type` — тело `{planTypeId: number}`, только
  FILIAL-владелец, статус `DRAFT`. Response: `PlanDetail`.
- `POST /plans/{humanId}/slots/{slotId}/files` — `multipart/form-data`
  (`file`, опционально `note`, `remarkId`). Только FILIAL-владелец, план не в
  финальном статусе. Response: `PlanFileVersion`.
- `POST /plans/{humanId}/send` — тело `PlanCfoSelectionInput`
  (`{cfoIds: number[]}`). Только FILIAL-владелец, статус `DRAFT`, пакет
  укомплектован, все `cfoIds` — активные связи `FilialCfoLink`. Response:
  `PlanDetail`.
- `POST /plans/{humanId}/resubmit` — то же тело, статус
  `RETURNED_FOR_REVISION`, только FILIAL-владелец. Response: `PlanDetail`.
- `POST /plans/{humanId}/cfo-approve` — только CFO с записью `PENDING`.
  Response: `PlanDetail`.
- `POST /plans/{humanId}/cfo-return` — только CFO с записью `PENDING`, ≥1
  собственное `OPEN`-замечание. Response: `PlanDetail`.
- `POST /plans/{humanId}/cfo-cancel` — только CFO, своя запись ≠ `PENDING`.
  Response: `PlanDetail`.
- `POST /plans/{humanId}/remarks` — тело `PlanRemarkCreateInput`. CFO (своя
  запись `PENDING`) либо DTOE (план `UNDER_DTOE_REVIEW`). Response:
  `PlanDetail`.
- `POST /plans/{humanId}/remarks/{remarkId}/fix` — только FILIAL-владелец.
  Response: `PlanRemark`.
- `POST /plans/{humanId}/remarks/{remarkId}/reopen` — только CFO-автор
  замечания. Response: `PlanDetail`.
- `DELETE /plans/{humanId}/remarks/{remarkId}` — только автор, статус `OPEN`.
  Response: `204`.
- `POST /plans/{humanId}/send-to-dtoe` — любой CFO с записью на плане, статус
  `ALL_CFO_APPROVED`. Response: `PlanDetail`.
- `POST /plans/{humanId}/resubmit-to-dtoe` — только FILIAL-владелец, статус
  `RETURNED_BY_DTOE`. Response: `PlanDetail`.
- `POST /plans/{humanId}/dtoe-approve` — только DTOE, статус
  `UNDER_DTOE_REVIEW`. Response: `PlanDetail`.
- `POST /plans/{humanId}/dtoe-return` — только DTOE, статус
  `UNDER_DTOE_REVIEW`, ≥1 `OPEN`-замечание с `cfoId = null`. Response:
  `PlanDetail`.
- `GET /plans-stats` (+ `-filial`/`-cfo`/`-dtoe` варианты) — дашборд-статистика,
  роль-специфичная, зеркало `corrections-stats*`.
- `GET /org/plan-types`, `GET /org/plan-types/{id}`,
  `POST /org/plan-types/{id}/requirements` — справочник типов плана
  (админ-функция, зеркало `org-correction-types*`).
- `GET /plan-files/{id}/download` — скачивание версии файла, доступ как
  `checkAccess` (роль + владение планом).

Схемы — `api/src/components/schemas/`: `plan-status.yaml`, `plan-type.yaml`,
`plan.yaml` (`Plan`, `PlanListItem`, `PaginatedPlans`), `plan-detail.yaml`
(`PlanDetail`, `PlanCfoSelectionInput`), `plan-cfo-status.yaml`,
`plan-history-entry.yaml`, `plan-remark.yaml` (`PlanRemark`,
`PlanRemarkCreateInput`), `plan-stats.yaml`.

Обратная совместимость: только аддитивные изменения контракта — новые схемы
и пути; существующие `Correction*`/`corrections`, `FactPackage*`/
`fact-packages` пути не меняются.

## Files / Owners

- API: `api/src/openapi.yaml`, `api/src/paths/plans*.yaml`,
  `api/src/paths/org-plan-types*.yaml`,
  `api/src/paths/plan-files-id-download.yaml`,
  `api/src/components/schemas/plan-*.yaml` — владелец: разработчик,
  создавший change (первая задача `1.1`).
- Backend: `apps/backend/src/planning/**`,
  `apps/backend/src/notifications/entities/notification.entity.ts`
  (только добавление nullable `planId`) — не трогает
  `apps/backend/src/corrections/**`/`apps/backend/src/fact-packages/**`.
- Frontend: `apps/frontend/app/(private)/planning/**`,
  `apps/frontend/packages/api/*/codegen/**` (генерируется, не редактируется
  вручную).

## Тестовая стратегия

Риск: **P0** (полноценный продуктовый flow с правами/статусами/деньгами —
по аналогии с `corrections`, покрытой P0).

TDD-порядок по ключевым сценариям — для каждого Requirement/Scenario из
`specs/planning-2027-package-review/spec.md`: failing test → минимальная
реализация → green → refactor.

Backend: unit/feature-тесты сервиса (`planning.service.spec.ts`) на каждый
guard (роль/владение/статус), пересчёт статуса после действий ЦФО, negative
paths (чужой филиал, отправка не связанному ЦФО, замечание не тем ЦФО/не в
своей проверке, повторная отправка без исправленных замечаний, финальное
решение не-ДТОиР, загрузка после `APPROVED_BY_DTOE`). E2E
(`test/planning.e2e-spec.ts`) — happy path (создание → загрузка всех
обязательных слотов → send нескольким ЦФО → cfoApprove всеми →
sendToDtoe → dtoeApprove) и сквозной negative path (возврат ЦФО с замечанием
→ доработка → resubmit блокируется до фикса замечания → после фикса
проходит). Учитывать известный нюанс проекта: `@Post()` без `@HttpCode`
возвращает `201`, не `200` — использовать `.expect(201)` в новых e2e-тестах;
e2e-раннер в этом окружении может не запускаться (баг Bun/Jest,
`callSite.getFileName is not a function`) — тогда `bunx tsc --noEmit` по
e2e-файлу + ручной `bun -e` HTTP smoke-test внутри `infra-backend-1`.

Frontend: component-тесты (Vitest Browser Mode) на создание плана, таблицу
слотов (кнопки по ролям/статусам), панель отправки (выбор ЦФО из
`availablePlanCfos`), список замечаний (кнопки «Исправлено»/«Удалить»/
«Открыть заново» по владению и статусу), статусы ЦФО, финальное решение
ДТОиР. Моки — `nextNavigationMock`,
`vi.mock('@/packages/api/base/codegen', ...)`, паттерны из
`apps/frontend/app/(private)/corrections/[humanId]/components/**`.

Verification gates: `openspec validate planning-2027-package-review --strict
--no-interactive`; API `npm run lint` (+ `npm run bundle` при необходимости)
из `api/`; Backend `bun run test`, `bun run lint` из `apps/backend`
(`bun run test:e2e` — если окружение позволяет, иначе см. фолбэк выше);
Frontend `bun run typecheck`, `bun run lint`, `bun run test` из
`apps/frontend`.

## План отката

Change полностью аддитивен: новый backend-домен, новые таблицы, новые
API-пути/схемы, новые экраны поверх существующей заглушки. Откат — ревёрт
коммитов change; существующие домены `corrections`/`fact-packages` и
остальной продукт не затрагиваются. `Notification.planId` — аддитивное
nullable-поле, откат не требует данных-миграций назад (таблицы `planning`
можно оставить неиспользуемыми либо удалить отдельной миграцией).
