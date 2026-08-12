# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Поле email на экране входа | Успешный ввод корректного email | P2 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Done |
| Поле email на экране входа | Некорректный формат email блокирует отправку на фронте | P1 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Done |
| Поле email на экране входа | Бэкенд отклоняет некорректный формат email в обход фронта | P1 | Backend e2e | `apps/backend/test/auth.e2e-spec.ts` | Done |
| Поле пароля | Ввод пароля скрыт по умолчанию | P3 | Manual | — | Waived — стандартный `type="password"`, поведение браузера не тестируется отдельно |
| Состояние кнопки «Войти» во время запроса | Кнопка заблокирована во время запроса | P2 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Done |
| Единое сообщение об ошибке аутентификации | Неверный email или пароль | P1 | Backend e2e + Component | `apps/backend/test/auth.e2e-spec.ts`, `login-form.component.test.tsx` | Done |
| Сообщение об ошибке сервера при попытке входа | Ошибка сервера при входе | P2 | Component | `apps/frontend/app/(public)/components/login-form.component.test.tsx` | Done |
| Редирект после входа по роли пользователя | Успешный вход пользователя с ролью FILIAL | P0 | E2E | `apps/frontend/e2e/login.e2e.spec.ts` | Written, not run — см. примечание ниже |
| Редирект после входа по роли пользователя | Успешный вход пользователя с ролью CFO | P0 | E2E | `apps/frontend/e2e/login.e2e.spec.ts` | Written, not run — см. примечание ниже |
| Редирект после входа по роли пользователя | Успешный вход пользователя с ролью DTOE | P1 | Component | `login-form.component.test.tsx` | Done |
| Доступ к ролевому разделу только для соответствующей роли | Пользователь открывает свой раздел | P1 | Backend e2e | `apps/backend/test/corrections-stats.e2e-spec.ts` | Done |
| Доступ к ролевому разделу только для соответствующей роли | Пользователь открывает чужой раздел напрямую | P0 | E2E + Backend e2e | `apps/frontend/e2e/login.e2e.spec.ts` (написан, не прогнан), `apps/backend/test/corrections-stats.e2e-spec.ts` (done) | Backend done, E2E written not run |
| Доступ к ролевому разделу только для соответствующей роли | Неавторизованный пользователь пытается открыть ролевой раздел | P2 | Manual (существующее поведение `(private)/layout.tsx`, не меняется этим change) | — | Waived — покрыто существующим поведением, вне изменений этого change |

**Примечание про E2E (P0)**: `apps/frontend/e2e/login.e2e.spec.ts` написан и покрывает все три
сценария (FILIAL→/filial, CFO→/cfo, CFO→/dtoe→«Доступ запрещён»), но не был запущен
в этой рабочей сессии — уже поднятый локальный dev-стек в Docker собран с
`NEXT_PUBLIC_MOCK_MODE=true` (значение зашито в клиентский бандл на старте `next dev`,
из-за чего логин отвечает случайными фейковыми данными вместо реального бэкенда), а
попытка поднять чистый локальный `next dev` с `MOCK_MODE=false` уперлась в отдельный,
не связанный с этим change баг окружения (Node.js 24: флаг `--env-file` нельзя
передать через `NODE_OPTIONS`, а `next dev` прокидывает `execArgv` в дочерний процесс).
По решению пользователя — не терять время на устранение этого дальше в рамках change;
тесты нужно прогнать в CI или в пересобранном контейнере без mock-режима перед
архивированием change. До первого успешного прогона P0-сценарии остаются
формально непокрытыми автотестом (написанный тест не верифицирован).

## Required automated tests

### Unit
_(нет — вся логика этого change покрывается на component/e2e-уровне)_

### Component
- [x] `login-form.component.test.tsx`: ошибка формата email под полем, без отправки запроса
- [x] `login-form.component.test.tsx`: кнопка «Войти» в состоянии загрузки блокирует повторную отправку
- [x] `login-form.component.test.tsx`: единое сообщение «Неверный email или пароль» на `401`
- [x] `login-form.component.test.tsx`: сообщение «Ошибка сервера. Попробуйте позже» на `500`
- [x] `login-form.component.test.tsx`: редирект на `/filial`/`/cfo`/`/dtoe` по роли из ответа успешного входа
- [x] `access-denied-screen.component.test.tsx`: рендер сообщения «Доступ запрещён»

### Integration
_(не вводится — см. правило проекта: отдельный frontend integration-уровень не создаётся)_

### E2E
- [x] Написан: успешный вход `FILIAL` → редирект на `/filial`
- [x] Написан: успешный вход `CFO` → редирект на `/cfo`
- [x] Написан: `CFO` открывает `/dtoe` напрямую по URL → экран «Доступ запрещён»
- [ ] **Не прогнан** ни один из трёх — см. примечание в Scenario coverage

### Backend (Jest e2e/feature)
- [x] `POST /auth/login`: некорректный формат email → `400` (`apps/backend/test/auth.e2e-spec.ts`)
- [x] `POST /auth/login`: неверный email/пароль/заблокированная запись → единый `401` (`apps/backend/test/auth.e2e-spec.ts`)
- [x] `GET /corrections/stats/filial|cfo|dtoe`: своя роль → `200`, чужая роль → `403` (`apps/backend/test/corrections-stats.e2e-spec.ts`)

## Manual checks
- [x] Локальный вход под всеми 4 обновлёнными демо-логинами после правки `seed.ts` (`npm run seed`, `npm run test:e2e` — покрыто автотестами вместо ручной проверки)

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
- Экран/маршрут для роли `ADMIN` (не описана в спеке экрана входа; при отсутствии
  маппинга роли редиректит на `/`)
- Наполнение сайдбара новыми пунктами навигации на `/filial`/`/cfo`/`/dtoe` — по
  решению пользователя `/dashboard` удалена без замены; единственный пункт навигации
  сайдбара («Дашборд») удалён, дизайн ролевой навигации — вне области этого change

## Verification commands
- [x] `openspec validate align-login-role-redirect --strict --no-interactive`
- [x] api: `npm run lint`, `npm run bundle` — из `api/`
- [x] backend: `npm run test`, `npm run test:e2e`, `npm run lint` — из `apps/backend`
      (`app.e2e-spec.ts` падает независимо от этого change, см. tasks.md 2.8)
- [x] frontend: `bun run typecheck` (`npx tsc --noEmit`), `bun run lint`, `bun run test`,
      `bun run build` — из `apps/frontend` (1 предсуществующий сбой теста, не связан
      с change, см. tasks.md)
