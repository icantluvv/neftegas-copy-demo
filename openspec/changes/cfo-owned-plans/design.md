## Изучено перед проектированием

- `apps/backend/src/fact-packages/entities/fact-package.entity.ts`,
  `fact-packages.service.ts` (`create`, `submit`, `submitCfoOwnPackage`) —
  эталонная реализация.
- [[cfo-initiated-corrections]] `design.md` — тот же паттерн, уже
  спроектированный для Корректировки; этот документ — его зеркало для
  `Plan`, различия отмечены явно.
- `apps/backend/src/planning/entities/plan.entity.ts`,
  `planning.service.ts` (`create`, `sendToDtoe`, `checkAccess`, `findAll`,
  `toDetailDto`, `deletePlan`) — состояние на момент разведки: `filialId`
  non-nullable, `cfoId` отсутствует, `create()` — только `FILIAL`,
  `sendToDtoe()` требует `PlanCfoStatus`-строку и статус `ALL_CFO_APPROVED`.

## Отличия от `Plan` vs `Correction` (важно при портировании)

- В `Plan` НЕТ унаследованного `InitiatorKind`-скаффолдинга (в отличие от
  `Correction` на момент начала [[cfo-initiated-corrections]]) — чистый
  лист, ничего удалять не нужно, только добавить `cfoId`/`cfo`.
- `filialId` в `Plan` пока non-nullable (`@Column() filialId: number;`) —
  нужно сделать nullable при добавлении `cfoId` (как и в `Correction`).
- Метод направления в ДТОиР называется так же — `sendToDtoe()`
  (`planning.service.ts`) — паттерн ветки идентичен `cfo-initiated-corrections`.
- API-контракт для `Plan` физически отсутствует в `dev` на момент этого
  change (см. `proposal.md` → «Зависимость») — писать `plan.yaml`/
  `plan-detail.yaml` изменения нужно поверх контракта из
  `feat/planning-2027-api-contract` после его слияния, либо воссоздать
  недостающие файлы этим change, если так быстрее (решается по факту, когда
  подходит очередь работы над бэкендом этого change).

## Backend

### Модель данных

`Plan` (`apps/backend/src/planning/entities/plan.entity.ts`):

```ts
@Column({ type: 'int', nullable: true })
filialId: number | null;   // было non-nullable

@ManyToOne(() => Cfo, { onDelete: 'RESTRICT', nullable: true })
@JoinColumn({ name: 'cfoId' })
cfo: Relation<Cfo> | null;
@Column({ type: 'int', nullable: true })
cfoId: number | null;
```

Doc-комментарий — зеркало `Correction`: «Ровно одно из `filialId`/`cfoId`
заполнено».

### Сервис (`planning.service.ts`)

Зеркало правок `corrections.service.ts` из [[cfo-initiated-corrections]] →
`design.md` → «Сервис»:

- `create()` — guard расширяется на `(FILIAL && filialId) || (CFO &&
  cfoId)`.
- `sendToDtoe()` — новая ветка `isCfoOwner` (статус из `DRAFT`/
  `RETURNED_BY_DTOE`, минуя `ALL_CFO_APPROVED`).
- `checkAccess()` — `Role.CFO` — `plan.cfoId === user.cfoId ||
  cfoStatuses.exist(...)`.
- `findAll()` — `Role.CFO` — `OR p.cfoId = :myCfoId`.
- `toDetailDto()` — добавить `isCfoOwner`.
- `deletePlan()` — guard расширяется на владельца-ЦФО.

## Frontend

Зеркало [[cfo-initiated-corrections]] → `design.md` → «Frontend», с заменой
Correction→Plan, `/corrections`→`/planning`:

- `planning/create/page.tsx` — гвард на `CFO`.
- `constants.ts` — пункт «Создать план» — `roles: ["FILIAL", "CFO"]`.
- `dashboard/components/cfo-plans-overview.tsx` (или
  `planning/components/cfo-plans-overview.tsx` — уточнить актуальное имя
  файла на момент старта frontend-части, после мержа
  `feat/planning-2027-frontend-dashboard`) — кнопка «+ Создать план».
- `planning/[humanId]/lib/permissions.ts` — `canSendToDtoeAsOwner`.
- Submit-панель карточки плана — ветка владельца.

## Дизайн (UI)

Идентично [[cfo-initiated-corrections]] — переиспользование существующих
паттернов (кнопка «Направить в ДТОиР», кнопка «+ Создать план» =
`buttonVariants()`), без нового визуального стиля. Открытых вопросов нет.

## API Shape

См. `proposal.md` → «Зависимость». Изменения (после появления базового
`plan.yaml`/`plan-detail.yaml` в `dev`):

- `plan.yaml` — `Plan.filialId` → nullable, добавить `cfoId` (nullable
  integer).
- `plan-detail.yaml` — `PlanDetail` — добавить `isCfoOwner` (boolean,
  required), `filial` — nullable.
- `plans.yaml` (`POST`) — `description` — «Доступно ролям FILIAL и CFO».
- `plans-human-id-send-to-dtoe.yaml` — `description` — ветка владельца-ЦФО.

## Readiness Decision

`ready with conditions` — backend/API-часть готова к реализации сразу;
frontend-часть блокирована мержем
`feat/planning-2027-frontend-create-detail`/`-dashboard` в `dev` (см.
`proposal.md` → «Порядок относительно других change»).

## Тестовая стратегия

Зеркало [[cfo-initiated-corrections]] → `design.md` → «Тестовая стратегия»,
с заменой `corrections.service.spec.ts` → `planning.service.spec.ts`,
демо-аккаунтов — теми же (`cfo.angnks@demo.local`, `dtoe@demo.local`).
