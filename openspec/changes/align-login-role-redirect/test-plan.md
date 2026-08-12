# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Поле email на экране входа | Успешный ввод корректного email | P2 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Planned |
| Поле email на экране входа | Некорректный формат email блокирует отправку на фронте | P1 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Planned |
| Поле email на экране входа | Бэкенд отклоняет некорректный формат email в обход фронта | P1 | Backend e2e | `apps/backend/src/auth/*.e2e-spec.ts` | Planned |
| Поле пароля | Ввод пароля скрыт по умолчанию | P3 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Planned |
| Состояние кнопки «Войти» во время запроса | Кнопка заблокирована во время запроса | P2 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Planned |
| Единое сообщение об ошибке аутентификации | Неверный email или пароль | P1 | Backend e2e + Component | `apps/backend/src/auth/*.e2e-spec.ts`, `login-form.component.test.tsx` | Planned |
| Редирект после входа по роли пользователя | Успешный вход пользователя с ролью FILIAL | P0 | E2E | `apps/frontend/**/*.e2e.spec.ts` | Planned |
| Редирект после входа по роли пользователя | Успешный вход пользователя с ролью CFO | P0 | E2E | `apps/frontend/**/*.e2e.spec.ts` | Planned |
| Редирект после входа по роли пользователя | Успешный вход пользователя с ролью DTOE | P1 | Component | `login-form.component.test.tsx` | Planned |
| Доступ к ролевому разделу только для соответствующей роли | Пользователь открывает свой раздел | P1 | Backend e2e | `apps/backend/src/corrections/*.e2e-spec.ts` | Planned |
| Доступ к ролевому разделу только для соответствующей роли | Пользователь открывает чужой раздел напрямую | P0 | E2E + Backend e2e | `apps/frontend/**/*.e2e.spec.ts`, `apps/backend/src/corrections/*.e2e-spec.ts` | Planned |
| Доступ к ролевому разделу только для соответствующей роли | Неавторизованный пользователь пытается открыть ролевой раздел | P2 | Manual (существующее поведение `(private)/layout.tsx`, не меняется этим change) | — | Waived — покрыто существующим поведением, вне изменений этого change |

## Required automated tests

### Unit
_(нет — вся логика этого change покрывается на component/e2e-уровне)_

### Component
- [ ] `login-form.component.test.tsx`: ошибка формата email под полем, без отправки запроса
- [ ] `login-form.component.test.tsx`: кнопка «Войти» в состоянии загрузки блокирует повторную отправку
- [ ] `login-form.component.test.tsx`: единое сообщение «Неверный email или пароль» на `401`
- [ ] `login-form.component.test.tsx`: редирект на `/filial`/`/cfo`/`/dtoe` по роли из ответа успешного входа
- [ ] `access-denied-screen.component.test.tsx`: рендер сообщения «Доступ запрещён»

### Integration
_(не вводится — см. правило проекта: отдельный frontend integration-уровень не создаётся)_

### E2E
- [ ] Успешный вход `FILIAL` → редирект на `/filial`
- [ ] Успешный вход `CFO` → редирект на `/cfo`
- [ ] `CFO` открывает `/dtoe` напрямую по URL → экран «Доступ запрещён»

### Backend (Jest e2e/feature)
- [ ] `POST /auth/login`: некорректный формат email → `400`
- [ ] `POST /auth/login`: неверный email/пароль/заблокированная запись → единый `401`
- [ ] `GET /corrections/stats/filial|cfo|dtoe`: своя роль → `200`, чужая роль → `403`

## Manual checks
- [ ] Локальный вход под всеми 4 обновлёнными демо-логинами после правки `seed.ts` (`npm run seed`)

## Test data
- Fixtures: Kubb-типизированные моки `apps/frontend/packages/api/base/codegen/mocks/createAuthUser.ts` (варьировать `role`), `mocks/createLoginRequest.ts` (перегенерируются с полем `email`)
- API mocks: TanStack Query мок `useLogin` мутации в component-тестах через существующий паттерн `login-form.component.test.tsx`
- User roles: `FILIAL`, `CFO`, `DTOE` — по одному фикстур-пользователю на роль (backend e2e и frontend E2E используют согласованные seed-данные)
- Seed data: обновлённые email-подобные демо-логины в `apps/backend/src/database/seed.ts`

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- Полное согласование `User.username`/`User.email` во всём домене `users` (см. design.md Open Questions)
- Экран/маршрут для роли `ADMIN` (не описана в спеке экрана входа)

## Verification commands
- [ ] `openspec validate align-login-role-redirect --strict --no-interactive`
- [ ] api: `npm run lint` (и `npm run bundle` при необходимости) — из `api/`
- [ ] backend: `npm run test`, `npm run test:e2e`, `npm run lint` — из `apps/backend`
- [ ] frontend: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build` — из `apps/frontend`
