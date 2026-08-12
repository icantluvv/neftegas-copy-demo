## API

- [x] 1.1 [api] Обновить `api/src/components/schemas/auth.yaml`:
      `LoginRequest.username` → `email` (`type: string, format: email`),
      `required: [email, password]`. Обновить `api/src/paths/auth-login.yaml`
      (описание поля в summary/description при необходимости).
- [x] 1.2 [api] Добавить `api/src/paths/corrections-stats-filial.yaml`,
      `corrections-stats-cfo.yaml`, `corrections-stats-dtoe.yaml` — GET,
      `200` → `../components/schemas/correction-stats.yaml`, `403` →
      `../components/schemas/error-response.yaml`; зарегистрировать под
      `/corrections/stats/filial`, `/corrections/stats/cfo`,
      `/corrections/stats/dtoe` в `api/src/openapi.yaml`.
- [x] 1.3 [api] Выполнить `npm run lint` (и `npm run bundle` при необходимости)
      из `api/`; зафиксировать контракт как source of truth для задач ниже.

## Backend

- [x] 2.1 [backend] Failing test: обновить/добавить в
      `apps/backend/src/auth` тест на `400 Bad Request` при некорректном
      формате `email` в `POST /auth/login` (в обход фронта).
      (`apps/backend/test/auth.e2e-spec.ts`)
- [x] 2.2 [backend] Обновить `apps/backend/src/auth/dto/login.dto.ts`:
      `username` → `email`, `@IsEmail()` вместо `@IsString()` — тест 2.1 green.
- [x] 2.3 [backend] Обновить `apps/backend/src/auth/strategies/
      local.strategy.ts` (`usernameField: 'email'`, параметр `validate`) и
      `apps/backend/src/auth/auth.service.ts` (`validateUser(email,
      password)`, запрос по `user.username` с комментарием о временном
      маппинге — см. design.md Decisions §1). Проверка формата email
      перенесена в `LocalStrategy.validate()` — см. уточнение в design.md
      (Guards выполняются раньше Pipes, `@IsEmail()` в DTO там не срабатывает).
- [x] 2.4 [backend] Обновить `apps/backend/src/database/seed.ts`: 4 демо-логина
      (`filial`, `cfo`, `dtoe`, `admin`) заменить на email-подобные строки,
      согласованные с `@IsEmail()`.
- [x] 2.5 [backend] Прогнать существующие auth-тесты и `npm run seed` локально
      — вход по обновлённым демо-логинам работает.
- [x] 2.6 [backend] Failing test: для каждой роли (`FILIAL`, `CFO`, `DTOE`)
      добавить в `apps/backend/test` (e2e) кейс «своя роль → `200`, чужая роль
      → `403`» для `GET /corrections/stats/filial`, `/cfo`, `/dtoe`.
      (`apps/backend/test/corrections-stats.e2e-spec.ts`)
- [x] 2.7 [backend] Добавить в `apps/backend/src/corrections/
      corrections.controller.ts` три GET-хендлера (`filialStats`, `cfoStats`,
      `dtoeStats`), каждый с `@Roles(Role.<X>)`, вызывающий существующий
      `this.service.getStats(user)` — тесты 2.6 green.
- [x] 2.8 [backend] Верификация: `npm run test`, `npm run test:e2e`,
      `npm run lint` из `apps/backend`. (`app.e2e-spec.ts` падает независимо
      от этого change — `AppController` уже отдаёт только `/health`, тест не
      обновлён ранее; не блокирует.)

## Frontend

- [x] 3.1 [frontend] Сгенерировать Kubb-клиент из зафиксированного контракта
      (обновлённый `loginRequestSchema`/`LoginRequest`, новые клиенты
      `getCorrectionStatsFilial`/`getCorrectionStatsCfo`/
      `getCorrectionStatsDtoe`) — `apps/frontend/packages/api/base/codegen/**`
      вручную не редактировать.
- [x] 3.2 [frontend] Failing test: расширить
      `login-form.component.test.tsx` — ошибка формата email под полем без
      сети (запрос не отправляется), поле подписано «Email».
- [x] 3.3 [frontend] Обновить `apps/frontend/app/(public)/components/
      login-form.tsx`: поле `username` → `email` (label, `type="email"`,
      `autoComplete="email"`, `register("email")`) — тест 3.2 green. Поля
      email/пароль и кнопка «Войти» получают `min-h-12` (правка по дизайну).
- [x] 3.4 [frontend] Failing test: расширить `login-form.component.test.tsx`
      — успешный вход роли `FILIAL`/`CFO`/`DTOE` вызывает редирект на
      `/filial`/`/cfo`/`/dtoe` соответственно (мок `useLogin` через typed
      fixture `mocks/createAuthUser.ts` с разными `role`).
