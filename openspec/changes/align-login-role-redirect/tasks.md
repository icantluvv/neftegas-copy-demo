## API

- [ ] 1.1 [api] Обновить `api/src/components/schemas/auth.yaml`:
      `LoginRequest.username` → `email` (`type: string, format: email`),
      `required: [email, password]`. Обновить `api/src/paths/auth-login.yaml`
      (описание поля в summary/description при необходимости).
- [ ] 1.2 [api] Добавить `api/src/paths/corrections-stats-filial.yaml`,
      `corrections-stats-cfo.yaml`, `corrections-stats-dtoe.yaml` — GET,
      `200` → `../components/schemas/correction-stats.yaml`, `403` →
      `../components/schemas/error-response.yaml`; зарегистрировать под
      `/corrections/stats/filial`, `/corrections/stats/cfo`,
      `/corrections/stats/dtoe` в `api/src/openapi.yaml`.
- [ ] 1.3 [api] Выполнить `npm run lint` (и `npm run bundle` при необходимости)
      из `api/`; зафиксировать контракт как source of truth для задач ниже.

## Backend

- [ ] 2.1 [backend] Failing test: обновить/добавить в
      `apps/backend/src/auth` тест на `400 Bad Request` при некорректном
      формате `email` в `POST /auth/login` (в обход фронта).
- [ ] 2.2 [backend] Обновить `apps/backend/src/auth/dto/login.dto.ts`:
      `username` → `email`, `@IsEmail()` вместо `@IsString()` — тест 2.1 green.
- [ ] 2.3 [backend] Обновить `apps/backend/src/auth/strategies/
      local.strategy.ts` (`usernameField: 'email'`, параметр `validate`) и
      `apps/backend/src/auth/auth.service.ts` (`validateUser(email,
      password)`, запрос по `user.username` с комментарием о временном
      маппинге — см. design.md Decisions §1).
- [ ] 2.4 [backend] Обновить `apps/backend/src/database/seed.ts`: 4 демо-логина
      (`filial`, `cfo`, `dtoe`, `admin`) заменить на email-подобные строки,
      согласованные с `@IsEmail()`.
- [ ] 2.5 [backend] Прогнать существующие auth-тесты и `npm run seed` локально
      — вход по обновлённым демо-логинам работает.
- [ ] 2.6 [backend] Failing test: для каждой роли (`FILIAL`, `CFO`, `DTOE`)
      добавить в `apps/backend/test` (e2e) кейс «своя роль → `200`, чужая роль
      → `403`» для `GET /corrections/stats/filial`, `/cfo`, `/dtoe`.
- [ ] 2.7 [backend] Добавить в `apps/backend/src/corrections/
      corrections.controller.ts` три GET-хендлера (`filialStats`, `cfoStats`,
      `dtoeStats`), каждый с `@Roles(Role.<X>)`, вызывающий существующий
      `this.service.getStats(user)` — тесты 2.6 green.
- [ ] 2.8 [backend] Верификация: `npm run test`, `npm run test:e2e`,
      `npm run lint` из `apps/backend`.

## Frontend

- [ ] 3.1 [frontend] Сгенерировать Kubb-клиент из зафиксированного контракта
      (обновлённый `loginRequestSchema`/`LoginRequest`, новые клиенты
      `getCorrectionStatsFilial`/`getCorrectionStatsCfo`/
      `getCorrectionStatsDtoe`) — `apps/frontend/packages/api/base/codegen/**`
      вручную не редактировать.
- [ ] 3.2 [frontend] Failing test: расширить
      `login-form.component.test.tsx` — ошибка формата email под полем без
      сети (запрос не отправляется), поле подписано «Email».
- [ ] 3.3 [frontend] Обновить `apps/frontend/app/(public)/components/
      login-form.tsx`: поле `username` → `email` (label, `type="email"`,
      `autoComplete="email"`, `register("email")`) — тест 3.2 green.
- [ ] 3.4 [frontend] Failing test: расширить `login-form.component.test.tsx`
      — успешный вход роли `FILIAL`/`CFO`/`DTOE` вызывает редирект на
      `/filial`/`/cfo`/`/dtoe` соответственно (мок `useLogin` через typed
      fixture `mocks/createAuthUser.ts` с разными `role`).
- [ ] 3.5 [frontend] Обновить `onSuccess` в `login-form.tsx`: редирект по
      `data.role` (`FILIAL` → `/filial`, `CFO` → `/cfo`, `DTOE` → `/dtoe`,
      `ADMIN` → `/dashboard`) — тесты 3.4 green.
- [ ] 3.6 [frontend] Создать `apps/frontend/app/(private)/components/
      access-denied-screen.tsx` с component-тестом (`*.component.test.tsx`),
      проверяющим текст «Доступ запрещён».
- [ ] 3.7 [frontend] Failing test/сценарий: E2E-кейс «пользователь с ролью
      `CFO` открывает `/dtoe` напрямую → видит экран „Доступ запрещён“»
      (`*.e2e.spec.ts`).
- [ ] 3.8 [frontend] Создать `apps/frontend/app/(private)/filial/layout.tsx`,
      `(private)/filial/page.tsx` и аналогично для `cfo/`, `dtoe/`: layout
      вызывает соответствующий Kubb-хук на сервере, при `403` рендерит
      `AccessDeniedScreen`, иначе `children` (заглушка по аналогии с
      `(private)/dashboard/page.tsx`) — тест 3.7 green.
- [ ] 3.9 [frontend] E2E: добавить/расширить `*.e2e.spec.ts` на успешный вход
      каждой роли и редирект в её раздел (`FILIAL` → `/filial`, `CFO` →
      `/cfo`; `DTOE` допустимо покрыть на component/unit-уровне редирект-логики
      при P1 — см. design.md «Тестовая стратегия»).
- [ ] 3.10 [frontend] Верификация: `bun run typecheck`, `bun run lint`,
      относящиеся к change тесты, `bun run build` из `apps/frontend`.
- [ ] 3.11 [openspec] Обновить `test-plan.md` — отметить статус покрытия по
      каждому сценарию `specs/login/spec.md` и
      `specs/role-scoped-sections/spec.md` по мере выполнения задач выше.
- [ ] 3.12 [openspec] `openspec validate align-login-role-redirect --strict
      --no-interactive`.
