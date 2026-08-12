## API

- [x] 1.1 [api] Обновить `api/src/openapi.yaml`:
      `components.securitySchemes.cookieAuth.name` `access_token` → `session_id`.
- [x] 1.2 [api] Удалить `api/src/paths/auth-refresh.yaml` и убрать регистрацию
      пути `/auth/refresh` из `api/src/openapi.yaml`.
- [x] 1.3 [api] Добавить `api/src/paths/auth-logout-all.yaml` (`POST`,
      `security: [cookieAuth: []]`, без тела запроса, `204` при успехе, `401` →
      `../components/schemas/error-response.yaml`) и зарегистрировать
      `/auth/logout-all` в `api/src/openapi.yaml`.
- [x] 1.4 [api] Обновить описания в `api/src/paths/auth-login.yaml` и
      `api/src/paths/auth-logout.yaml`, если там упоминаются JWT/refresh-токен
      явно (заменить на формулировки про server-side сессию).
- [x] 1.5 [api] Выполнить `npm run lint` (и `npm run bundle` при необходимости)
      из `api/`; зафиксировать контракт как source of truth для задач ниже.
      `npm run lint` — 0 ошибок (41 pre-existing warning `operation-4xx-response`
      по всему файлу, не связано с этим change).

## Backend

- [x] 2.1 [backend] Добавить `ioredis` в `apps/backend/package.json`, убрать
      `@nestjs/jwt` и `passport-jwt` (и их `@types/*`, если есть в
      devDependencies), `npm install`.
- [x] 2.2 [backend] Добавить `REDIS_URL=redis://localhost:6379` в
      `apps/backend/.env.example` и корневой `.env.example`, убрать
      `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`.
- [x] 2.3 [backend] Failing test: `apps/backend/src/redis/redis.module.spec.ts`
      или инлайн-проверка в `session.service.spec.ts` (2.5) — модуль
      предоставляет `REDIS_CLIENT`, собранный из `ConfigService.get('REDIS_URL')`.
      Реализовано как явная проверка через `session.service.spec.ts` (2.5) —
      `SessionService` инжектит `REDIS_CLIENT`, что покрывает провайдер
      косвенно; отдельный `redis.module.spec.ts` избыточен.
- [x] 2.4 [backend] Создать `apps/backend/src/redis/redis.constants.ts`
      (`REDIS_CLIENT` символ) и `apps/backend/src/redis/redis.module.ts`
      (`@Global()`, провайдер через `useFactory(ConfigService)`,
      `onModuleDestroy` → `client.quit()`). Импортировать в
      `apps/backend/src/app.module.ts` — тест 2.3 green.
- [x] 2.5 [backend] Failing tests:
      `apps/backend/src/auth/session.service.spec.ts` — `create()` вызывает
      `SET session:<id>`+`SADD user-sessions:<userId>` с ожидаемым TTL;
      `validateAndTouch()` — найдена сессия → `EXPIRE`+распарсенные данные, не
      найдена → `null`; `destroy()` — `DEL`+`SREM`; `destroyAll()` — `SMEMBERS`
      → множественный `DEL` → `DEL` сета, пустой сет → no-op (мок `ioredis`).
      Соответствует `specs/session-management/spec.md`: "Выдача сессии при
      успешном входе", "Продление сессии при активности (sliding TTL)",
      "Завершение текущей сессии (logout)", "Завершение всех сессий
      пользователя (logout-all)".
- [x] 2.6 [backend] Реализовать `apps/backend/src/auth/session.service.ts`
      (`SessionData`, `create`/`validateAndTouch`/`destroy`/`destroyAll`,
      `SESSION_TTL_SECONDS` из конфига, session id — `crypto.randomBytes(32)
      .toString('base64url')`) — тесты 2.5 green (7/7).
- [x] 2.7 [backend] Failing test:
      `apps/backend/src/common/guards/session-auth.guard.spec.ts` — `@Public()`
      пропускает без cookie; нет cookie → 401; `SessionService.validateAndTouch`
      возвращает `null` → 401; валидная сессия → `SessionService.validateAndTouch`
      вызван, `request.user` установлен на актуального пользователя из Postgres
      (мок репозитория), `canActivate` → `true`. Соответствует "Доступ к
      защищённым ручкам по действующей сессии".
