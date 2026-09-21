## Риск

P1 — новая capability, узкая (переиспользует существующий эндпоинт
`send-to-dtoe` и существующий финальный цикл ДТОиР, без нового статус-цикла).

## TDD workflow

Backend: failing unit-тест в `corrections.service.spec.ts` (зеркалить
существующие describe-блоки для `submit`/`isCfoOwner` из
`fact-packages.service.spec.ts`) → минимальная реализация → green → refactor.
Frontend: failing unit/component по риску → компоненты/хуки → green →
refactor. Порядок задач в `tasks.md` соблюдает test-first.

## Покрытие сценариев

| Requirement | Scenario | Приоритет | Тип теста | Файл | Статус |
|---|---|---|---|---|---|
| Создание корректировки ролью ЦФО | ЦФО создаёт корректировку | P0 | Unit | `corrections.service.spec.ts` | Planned |
| Создание корректировки ролью ЦФО | Роль без организационной привязки не может создать | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Направление собственного пакета ЦФО сразу в ДТОиР | ЦФО направляет напрямую в ДТОиР | P0 | Unit + manual smoke | `corrections.service.spec.ts` | Planned |
| Направление собственного пакета ЦФО сразу в ДТОиР | Блокировка при неукомплектованном пакете | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Направление собственного пакета ЦФО сразу в ДТОиР | Не-владелец не может направить этим способом | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Видимость и удаление собственных корректировок ЦФО | ЦФО видит созданные им корректировки | P1 | Unit | `corrections.service.spec.ts` | Planned |
| Видимость и удаление собственных корректировок ЦФО | ЦФО удаляет собственный черновик | P2 | Unit | `corrections.service.spec.ts` | Planned |
| Доступ к созданию корректировки в интерфейсе | Пункт меню виден ЦФО | P2 | Component | `permissions.unit.test.ts`/`create-correction-form.component.test.tsx` | Planned |

## Backend Unit/Feature

`apps/backend/src/corrections/corrections.service.spec.ts`, новые
describe-блоки: `create (CFO)`, `sendToDtoe (CFO owner)`, `findAll
(видимость владельца)`, `checkAccess (владелец)`, `toDetailDto (isCfoOwner)`,
`deleteCorrection (CFO owner)`. Backend e2e-раннер в этом окружении не
запускается (известный баг Bun/Jest) — вместо e2e-файла: `bunx tsc --noEmit`
по проекту + ручной `bun -e` HTTP smoke-test внутри `infra-backend-1`
(создать → направить в ДТОиР → согласовать), см. `tasks.md` 2.3.3.

## Frontend Unit/Component

Unit: `permissions.unit.test.ts` (`canSendToDtoeAsOwner`, расширение
`canUploadSlotFile`). Component: `create-correction-form.component.test.tsx`
(доступ роли CFO к странице создания — если существующий тест уже покрывает
рендер формы, достаточно добавить кейс доступа в `page`-уровневый тест или
`permissions.unit.test.ts`), submit-панель — новый компонент-тест на ветку
`isCfoOwner`.

## Test data

`apps/backend/src/database/seed.ts`: одна демо-корректировка с `cfoId`
заполненным (создана `cfo.angnks@demo.local`, статус `DRAFT` или
`UNDER_DTOE_REVIEW`). Роли для ручных проверок — существующие демо-аккаунты
(`Password123`): `cfo.angnks@demo.local`, `dtoe@demo.local`.

## Manual checks

- [ ] Ручная проверка полного цикла в браузере: `cfo.angnks@demo.local`
      создаёт корректировку → загружает файлы во все слоты → «Направить в
      ДТОиР» → `dtoe@demo.local` видит её в кабинете, согласовывает.

## Verification gates

- API: `npm run lint` из `api/`, при необходимости `npm run bundle`.
- Backend: `bun run lint`, `bun run test` (из `apps/backend`).
- Frontend: `bun run typecheck`, `bun run lint`, `bun run test` (из
  `apps/frontend`).
- OpenSpec: `openspec validate cfo-initiated-corrections --strict
  --no-interactive`, если CLI доступен в окружении выполнения.

## Журнал уточнений

- 2026-08-24 — создание change (первая, широкая версия: направление филиалам
  ИЛИ ДТОиР, симметричный цикл согласования филиалом).
- 2026-09-14 — пользователь сузил scope: ЦФО ни в одном модуле никому, кроме
  ДТОиР, ничего не направляет. Ветка «направить филиалам» отложена (не
  реализуется в рамках этого change). `proposal.md`/`design.md`/`spec.md`/
  `tasks.md` переписаны под узкий scope — переиспользование существующего
  `send-to-dtoe` вместо нового `send-as-cfo`, `cfoId` вместо
  `initiatorKind`/`targetKind`/`CorrectionFilialStatus`. Та же фича вводится
  в модуль «План на 2027» отдельным change [[cfo-owned-plans]].
