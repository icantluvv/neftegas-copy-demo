# Test Plan

## Risk level
P0

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Выдача сессии при успешном входе | Успешный вход создаёт сессию | P0 | Backend e2e | `apps/backend/test/auth.e2e-spec.ts` | Done |
| Выдача сессии при успешном входе | Повторный вход создаёт независимую новую сессию | P1 | Backend e2e | `apps/backend/test/auth.e2e-spec.ts` | Done |
| Доступ к защищённым ручкам по действующей сессии | Запрос с действующей сессией проходит | P0 | Backend e2e | `apps/backend/test/auth.e2e-spec.ts` | Done |
| Доступ к защищённым ручкам по действующей сессии | Запрос без cookie отклоняется | P0 | Backend unit (guard) | `apps/backend/src/common/guards/session-auth.guard.spec.ts` | Done |
| Доступ к защищённым ручкам по действующей сессии | Запрос с несуществующей или уже завершённой сессией отклоняется | P0 | Backend unit (guard) + e2e | `session-auth.guard.spec.ts`, `auth.e2e-spec.ts` | Done |
| Продление сессии при активности (sliding TTL) | Активность продлевает сессию | P0 | Backend unit | `apps/backend/src/auth/session.service.spec.ts` | Done |
| Продление сессии при активности (sliding TTL) | Бездействие дольше окна завершает сессию | P0 | Backend unit (мок TTL/времени) | `session.service.spec.ts` | Done |
| Завершение текущей сессии (logout) | Logout завершает только текущую сессию | P0 | Backend e2e | `auth.e2e-spec.ts` | Done |
| Завершение всех сессий пользователя (logout-all) | Logout-all завершает все сессии пользователя | P0 | Backend e2e | `auth.e2e-spec.ts` | Done |
| Завершение всех сессий пользователя (logout-all) | Logout-all не затрагивает сессии других пользователей | P0 | Backend e2e | `auth.e2e-spec.ts` | Done |
| Учёт блокировки и деактивации учётной записи в рамках действующей сессии | Деактивация учётной записи блокирует доступ по живой сессии | P0 | Backend e2e | `auth.e2e-spec.ts` | Done |
| _(снятая ручка)_ `POST /auth/refresh` | Запрос к удалённому эндпоинту → `404` | P1 | Backend e2e | `auth.e2e-spec.ts` | Done |

## Required automated tests

### Unit
- [x] `session.service.spec.ts`: `create()` — `SET session:<id>`+`SADD
      user-sessions:<userId>` с ожидаемым TTL и форматом id
- [x] `session.service.spec.ts`: `validateAndTouch()` — найдена сессия →
      `EXPIRE`+данные; не найдена → `null`
- [x] `session.service.spec.ts`: `destroy()` — `DEL`+`SREM` с правильными ключами
- [x] `session.service.spec.ts`: `destroyAll()` — множественный `DEL`+`DEL` сета;
      пустой сет → no-op
- [x] `session-auth.guard.spec.ts`: `@Public()` пропускает без cookie
- [x] `session-auth.guard.spec.ts`: нет cookie → `UnauthorizedException`
- [x] `session-auth.guard.spec.ts`: `validateAndTouch` → `null` →
      `UnauthorizedException`
- [x] `session-auth.guard.spec.ts`: валидная сессия → `request.user` установлен
- [x] `session-auth.guard.spec.ts`: деактивированная/заблокированная учётная
      запись → `UnauthorizedException` (доп. сценарий сверх изначального плана)

### Component
_(не применимо — изменения не затрагивают frontend-компоненты, см. design.md
Frontend)_

### Integration
_(не вводится — правило проекта: отдельный frontend integration-уровень не
создаётся)_

### E2E
_(frontend E2E не требуется для этого change — механизм cookie прозрачен для
фронта; см. design.md Тестовая стратегия)_

### Backend (Jest e2e/feature)
- [x] `POST /auth/login`: успех → ровно одна `set-cookie: session_id` (httpOnly)
- [x] `POST /auth/login`: повторный вход создаёт вторую независимую сессию,
      первая остаётся активной
- [x] `GET /auth/me`: с валидной cookie → `200`; без cookie → `401`; с
      несуществующей/уничтоженной сессией → `401`
- [x] `POST /auth/logout`: `204`, cookie очищена, повторный запрос той же cookie
      → `401`; вторая сессия того же пользователя не затронута
- [x] `POST /auth/logout-all`: без аутентификации → `401`; с валидной сессией —
      завершает все сессии текущего пользователя (проверено на двух cookie
      jar), не затрагивает сессии другого пользователя
- [x] Деактивация (`isActive=false`) учётной записи с живой сессией → следующий
      запрос → `401`
- [x] `POST /auth/refresh` → `404`

Все 8 сценариев зелёные — `apps/backend/test/auth.e2e-spec.ts`, 13/13 тестов файла.

## Manual checks
- [x] Полный цикл через живой `docker compose` стек (`infra/`): два независимых
      `curl` cookie jar одним пользователем эмулируют две вкладки браузера —
      `login` в оба → `200`+`200`; `me` в обоих → `200`+`200`; `logout` из
      первого → `204`, его `me` → `401`, второй остаётся `200` (не затронут);
      `logout-all` из второго → `204`, его `me` → `401`; `POST /auth/refresh`
      → `404`. См. tasks.md 4.3.

## Test data
- Fixtures: существующий тестовый пользователь из `apps/backend/test/`
  (создаётся напрямую в БД, как в текущем `auth.e2e-spec.ts`)
- API mocks: не требуются — backend e2e бьёт в реальный тестовый Postgres и
  реальный тестовый Redis (не mock), чтобы верифицировать реальное TTL-поведение
- User roles: любая роль подходит для сценариев сессии — специфика роли не
  влияет на поведение сессионного механизма (кроме `RolesGuard`, который не
  меняется)
- Seed data: без изменений `apps/backend/src/database/seed.ts`

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- UI «активные сессии» / кнопка «выйти со всех устройств» на фронте (design.md
  Non-Goals)
- Миграция `User.id` на `uuid`, согласование `User.username`/`User.email`
  (design.md Non-Goals — существующие открытые вопросы вне этого change)

## Verification commands
- [x] `openspec validate session-based-auth --strict --no-interactive`
- [x] api: `npm run lint` — 0 ошибок (41 pre-existing warning
      `operation-4xx-response`, не связаны с этим change) — из `api/`
- [x] backend: `npm run test` (13/13), `npm run test:e2e` (22/23 — 1
      pre-existing сбой `app.e2e-spec.ts`, не связан с этим change), `tsc
      --noEmit` чисто — из `apps/backend`
- [x] frontend: `npx tsc --noEmit` чисто, `bun run lint` (0 ошибок в затронутых
      файлах), `bun run test` (21/22 — 1 pre-existing сбой, не связан с auth),
      `bun run build` успешен — из `apps/frontend`