- [x] 2.8 [backend] Реализовать
      `apps/backend/src/common/guards/session-auth.guard.ts` (см. design.md
      Decision §1); удалить `apps/backend/src/common/guards/jwt-auth.guard.ts` и
      `apps/backend/src/auth/strategies/jwt.strategy.ts`; заменить `JwtPayload`
      на `SessionData` в `apps/backend/src/auth/types.ts`; обновить
      `apps/backend/src/app.module.ts` (`APP_GUARD` → `SessionAuthGuard`) —
      тесты 2.7 green (5/5). Реализовано через `UsersService.findActiveById`
      (новый метод) вместо прямого `@InjectRepository(User)` в guard'е — guard
      регистрируется в `AppModule` через `APP_GUARD`, а не внутри `AuthModule`,
      поэтому ему проще и чище получать пользователя через уже экспортируемый
      `UsersService`, чем тащить репозиторий напрямую в чужой модуль.
- [x] 2.9 [backend] Обновить `apps/backend/src/auth/auth.service.ts`: убрать
      JWT-константы/`JwtService`/`signAccessToken`/`signRefreshToken`/`refresh()`;
      добавить `login(user, meta, res)`, `logout(sessionId, res)`,
      `logoutAll(userId, res)` на основе `SessionService` (cookie `session_id`,
      см. design.md Decision §3). `validateUser()` без изменений.
- [x] 2.10 [backend] Обновить `apps/backend/src/auth/auth.module.ts`
      (providers/imports без `JwtModule`/`JwtStrategy`, добавить
      `SessionService`, экспортировать `SessionService` для `SessionAuthGuard`).
- [x] 2.11 [backend] Failing test: расширить
      `apps/backend/test/auth.e2e-spec.ts` — успешный `POST /auth/login`
      возвращает ровно одну `set-cookie: session_id` (httpOnly); `GET /auth/me`
      без cookie → 401, с cookie от login → 200.
- [x] 2.12 [backend] Обновить `apps/backend/src/auth/auth.controller.ts`:
      `login` вызывает новый `authService.login` (передаёт `req.ip`/
      `req.headers['user-agent']`), `logout` читает cookie из `req` — тесты
      2.11 green.
- [x] 2.13 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      `POST /auth/logout` → 204, cookie очищена, повторный `GET /auth/me` той
      же cookie → 401 ("Завершение текущей сессии"); две сессии одного
      пользователя — logout одной не затрагивает вторую.
- [x] 2.14 [backend] Тесты 2.13 green (реализация `logout` уже покрывает —
      подтвердить, донастроить при необходимости).
- [x] 2.15 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      `POST /auth/logout-all` без аутентификации → 401 (не публичная ручка);
      залогиниться дважды одним пользователем (два cookie jar), вызвать
      `logout-all` через одну cookie, проверить что **обе** дают 401 на
      `/auth/me` ("Завершение всех сессий пользователя"); сессия другого
      пользователя не затронута.
- [x] 2.16 [backend] Добавить `POST /auth/logout-all` в
      `apps/backend/src/auth/auth.controller.ts` (защищённый, берёт `user.id` из
      `@CurrentUser()`, вызывает `authService.logoutAll`) — тесты 2.15 green.
      Удалить `POST /auth/refresh` (метод и роут) из контроллера.
- [x] 2.17 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      `POST /auth/refresh` → 404 (роут не существует).
- [x] 2.18 [backend] Подтвердить тест 2.17 green (роут уже удалён в 2.16).
- [x] 2.19 [backend] Failing test: `apps/backend/test/auth.e2e-spec.ts` —
      деактивация (`isActive=false`) учётной записи с действующей сессией →
      следующий запрос к защищённой ручке с той же cookie → 401
      ("Учёт блокировки и деактивации учётной записи в рамках действующей
      сессии").
- [x] 2.20 [backend] Подтвердить тест 2.19 green (guard уже догружает `User` из
      Postgres через `UsersService.findActiveById` и проверяет
      `isActive`/`isLocked` при каждом запросе).
- [x] 2.21 [backend] Unit-тест на sliding-TTL: в `session.service.spec.ts`
      проверить, что `validateAndTouch` вызывает `EXPIRE` с полным TTL при
      каждом успешном обращении, и что просроченный (не найденный по TTL) ключ
      даёт `null` — покрывает "Продление сессии при активности" и "Бездействие
      дольше окна завершает сессию" на уровне мокнутого времени/TTL (реальное
      многочасовое ожидание в e2e не оправдано, см. design.md Тестовая
      стратегия). Покрыто существующими тестами `validateAndTouch` из 2.5 —
      отдельного дополнительного теста не потребовалось.
