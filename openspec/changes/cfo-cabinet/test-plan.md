# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Плитки статистики на дашборде ЦФО | Плитки показывают статистику ЦФО | P2 | Component | — | **Not covered** — переиспользует уже покрытый (в другом change) `CorrectionStatsGrid`, но сценарий с подписями ЦФО отдельно не тестировался |
| Распределение корректировок по статусу ЦФО на дашборде | График показывает 3 группы с числом каждой | P1 | Component | — | **Not covered** — план: `cfo-corrections-overview.component.test.tsx` |
| Независимые фильтры таблицы корректировок ЦФО по статусу и по филиалу | Выбор статуса в фильтре сужает таблицу | P1 | Component | — | **Not covered** |
| Независимые фильтры таблицы корректировок ЦФО по статусу и по филиалу | Выбор филиала в фильтре сужает таблицу независимо от статуса | P1 | Component | — | **Not covered** |
| Независимые фильтры таблицы корректировок ЦФО по статусу и по филиалу | Клик по сегменту графика выставляет фильтр статуса | P1 | Component | — | **Not covered** |
| Независимые фильтры таблицы корректировок ЦФО по статусу и по филиалу | Повторный клик по тому же сегменту сбрасывает фильтр статуса | P2 | Component | — | **Not covered** |
| Таблица «Направленные корректировки» на дашборде ЦФО | Таблица показывает список направленных корректировок | P1 | Component | — | **Not covered** |
| Таблица «Направленные корректировки» на дашборде ЦФО | Статус пакета и статус ЦФО могут отличаться в одной строке | P1 | Component | — | **Not covered** |
| Таблица «Направленные корректировки» на дашборде ЦФО | Кнопка «Открыть» переходит на карточку корректировки | P0 | E2E | — | **Not covered** |
| Таблица «Направленные корректировки» на дашборде ЦФО | Пустое состояние при отсутствии направленных корректировок | P2 | Component | — | **Not covered** |

Дополнительно (правки уже открытого `correction-detail-page`, покрытие
продублировано в его собственном `test-plan.md`):

| Requirement (correction-detail-page) | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Оставление замечания к элементу пакета | ЦФО оставляет замечание к элементу, не теряя доступ к остальным (кнопка в строке, `relatedSlotId`, статус не меняется) | P0 | Component | `package-completeness.component.test.tsx` | Done — 8/8 тестов green, включая `relatedSlotId` в payload и «кнопка не пропадает после первого замечания»; подтверждено `curl` (COR-000009, два замечания подряд без изменения статуса) |
| Финализация возврата на доработку | ЦФО финализирует возврат после одного или нескольких замечаний / недоступно без единого замечания | P1 | Component + Unit | `remarks-list.component.test.tsx`, `corrections.service.spec.ts` | Done — component 2/2, unit 2/2 (guard «нет замечаний» + «игнорирует чужие»); подтверждено `curl` (400 без замечаний, успех после двух) |
| Согласование корректировки ЦФО / Финализация возврата | Второй проверяющий не может отправить решение поверх уже принятого (backend guard) | P1 | Unit | `corrections.service.spec.ts` | Done — 2/2 теста (approve + return); подтверждено живым `curl` (повторный `cfo-approve` → 400) |

## Required automated tests

### Unit
- [x] Backend: `corrections.service.spec.ts` — guard `PENDING` в `cfoApprove`/`cfoReturn`, guard'ы `leaveRemark` (роль/статус), guard «нет замечаний» и «игнорирует чужие» в `cfoReturn`. 8/8 green (23/23 весь файл суммарно с существующими).
- [x] Frontend: `permissions.unit.test.ts` — `canLeaveRemarkAsCfo`/`Dtoe` (переименованы из `canReturnAsCfo`/`Dtoe`, логика прежняя), `canFinalizeReturnAsCfo`/`Dtoe` (новые, 6 кейсов). 31/31 green (весь файл).

### Component
- [ ] `CfoCorrectionsOverview` — донат по `myCfoStatus`, независимость двух фильтров, клик по сегменту, сброс по повторному клику, пустое состояние, кнопка «Открыть». Не написан (см. Gaps); поведение подтверждено только ручной HTTP-проверкой данных, не в браузере.
- [x] `PackageCompleteness` — видимость «Оставить замечание к элементу» по роли/статусу, скрытие для филиала, `relatedSlotId` в payload мутации, кнопка не пропадает после первого замечания. 8/8 green.
- [x] `RemarksList` — регресс после удаления `ReturnRemarkDialog` из `RemarksActionBar`, новая кнопка «Вернуть на доработку» видна только при наличии открытого замечания. 9/9 green.

### Integration
_(не вводится — см. `apps/frontend/AGENTS.md`)_

