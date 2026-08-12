## API

- [ ] 1.1 [api] Обновить `api/src/openapi.yaml`:
      `components.securitySchemes.cookieAuth.name` `access_token` → `session_id`.
- [ ] 1.2 [api] Удалить `api/src/paths/auth-refresh.yaml` и убрать регистрацию
      пути `/auth/refresh` из `api/src/openapi.yaml`.
- [ ] 1.3 [api] Добавить `api/src/paths/auth-logout-all.yaml` (`POST`,
      `security: [cookieAuth: []]`, без тела запроса, `204` при успехе, `401` →
      `../components/schemas/error-response.yaml`) и зарегистрировать
      `/auth/logout-all` в `api/src/openapi.yaml`.
- [ ] 1.4 [api] Обновить описания в `api/src/paths/auth-login.yaml` и
      `api/src/paths/auth-logout.yaml`, если там упоминаются JWT/refresh-токен
      явно (заменить на формулировки про server-side сессию).
- [ ] 1.5 [api] Выполнить `npm run lint` (и `npm run bundle` при необходимости)
      из `api/`; зафиксировать контракт как source of truth для задач ниже.

## Backend

- [ ] 2.1 [backend] Добавить `ioredis` в `apps/backend/package.json`, убрать
      `@nestjs/jwt` и `passport-jwt` (и их `@types/*`, если есть в
      devDependencies), `npm install`.
- [ ] 2.2 [backend] Добавить `REDIS_URL=redis://localhost:6379` в
      `apps/backend/.env.example` и корневой `.env.example`, убрать
      `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`.
- [ ] 2.3 [backend] Failing test: `apps/backend/src/redis/redis.module.spec.ts`
      или инлайн-проверка в `session.service.spec.ts` (2.5) — модуль
      предоставляет `REDIS_CLIENT`, собранный из `ConfigService.get('REDIS_URL')`.
- [ ] 2.4 [backend] Создать `apps/backend/src/redis/redis.constants.ts`
      (`REDIS_CLIENT` символ) и `apps/backend/src/redis/redis.module.ts`
      (`@Global()`, провайдер через `useFactory(ConfigService)`,
      `onModuleDestroy` → `client.quit()`). Импортировать в
      `apps/backend/src/app.module.ts` — тест 2.3 green.
- [ ] 2.5 [backend] Failing tests:
      `apps/backend/src/auth/session.service.spec.ts` — `create()` вызывает
      `SET session:<id>`+`SADD user-sessions:<userId>` с ожидаемым TTL;
      `validateAndTouch()` — найдена сессия → `EXPIRE`+распарсенные данные, не
      найдена → `null`; `destroy()` — `DEL`+`SREM`; `destroyAll()` — `SMEMBERS`
      → множественный `DEL` → `DEL` сета, пустой сет → no-op (мок `ioredis`).
      Соответствует `specs/session-management/spec.md`: "Выдача сессии при
      успешном входе", "Продление сессии при активности (sliding TTL)",
      "Завершение текущей сессии (logout)", "Завершение всех сессий
      пользователя (logout-all)".
- [ ] 2.6 [backend] Реализовать `apps/backend/src/auth/session.service.ts`
      (`SessionData`, `create`/`validateAndTouch`/`destroy`/`destroyAll`,
      `SESSION_TTL_SECONDS` из конфига, session id — `crypto.randomBytes(32)
      .toString('base64url')`) — тесты 2.5 green.
- [ ] 2.7 [backend] Failing test:
      `apps/backend/src/common/guards/session-auth.guard.spec.ts` — `@Public()`
      пропускает без cookie; нет cookie → 401; `SessionService.validateAndTouch`
      возвращает `null` → 401; валидная сессия → `SessionService.validateAndTouch`
      вызван, `request.user` установлен на актуального пользователя из Postgres
      (мок репозитория), `canActivate` → `true`. Соответствует "Доступ к
      защищённым ручкам по действующей сессии".
- [ ] 2.8 [backend] Реализовать
      `apps/backend/src/common/guards/session-auth.guard.ts` (см. design.md
      Decision §1); удалить `apps/backend/src/common/guards/jwt-auth.guard.ts` и
      `apps/backend/src/auth/strategies/jwt.strategy.ts`; заменить `JwtPayload`
      на `SessionData` в `apps/backend/src/auth/types.ts`; обновить
      `apps/backend/src/app.module.ts` (`APP_GUARD` → `SessionAuthGuard`) —
      тесты 2.7 green.
- [ ] 2.9 [backend] Обновить `apps/backend/src/auth/auth.service.ts`: убрать
      JWT-константы/`JwtService`/`signAccessToken`/`signRefreshToken`/`refresh()`;
      добавить `login(user, meta, res)`, `logout(sessionId, res)`,
      `logoutAll(userId, res)` на основе `SessionService` (cookie `session_id`,
      см. design.md Decision §3). `validateUser()` без изменений.
- [ ] 2.10 [backend] Обновить `apps/backend/src/auth/auth.module.ts`
      (providers/imports без `JwtModule`/`JwtStrategy`, добавить
      `SessionService`).
- [ ] 2.11 [backend] Failing test: расширить
      `apps/backend/test/auth.e2e-spec.ts` — успешный `POST /auth/login`
      возвращает ровно одну `set-cookie: session_id` (httpOnly); `GET /auth/me`
      без cookie → 401, с cookie от login → 200.
