## Why

Сейчас единственный инициатор корректировки — Филиал: он создаёт `Correction`,
направляет её выбранным ЦФО, после согласования всех ЦФО — направляет в ДТОиР.
ЦФО выступает только проверяющим, никогда — инициатором.

Бизнес-запрос (уточнён с пользователем, сужен относительно первой версии этого
change): ЦФО должен уметь создать собственный пакет и направить его **сразу в
ДТОиР**, минуя цикл согласования — 1:1 по механике с уже реализованным в
модуле «Факт» (`FactPackage.filialId`/`cfoId`, `submitCfoOwnPackage()`). Ветка
«ЦФО направляет филиалам на согласование» из первой версии proposal —
**отложена**, ЦФО ни в одном модуле никому, кроме ДТОиР, ничего не направляет.

Та же фича параллельно вводится в модуль «План на 2027» — отдельный change
[[cfo-owned-plans]].

## What Changes

- **Backend, модель данных**: `Correction` получает `cfoId`/`cfo` (nullable,
  зеркало `filialId`) — ровно одно из `filialId`/`cfoId` заполнено. Ранее
  добавленные `InitiatorKind`/`TargetKind`/`initiatorFilialId`/
  `initiatorCfoId`/`CorrectionFilialStatus` (из первой, более широкой версии
  этого change) — **удаляются**: не использовались нигде за пределами
  объявления сущности, а после сужения scope не нужны вовсе (см. «Влияние на
  качество» — почему это безопасно).
- **Backend, создание**: `POST /corrections` доступен ролям `FILIAL` и `CFO`
  (было — только `FILIAL`); при роли `CFO` сервис сам проставляет
  `cfoId: user.cfoId`, `filialId: null`.
- **Backend, направление**: существующий `POST
  /corrections/{humanId}/send-to-dtoe` (роль `CFO`) расширяется веткой
  «владелец пакета»: если `correction.cfoId === user.cfoId`, направление
  разрешено из `DRAFT`/`RETURNED_BY_DTOE` (без требования `ALL_CFO_APPROVED`)
  и переводит статус сразу в `UNDER_DTOE_REVIEW` — новый отдельный эндпоинт не
  нужен, ветка добавляется в уже существующий `sendToDtoe()`.
- **Backend, видимость и доступ**: `findAll`/`checkAccess`/`toDetailDto`
  расширяются флагом `isCfoOwner` (по аналогии с `isFilialOwner`), CFO видит
  созданные им корректировки в общем списке.
- **API-контракт**: `Correction`/`CorrectionCreateInput` — nullable `cfoId`;
  `CorrectionDetail` — новый `isCfoOwner`; описание `POST /corrections` и
  `POST /corrections/{humanId}/send-to-dtoe` уточняется под обе роли-владельца.
  Никаких новых путей/схем.
- **Frontend, создание**: `corrections/create/page.tsx` — гвард расширяется на
  `CFO`; форма не меняется (один и тот же выбор `correctionTypeId`). Пункт
  меню «Создать корректировку» — `roles: ["FILIAL", "CFO"]`.
- **Frontend, карточка корректировки**: `permissions.ts` — `canSendToDtoe`
  расширяется веткой `isCfoOwner`; панель отправки показывает простую кнопку
  «Направить в ДТОиР» без выбора (по аналогии с `fact-submit-panel.tsx`'s
  `isCfoOwner`-веткой).
- **Frontend, кабинет ЦФО**: `cfo-corrections-overview.tsx` получает кнопку
  «+ Создать корректировку» (по аналогии с `filial-corrections-overview.tsx`).

## Capabilities

### New Capabilities

- `cfo-owned-corrections`: ЦФО создаёт корректировку и направляет её сразу в
  ДТОиР, минуя цикл согласования другими ЦФО; финальное решение ДТОиР — без
  изменений (`dtoeApprove`/`dtoeReturn`).

### Modified Capabilities

_(нет — `role-scoped-sections` не меняется по контракту.)_

## Impact

- **Backend**: `apps/backend/src/corrections/entities/correction.entity.ts`
  (удалить `InitiatorKind`/`TargetKind`-скаффолдинг, добавить `cfoId`/`cfo`),
  удалить `entities/correction-filial-status.entity.ts`, откатить
  `entities/remark.entity.ts` (`filialId`) — не нужен без ветки филиала-
  проверяющего, `corrections.module.ts` (убрать регистрацию
  `CorrectionFilialStatus`), `corrections.service.ts` (`create`, `sendToDtoe`,
  `checkAccess`, `findAll`, `toDetailDto`, `deleteCorrection`),
  `corrections.controller.ts` (`@Roles` на `create`), `database/seed.ts`
  (демо-корректировка с `cfoId` заполненным).
- **API-контракт**: `api/src/paths/corrections.yaml`,
  `corrections-human-id-send-to-dtoe.yaml`, `components/schemas/correction.yaml`,
  `correction-detail.yaml`.
- **Frontend**: `apps/frontend/app/(private)/corrections/create/page.tsx`,
  `apps/frontend/app/(private)/constants.ts` (`navItems` роль `CFO`),
  `.../corrections/[humanId]/lib/permissions.ts`,
  `.../corrections/[humanId]/components/send-for-review-form.tsx` (или новый
  `cfo-owner-submit-panel.tsx`), `.../dashboard/components/cfo-corrections-overview.tsx`;
  Kubb-кодоген `apps/frontend/packages/api/base/codegen/**`.
- **Вне области**: направление ЦФО филиалам на согласование (отложено, будет
  отдельным change при необходимости); «ДТОиР» как строка справочника `cfos`
  (не нужна без пикера направления — направление всегда одно).

## Влияние на качество

- **Уровень риска**: P1 — новая capability, но узкая (переиспользует
  существующий эндпоинт и существующий финальный цикл ДТОиР, без нового
  статус-цикла).
- **Затронутые маршруты**: `/corrections/create` (доступ для `CFO`),
  `/corrections/[humanId]` (кнопка «Направить в ДТОиР» для владельца-ЦФО),
  `/dashboard` (кнопка создания в кабинете ЦФО).
- **TDD-порядок**: failing test → минимальная реализация → green → refactor,
  по каждому Requirement `specs/cfo-initiated-corrections/spec.md` — см.
  `tasks.md`.
- **Обязательные уровни проверки**: Static (`tsc --noEmit`, `eslint` FE и
  BE); Backend Unit (`corrections.service.spec.ts`); Backend Feature/E2E
  (happy path ЦФО создаёт → направляет в ДТОиР → ДТОиР согласовывает);
  Frontend Component (`create-correction-form` доступ CFO, submit-panel
  ветка владельца, `permissions.unit.test.ts`).
- **План отката**: аддитивно на уровне контракта (nullable `cfoId`, новый
  `isCfoOwner`); удаление неиспользованного `InitiatorKind`-скаффолдинга —
  `synchronize: true` в dev, данных по нему не существует (ни одна
  корректировка ещё не создана с `initiatorKind = CFO`), откат безопасен.

## Открытый процессный вопрос

Правило этого change (унаследовано из первой версии): все уточнения и
решения, включая дизайн UI, фиксируются в артефактах этого change сразу, не
пост-фактум.