### E2E
- [ ] Happy path: `/dashboard` (роль CFO) → фильтр по филиалу и по статусу одновременно → «Открыть» → карточка `/corrections/{humanId}` → «Оставить замечание к элементу» к двум разным элементам подряд (кнопки остаются доступны) → «Вернуть на доработку» в общей панели → статус переходит в «Возвращено на доработку», оба замечания видны в блоке «Замечания».

### Backend
- [x] `corrections.service.spec.ts` (см. Unit выше).
- [ ] e2e (`*.e2e-spec.ts`): `POST /corrections/{humanId}/cfo-approve` дважды подряд → второй запрос `400`; `POST /corrections/{humanId}/cfo-return` без замечаний → `400`; после `POST .../remarks` × 2 → `POST .../cfo-return` → `200`. Эквивалент проверен вручную через `curl` (см. Manual checks), формальный e2e-тест не написан.

## Manual checks
- [x] Ручная HTTP-проверка через `curl` под демо-аккаунтами `filial.donbassgaz@demo.local`
  и `cfo.angnks@demo.local` (дев-окружение поднято в `docker compose`, детали —
  `tasks.md`, 5.2/5.3): `POST /corrections` → загрузка файлов в слоты →
  `POST /corrections/{humanId}/send` двум ЦФО → `GET /corrections/stats/cfo`
  (`{"total":2,"inReview":0,"returned":1,"approved":1}`) и
  `GET /corrections?pageSize=100` (`myCfoStatus` заполнен: `APPROVED`/`RETURNED`
  по двум разным корректировкам, `filial` вложен) — форма ответа соответствует
  ожиданиям `CfoCorrectionsOverview`. `POST /cfo-approve` дважды подряд → второй
  запрос `400` (guard). `POST /remarks` с `relatedSlotId=14` → в ответе
  `remarks[0].relatedSlotId === 14`. После рефакторинга на два действия
  (COR-000009): `POST /remarks` дважды подряд к разным элементам — статус
  корректировки и статус ЦФО не меняются между вызовами (`UNDER_CFO_REVIEW`/
  `PENDING`); `POST /cfo-return` без единого замечания на свежей корректировке
  → `400` («Нельзя вернуть на доработку без ни одного оставленного
  замечания»); `POST /cfo-return` после двух `POST /remarks` → `200`,
  `RETURNED_FOR_REVISION`/`RETURNED`.
- [ ] Визуальная проверка `/dashboard` под ролью CFO непосредственно в браузере
  (не curl) — не выполнена в этой сессии; ссылка передана пользователю для
  самостоятельной проверки.

## Gaps (на момент фиксации)

Автотесты и статические проверки выполнены (backend `bunx tsc --noEmit` — 0
ошибок, `bun run test` — 23/23; frontend `bunx tsc --noEmit` — 0 ошибок,
`bun run lint` — 0 в изменённых файлах, `bun run test` — 27/27 файлов, 135/135
тестов green) — все внутри dev-контейнеров `infra/docker-compose.dev.yml` после
обнаружения и исправления неверного bind-mount (см. `tasks.md`, 5.2) и
доустановки Chromium для component-тестов. Единственный оставшийся пробел —
component-тест `CfoCorrectionsOverview` (3.1.3 в `tasks.md`) не написан;
поведение его данных подтверждено ручной HTTP-проверкой выше, но не поведение
в браузере (клик по графику, независимость двух фильтров). Это блокирует
архивацию change по правилу `openspec/config.yaml` («для P0/P1 отсутствие
покрытия блокирует завершение change») до выполнения задачи 5.4 из `tasks.md`.

## Test data
- Существующие backend seed-аккаунты (`apps/backend/src/database/seed.ts`):
  4 филиала × 17 ЦФО, по одному FILIAL/CFO-аккаунту на каждый.
- Для ручной проверки (когда окружение будет доступно) — любой `*.cfo@demo.local`
  с несколькими направленными корректировками от разных филиалов.

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- `/org/filials`/`/org/cfos` backend-эндпоинты (см. `design.md`, Decision)
- Остальные экраны ДТОиР (вне scope этого change)

## Verification commands
- [ ] `openspec validate cfo-cabinet --strict --no-interactive` — CLI недоступен ни на хосте, ни в контейнерах
- [x] frontend: `bunx tsc --noEmit -p tsconfig.json` (в контейнере) — 0 ошибок
- [x] frontend: `bun run lint` (в контейнере) — 0 в изменённых файлах (152 preexisting в `codegen/**`)
- [x] frontend: `bun run test` (в контейнере) — 27/27 файлов, 135/135 тестов green
- [ ] frontend: `bun run build` — не выполнено (dev-режим, не проверялась production-сборка)
- [x] backend: `bunx tsc --noEmit` (в контейнере) — 0 ошибок
- [ ] backend: `eslint` — не выполнено отдельно (покрыто `tsc`; не запускалось явно)
- [x] backend: `bun run test` (в контейнере) — 23/23 green
- [ ] api: `npm run lint` — не выполнено (не проверялся отдельный `api/` контейнер)