- [ ] 2.12 [backend] Обновить `apps/backend/src/auth/auth.controller.ts`:
      `login` вызывает новый `authService.login` (передаёт `req.ip`/
      `req.headers['user-agent']`), `logout` читает cookie из `req` — тесты
      2.11 green.
- [ ] 2.13 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      `POST /auth/logout` → 204, cookie очищена, повторный `GET /auth/me` той
      же cookie → 401 ("Завершение текущей сессии"); две сессии одного
      пользователя — logout одной не затрагивает вторую.
- [ ] 2.14 [backend] Тесты 2.13 green (реализация `logout` уже покрывает —
      подтвердить, донастроить при необходимости).
- [ ] 2.15 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      `POST /auth/logout-all` без аутентификации → 401 (не публичная ручка);
      залогиниться дважды одним пользователем (два cookie jar), вызвать
      `logout-all` через одну cookie, проверить что **обе** дают 401 на
      `/auth/me` ("Завершение всех сессий пользователя"); сессия другого
      пользователя не затронута.
- [ ] 2.16 [backend] Добавить `POST /auth/logout-all` в
      `apps/backend/src/auth/auth.controller.ts` (защищённый, берёт `user.id` из
      `@CurrentUser()`, вызывает `authService.logoutAll`) — тесты 2.15 green.
      Удалить `POST /auth/refresh` (метод и роут) из контроллера.
- [ ] 2.17 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      `POST /auth/refresh` → 404 (роут не существует).
- [ ] 2.18 [backend] Подтвердить тест 2.17 green (роут уже удалён в 2.16).
- [ ] 2.19 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      деактивация (`isActive=false`) учётной записи с действующей сессией →
      следующий запрос к защищённой ручке с той же cookie → 401
      ("Учёт блокировки и деактивации учётной записи в рамках действующей
      сессии").
- [ ] 2.20 [backend] Подтвердить тест 2.19 green (guard уже догружает `User` из
      Postgres и проверяет `isActive`/`isLocked` при каждом запросе — donastroить
      при необходимости).
- [ ] 2.21 [backend] Unit-тест на sliding-TTL: в `session.service.spec.ts`
      проверить, что `validateAndTouch` вызывает `EXPIRE` с полным TTL при
      каждом успешном обращении, и что просроченный (не найденный по TTL) ключ
      даёт `null` — покрывает "Продление сессии при активности" и "Бездействие
      дольше окна завершает сессию" на уровне мокнутого времени/TTL (реальное
      многочасовое ожидание в e2e не оправдано, см. design.md Тестовая
      стратегия).
- [ ] 2.22 [backend] Обновить `apps/backend/src/main.ts`:
      `.addCookieAuth('access_token')` → `.addCookieAuth('session_id')`.
- [ ] 2.23 [backend] Верификация: `npm run test`, `npm run test:e2e`,
      `npm run lint` из `apps/backend`.

## Infra

- [ ] 2.24 [infra] Добавить сервис `redis` (`redis:7-alpine`, healthcheck
      `redis-cli ping`, без persistent volume — см. design.md Decision §4) в
      `infra/docker-compose.yml`; `backend`-сервис получает `depends_on: redis`
      и `REDIS_URL=redis://redis:6379` в environment. Проверить, что
      `infra/docker-compose.dev.yml` не теряет `REDIS_URL` в оверлее
      backend-сервиса.
- [ ] 2.25 [infra] Локально поднять `docker compose up` (через `infra/`),
      убедиться что `redis` проходит healthcheck и `backend` стартует с
      `REDIS_URL`.

## Frontend

- [ ] 3.1 [frontend] Сгенерировать Kubb-клиент из зафиксированного контракта
      (задача 1.5) — исчезает клиент `postAuthRefresh`, появляется клиент для
      `POST /auth/logout-all`. `apps/frontend/packages/api/*/codegen/**`
      вручную не редактировать.
- [ ] 3.2 [frontend] Удалить неиспользуемый retry-на-401 код
      (`getOnUnauthorized`/`setOnUnauthorized`) в
      `apps/frontend/packages/api/base/client.ts` — семантически неверен после
      удаления `/auth/refresh` (см. proposal.md Impact, design.md Frontend).
      Проверить `grep`, что `setOnUnauthorized` действительно нигде не
      вызывается перед удалением.
- [ ] 3.3 [frontend] Верификация: `bun run typecheck`, `bun run lint`,
      `bun run build` из `apps/frontend`; относящиеся к auth существующие тесты
      (`login-form.component.test.tsx` и т.п.) остаются зелёными без изменений
      логики (cookie-механизм для фронта прозрачен).

## OpenSpec

- [ ] 4.1 [openspec] Обновить `test-plan.md` — отметить статус покрытия по
      каждому сценарию `specs/session-management/spec.md` по мере выполнения
      задач выше.
- [ ] 4.2 [openspec] `openspec validate session-based-auth --strict
      --no-interactive`.
- [ ] 4.3 [openspec] Ручная проверка через `docker compose up`: логин с двух
      вкладок браузера одним пользователем, `logout` из одной вкладки не
      затрагивает вторую, `logout-all` завершает обе (следующий запрос
      редиректит на `/`).