- [x] 3.5 [frontend] Обновить `onSuccess` в `login-form.tsx`: редирект по
      `data.role` (`FILIAL` → `/filial`, `CFO` → `/cfo`, `DTOE` → `/dtoe`).
      Страница `/dashboard` удалена из проекта по решению пользователя —
      `ADMIN` (вне области спеки экрана входа) редиректит на `/` при
      отсутствии маппинга. Тесты 3.4 green.
- [x] 3.6 [frontend] Failing test: расширить `login-form.component.test.tsx`
      — на `500` от `POST /auth/login` фронтенд показывает «Ошибка сервера.
      Попробуйте позже» и не показывает «Неверный email или пароль».
- [x] 3.7 [frontend] Обновить `onError` в `login-form.tsx`: различать `401`
      (единое сообщение «Неверный email или пароль») и прочие ошибки
      («Ошибка сервера. Попробуйте позже» по `error.cause.status`) — тест 3.6
      green.
- [x] 3.8 [frontend] Создать `apps/frontend/app/(private)/components/
      access-denied-screen.tsx` с component-тестом (`*.component.test.tsx`),
      проверяющим текст «Доступ запрещён».
- [x] 3.9 [frontend] Написан E2E-кейс `e2e/login.e2e.spec.ts` (успешный вход
      FILIAL/CFO + «CFO открывает `/dtoe` напрямую → „Доступ запрещён“»).
      **Не выполнен в этой сессии**: локальный dev-стек в Docker запущен с
      `NEXT_PUBLIC_MOCK_MODE=true` (запечено в клиентский бандл при старте
      `next dev`), из-за чего логин отвечает случайными фейковыми данными;
      попытка поднять локальный `next dev` с `MOCK_MODE=false` упёрлась в
      несвязанный баг окружения (Node 24: `--env-file` не может быть передан
      через NODE_OPTIONS, а Next.js прокидывает execArgv в дочерний процесс).
      По решению пользователя — не добивались запуска сейчас, нужен отдельный
      прогон в чистом окружении (CI или пересобранный контейнер без mock-режима).
- [x] 3.10 [frontend] Создать `apps/frontend/app/(private)/filial/layout.tsx`,
      `(private)/filial/page.tsx` и аналогично для `cfo/`, `dtoe/`: layout
      вызывает соответствующий Kubb-хук на сервере, при `403` рендерит
      `AccessDeniedScreen`, иначе `children` (заглушка). `(private)/dashboard/`
      удалена по решению пользователя вместо использования как образец.
- [x] 3.11 [frontend] E2E: добавить/расширить `*.e2e.spec.ts` на успешный вход
      каждой роли и редирект в её раздел — см. 3.9, не выполнено в этой сессии
      по той же причине (mock-режим в запущенном dev-контейнере).
      **Устарело**: задача закрывается без выполнения в исходной форме — change
      `sidebar-nav-and-role-dashboard` заменил редирект по ролям (`/filial`,
      `/cfo`, `/dtoe`) единым `/dashboard` и удалил сами ролевые маршруты;
      исходный E2E-сценарий `login.e2e.spec.ts` был написан, но проверял уже
      несуществующие маршруты и был удалён вместе с ними. Эквивалентное
      покрытие (успешный вход каждой роли → редирект → верный дашборд)
      реализовано в `apps/frontend/e2e/dashboard.e2e.spec.ts` (4/4 зелёные).
- [x] 3.12 [frontend] Верификация: `bun run typecheck`, `bun run lint`,
      относящиеся к change тесты, `bun run build` из `apps/frontend`.
- [x] 3.13 [openspec] Обновить `test-plan.md` — отметить статус покрытия по
      каждому сценарию `specs/login/spec.md` и
      `specs/role-scoped-sections/spec.md` по мере выполнения задач выше.
- [x] 3.14 [openspec] `openspec validate align-login-role-redirect --strict
      --no-interactive`.
- [x] 3.15 [frontend] Обнаружено при ручной проверке (чистый рестарт
      dev-контейнера, инкогнито-браузер): guard приватного контура работал
      верно (после рестарта, без закэшированного dev-рендера — см. ниже), но
      редиректил на несуществующий `/login` (404). Исправлено —
      `apps/frontend/app/(private)/layout.tsx` и `.../components/sidebar-nav.tsx`
      редиректят на `/` (реальная страница логина после удаления `/dashboard`);
      обновлён `sidebar-nav.component.test.tsx`. Побочно обнаружен и
      задокументирован dev-only артефакт Next.js 16 + Turbopack: успешный
      рендер `/filial`/`/cfo`/`/dtoe` кэшировался в памяти dev-сервера и
      отдавался последующим неавторизованным запросам к тому же URL, несмотря
      на `dynamic = "force-dynamic"` — воспроизводится только в dev-режиме
      (после рестарта контейнера воспроизвести не удалось), в production-сборке
      (`next build`) маршрут помечен `ƒ` (динамический на каждый запрос).
