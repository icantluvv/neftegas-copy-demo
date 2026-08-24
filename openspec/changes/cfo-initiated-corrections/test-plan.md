## Риск

P0 — новая продуктовая capability, новая модель данных, расширение прав
доступа (`POST /corrections` открывается роли `CFO`), новый статус-цикл.

## TDD workflow

Backend: failing unit-тест в `corrections.service.spec.ts` (по образцу уже
существующих describe-блоков для `cfoApprove`/`cfoReturn`/`sendToDtoe`) →
минимальная реализация → green → refactor; ключевые HTTP-маршруты — отдельным
`*.e2e-spec.ts`. Frontend: failing unit/component/E2E по риску → компоненты/
хуки/API-интеграция → green → refactor. Порядок задач в `tasks.md` соблюдает
test-first (тестовая задача предшествует задаче реализации в рамках одного
пункта).

## Покрытие сценариев

| Requirement | Scenario | Приоритет | Тип теста | Файл | Статус |
|---|---|---|---|---|---|
| Создание корректировки ролью ЦФО | ЦФО создаёт корректировку | P0 | Unit | `corrections.service.spec.ts` | Planned |
| Создание корректировки ролью ЦФО | Роль без организационной привязки не может создать | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Направление филиалу(ам)/ДТОиР ролью ЦФО | ЦФО направляет нескольким филиалам | P0 | Unit + E2E | `corrections.service.spec.ts`, `cfo-initiated-correction.e2e.spec.ts` | Planned |
| Направление филиалу(ам)/ДТОиР ролью ЦФО | ЦФО направляет напрямую в ДТОиР | P0 | Unit + E2E | `corrections.service.spec.ts`, `cfo-initiated-correction.e2e.spec.ts` | Planned |
| Направление филиалу(ам)/ДТОиР ролью ЦФО | Блокировка при неукомплектованном пакете | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Направление филиалу(ам)/ДТОиР ролью ЦФО | Не-автор не может направить | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Согласование филиалом-проверяющим | Филиал согласовывает | P0 | Unit + Component | `corrections.service.spec.ts`, `remarks-action-bar.component.test.tsx` | Planned |
| Согласование филиалом-проверяющим | Второй раз согласовать нельзя | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Возврат филиалом-проверяющим с замечанием | Филиал оставляет замечание и возвращает | P0 | Unit + Component | `corrections.service.spec.ts`, `remarks-action-bar.component.test.tsx` | Planned |
| Возврат филиалом-проверяющим с замечанием | Нельзя вернуть без замечаний | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Отмена решения филиала-проверяющего | Филиал отменяет собственное решение | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Отмена решения филиала-проверяющего | Нельзя отменить после передачи в ДТОиР | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Повторное направление филиалам после доработки | ЦФО повторно направляет после исправления | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Видимость ЦФО-инициированных корректировок | ЦФО видит созданные им корректировки | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Видимость ЦФО-инициированных корректировок | Филиал видит корректировки, где он проверяющий | P1 | Unit | `corrections.service.spec.ts` | Planned |
| ДТОиР как строка справочника ЦФО | ДТОиР не в обычном списке ЦФО филиала | P1 | Unit | `corrections.service.spec.ts` | Planned |
| ДТОиР как строка справочника ЦФО | Финальное решение ДТОиР не меняется | P0 | Unit + E2E | `corrections.service.spec.ts`, `cfo-initiated-correction.e2e.spec.ts` | Planned |
| Доступ к созданию корректировки в интерфейсе | Пункт меню виден ЦФО | P2 | Component | `sidebar-nav` существующий набор тестов (расширить фикстуру ролей) | Planned |

## Backend Unit/Feature

