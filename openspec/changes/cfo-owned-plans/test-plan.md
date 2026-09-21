## Риск

P1 — узкая capability, переиспользует существующий эндпоинт `send-to-dtoe` и
существующий финальный цикл ДТОиР, без нового статус-цикла. Зеркало
[[cfo-initiated-corrections]].

## TDD workflow

Backend: failing unit-тест в `planning.service.spec.ts` (зеркалить
`corrections.service.spec.ts`'s новые describe-блоки из
[[cfo-initiated-corrections]]) → минимальная реализация → green → refactor.
Frontend: failing unit/component → реализация → green → refactor.

## Покрытие сценариев

| Requirement | Scenario | Приоритет | Тип теста | Файл | Статус |
|---|---|---|---|---|---|
| Создание плана ролью ЦФО | ЦФО создаёт план | P0 | Unit | `planning.service.spec.ts` | Planned |
| Создание плана ролью ЦФО | Роль без организационной привязки не может создать | P1 | Unit | `planning.service.spec.ts` | Planned |
| Направление собственного плана ЦФО сразу в ДТОиР | ЦФО направляет напрямую в ДТОиР | P0 | Unit + manual smoke | `planning.service.spec.ts` | Planned |
| Направление собственного плана ЦФО сразу в ДТОиР | Блокировка при неукомплектованном пакете | P1 | Unit | `planning.service.spec.ts` | Planned |
| Направление собственного плана ЦФО сразу в ДТОиР | Не-владелец не может направить этим способом | P1 | Unit | `planning.service.spec.ts` | Planned |
| Видимость и удаление собственных планов ЦФО | ЦФО видит созданные им планы | P1 | Unit | `planning.service.spec.ts` | Planned |
| Видимость и удаление собственных планов ЦФО | ЦФО удаляет собственный черновик | P2 | Unit | `planning.service.spec.ts` | Planned |
| Доступ к созданию плана в интерфейсе | Пункт меню виден ЦФО | P2 | Component | `permissions.unit.test.ts` | Planned |

## Test data

`apps/backend/src/database/seed.ts`: демо-план с `cfoId` заполненным
(`cfo.angnks@demo.local`, статус `DRAFT` или `UNDER_DTOE_REVIEW`). Роли для
ручных проверок: `cfo.angnks@demo.local`, `dtoe@demo.local`.

## Manual checks

- [ ] Ручная проверка полного цикла в браузере: `cfo.angnks@demo.local`
      создаёт план → загружает файлы → «Направить в ДТОиР» →
      `dtoe@demo.local` согласовывает.

## Verification gates

- API: `npm run lint` из `api/`.
- Backend: `bun run lint`, `bun run test` (из `apps/backend`).
- Frontend: `bun run typecheck`, `bun run lint`, `bun run test` (из
  `apps/frontend`).
- OpenSpec: `openspec validate cfo-owned-plans --strict --no-interactive`.

## Журнал уточнений

- 2026-09-14 — создание change сразу в узком scope (по мотивам сужения
  [[cfo-initiated-corrections]] в тот же день) — ЦФО ни в одном модуле никому,
  кроме ДТОиР, ничего не направляет.