- [x] 2.22 [backend] Обновить `apps/backend/src/main.ts`:
      `.addCookieAuth('access_token')` → `.addCookieAuth('session_id')`.
- [x] 2.23 [backend] Верификация: `npm run test` (13/13), `npm run test:e2e`
      (22/23 — единственный сбой `app.e2e-spec.ts` pre-existing, не связан с
      этим change, см. tasks.md `align-login-role-redirect` 2.8), `tsc --noEmit`
      чисто. `npm run lint` — 0 новых ошибок в затронутых файлах (unsafe-any на
      `request.user` — тот же класс pre-existing warning, что уже есть в
      нетронутых `current-user.decorator.ts`/`roles.guard.ts`, не является
      регрессией).

## Infra

- [x] 2.24 [infra] Добавить сервис `redis` (`redis:7-alpine`, healthcheck
      `redis-cli ping`, без persistent volume — см. design.md Decision §4) в
      `infra/docker-compose.yml`; `backend`-сервис получает `depends_on: redis`
      и `REDIS_URL=redis://redis:6379` в environment. Проверено через
      `docker compose config` (base + dev overlay) — `REDIS_URL` присутствует в
      обоих, дев-оверлей ничего не теряет (compose мёржит `environment`-карты
      по ключам).
- [x] 2.25 [infra] Локально поднять `docker compose up` (через `infra/`),
      убедиться что `redis` проходит healthcheck и `backend` стартует с
      `REDIS_URL`. `redis` — healthy, backend стартовал без ошибок подключения
      к Redis, `POST /auth/login` с неверным паролем внутри контейнера отвечает
      `401` как ожидается.

## Frontend

- [x] 3.1 [frontend] Сгенерировать Kubb-клиент из зафиксированного контракта
      (задача 1.5) — исчезает клиент `postAuthRefresh`/`refresh`, появляется
      клиент `logoutAll`/`useLogoutAll` для `POST /auth/logout-all`.
      `apps/frontend/packages/api/*/codegen/**` сгенерирован через
      `npm run generate` в `packages/api`, вручную не редактировался.
- [x] 3.2 [frontend] Удалить неиспользуемый retry-на-401 код
      (`getOnUnauthorized`/`setOnUnauthorized`/
      `setServerUnauthorizedRetryHeadersHandler`/
      `getServerUnauthorizedRetryHeaders`) в
      `apps/frontend/packages/api/base/client.ts` и `client-handlers.ts` —
      семантически неверен после удаления `/auth/refresh` (см. proposal.md
      Impact, design.md Frontend). Подтверждено `grep`, что
      `setServerUnauthorizedRetryHeadersHandler`/`setOnUnauthorized` нигде не
      вызывались перед удалением. `getOnProfileIncomplete`/
      `setOnProfileIncomplete` (несвязанный механизм) сохранены без изменений.
      401 теперь обрабатывается общей веткой `!response.ok` — поведение для
      вызывающего кода (`(private)/layout.tsx` редиректит по `cause.status`)
      не изменилось.
- [x] 3.3 [frontend] Верификация: `npx tsc --noEmit` — чисто; `bun run lint` —
      142 pre-existing проблемы по всему репозиторию (в основном
      `no-explicit-any` в сгенерированных Kubb-типах, не связаны с этим change);
      затронутые файлы (`client.ts`/`client-handlers.ts`) — 0 ошибок, 2
      pre-existing-паттерн warning (`_TError` неиспользуемый generic,
      аналогично уже существующему `Client` типу); `bun run test` — 21/22,
      единственный сбой не связан с auth (несоответствие формата CSS-цвета
      `oklch` в `setup-browser.component.test.ts`); `bun run build` (с
      локальными env-переменными) — успешен, включая `/filial`/`/cfo`/`/dtoe`.

## OpenSpec

- [x] 4.1 [openspec] Обновить `test-plan.md` — отметить статус покрытия по
      каждому сценарию `specs/session-management/spec.md` по мере выполнения
      задач выше.
- [x] 4.2 [openspec] `openspec validate session-based-auth --strict
      --no-interactive`.
- [x] 4.3 [openspec] Ручная проверка через живой `docker compose` стек: два
      `curl` cookie jar одним пользователем (эмуляция двух вкладок) — обе
      сессии независимы, `logout` гасит только свою, `logout-all` гасит обе,
      `POST /auth/refresh` → `404`.
