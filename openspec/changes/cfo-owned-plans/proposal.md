## Why

Та же бизнес-потребность, что и в [[cfo-initiated-corrections]] (Корректировка)
и уже реализованная в модуле «Факт»: ЦФО должен уметь создать собственный
план и направить его сразу в ДТОиР, минуя цикл согласования другими ЦФО.
Модуль «План на 2027» (`apps/backend/src/planning/`,
`apps/frontend/app/(private)/planning/`) сейчас позволяет создавать план
только роли `FILIAL`.

**Зависимость**: frontend-часть модуля «План на 2027» (create/detail/
dashboard) на момент создания этого change ещё не влита в `dev` — ветки
`feat/planning-2027-frontend-create-detail`/`-frontend-dashboard` ждут
ревью. Backend-домен планирования уже в `dev`. Backend/API-часть этого
change можно начинать сразу; frontend-часть — только после мержа тех веток
(иначе не на чем строить: страниц `/planning/create`, `/planning/[humanId]`
в `dev` ещё нет).

## What Changes

- **Backend, модель данных**: `Plan` получает `cfoId`/`cfo` (nullable,
  зеркало `filialId`, по образцу `Correction.cfoId` из
  [[cfo-initiated-corrections]] и `FactPackage.cfoId`).
- **Backend, создание**: `POST /plans` доступен ролям `FILIAL` и `CFO`; при
  роли `CFO` сервис проставляет `cfoId: user.cfoId`, `filialId: null`.
- **Backend, направление**: существующий `POST
  /plans/{humanId}/send-to-dtoe` (роль `CFO`) расширяется веткой «владелец
  пакета» — направление из `DRAFT`/`RETURNED_BY_DTOE`, минуя
  `ALL_CFO_APPROVED`.
- **Backend, видимость и доступ**: `findAll`/`checkAccess`/`toDetailDto`
  расширяются флагом `isCfoOwner`.
- **API-контракт**: `api/src/paths/plans*.yaml`/`components/schemas/plan*.yaml`
  на момент создания этого change отсутствуют в дереве `dev` (живут на
  неслитой `feat/planning-2027-api-contract`) — этот change добавляет
  `cfoId`/`isCfoOwner` поверх того контракта после его слияния (или
  воссоздаёт недостающие файлы, если слияние API-ветки произойдёт позже
  этого change — см. `design.md`).
- **Frontend**: `planning/create/page.tsx` — гвард на `CFO`; кнопка «+
  Создать план» в кабинете ЦФО; `permissions.ts` — `canSendToDtoeAsOwner`;
  submit-панель карточки плана — ветка владельца.

## Capabilities

### New Capabilities

- `cfo-owned-plans`: ЦФО создаёт план и направляет его сразу в ДТОиР, минуя
  цикл согласования другими ЦФО; финальное решение ДТОиР — без изменений.

## Impact

- **Backend**: `apps/backend/src/planning/entities/plan.entity.ts`,
  `planning.service.ts` (`create`, `sendToDtoe`, `checkAccess`, `findAll`,
  `toDetailDto`, `deletePlan`), `planning.controller.ts` (`@Roles`),
  `database/seed.ts`.
- **API-контракт**: см. «Зависимость» выше.
- **Frontend**: `apps/frontend/app/(private)/planning/create/page.tsx`,
  `constants.ts`, `[humanId]/lib/permissions.ts`, submit-панель карточки
  плана, `components/cfo-plans-overview.tsx`.

## Влияние на качество

- **Уровень риска**: P1 — узкая capability, переиспользует существующий
  эндпоинт и существующий финальный цикл ДТОиР.
- **TDD-порядок**: failing test → минимальная реализация → green → refactor,
  по `specs/cfo-owned-plans/spec.md` — см. `tasks.md`.
- **Обязательные уровни проверки**: Static, Backend Unit
  (`planning.service.spec.ts`), Frontend Component/Unit.
- **План отката**: аддитивно (nullable `cfoId`, новый `isCfoOwner`), откат —
  revert коммитов (`synchronize: true` в dev).

## Порядок относительно других change

Начинать backend/API-часть можно сразу (независимо от
[[cfo-initiated-corrections]] — независимый домен). Frontend-часть — после
мержа `feat/planning-2027-frontend-create-detail` и
`feat/planning-2027-frontend-dashboard` в `dev`.