Все Unit-сценарии — `apps/backend/src/corrections/corrections.service.spec.ts`,
новые describe-блоки: `create (CFO)`, `sendAsCfo`, `filialApprove`,
`filialReturn`, `cancelFilialDecision`, `resubmitToFilials`, `findAll (видимость)`,
`checkAccess`, `getStats`, `toDetailDto (initiator/filialStatuses)`,
`deleteCorrection (CFO owner)`. Backend e2e —
`apps/backend/test/*.e2e-spec.ts` (по существующему паттерну, файл под задачу
2.5.3 из `tasks.md`).

## Frontend Unit/Component/E2E

Unit: `permissions.unit.test.ts` (новые guard-функции филиала-проверяющего).
Component: `create-correction-form.component.test.tsx` (выбор направления),
`remarks-action-bar.component.test.tsx` (блок действий филиала),
`dtoe-corrections-overview.component.test.tsx` (новый файл),
`filial-corrections-overview.component.test.tsx` (раздел «на согласовании от
ЦФО»). E2E: один сквозной `cfo-initiated-correction.e2e.spec.ts` — happy path
ЦФО→Филиал(ы)→(опц.)→ДТОиР и отдельно ЦФО→ДТОиР напрямую (можно в одном файле
двумя тестами). Моки/фикстуры — переиспользовать паттерны
`apps/frontend/app/(private)/corrections/[humanId]/components/remarks-list/remarks-list.component.test.tsx`
и `filial-corrections-overview.tsx` существующих тестов (typed fixtures на
основе Kubb-типов, без ручных `any`).

## Test data

`apps/backend/src/database/seed.ts`: 18-я строка `cfos` («ДТОиР»), минимум
одна демо-корректировка `initiatorKind = CFO` в статусе `UNDER_FILIAL_REVIEW`
(создана `cfo.angnks@demo.local`, направлена `filial.donbassgaz@demo.local`).
Роли для ручных/E2E проверок — существующие демо-аккаунты (`Password123`):
`cfo.angnks@demo.local`, `filial.donbassgaz@demo.local`, `dtoe@demo.local`.

## Manual checks

- [ ] Гонка состояний «два филиала согласуют/возвращают параллельно» — по
      аналогии с уже принятым для ЦФО waiver'ом в `correction-detail-page/test-plan.md`
      (сценарий гарантирован атомарной транзакцией `dataSource.transaction`,
      автотест на реальную гонку сетевых запросов непропорционально дорог для
      P1). Обоснование переносится на этот change без повторного
      автотестирования гонки на уровне БД.
- [ ] Визуальная сверка новых экранов (пикер направления, блок действий
      филиала, `DtoeCorrectionsOverview`) с дизайн-указаниями пользователя —
      **заблокировано** до получения макетов/уточнений, см. `design.md` →
      «Дизайн (UI)», раздел «Открыто». Этот пункт обновляется, как только
      пользователь передаст конкретные визуальные требования.

## Verification gates

- API: `npm run lint` из `api/`, при необходимости `npm run bundle`.
- Backend: `bun run lint`, `bun run test`, `bun run test:e2e` (из
  `apps/backend`).
- Frontend: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run
  build` (из `apps/frontend`).
- OpenSpec: `openspec validate cfo-initiated-corrections --strict
  --no-interactive`, если CLI доступен в окружении выполнения.

## Журнал уточнений

Раздел ведётся по ходу работы над change — каждое новое указание
пользователя (включая дизайн) фиксируется здесь с датой и ссылкой на
изменённый раздел `proposal.md`/`design.md`/`spec.md`/`tasks.md`.

- 2026-08-24 — создание change: пользователь подтвердил три решения через
  `AskUserQuestion` (симметричное согласование филиалом; направление сразу
  нескольким филиалам; ДТОиР — 18-я строка `cfos`; направление в ДТОиР — тот
  же финальный статус). Зафиксировано в `proposal.md`/`design.md`/`spec.md`.
  Дизайн UI не передан — раздел `design.md` → «Дизайн (UI)» содержит решения
  по умолчанию, ждёт подтверждения/замены.
