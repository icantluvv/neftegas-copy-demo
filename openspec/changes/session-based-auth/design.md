## Context

Текущая реализация (`apps/backend/src/auth/`): `AuthService.validateUser()`
проверяет email/пароль через bcrypt (`LocalStrategy`/`LocalAuthGuard`, без
изменений в этом change). После успешной проверки сервис подписывает пару JWT
(`signAccessToken`/`signRefreshToken`, `@nestjs/jwt`) и кладёт их в httpOnly cookie
`access_token`/`refresh_token`. Каждый запрос проверяется `JwtStrategy`
(`passport-jwt`), которая верифицирует подпись и подгружает `User` по `payload.sub`
для проверки `isActive`/`isLocked`. Guard `JwtAuthGuard` подключён глобально через
`APP_GUARD` в `app.module.ts`, пропускает ручки с `@Public()`. Второй глобальный
guard `RolesGuard` сверяет `@Roles()` с `request.user.role` — не меняется.

Redis в проекте сейчас не используется нигде (`apps/backend/package.json` не
содержит `ioredis`/`redis`/`cache-manager`; `infra/docker-compose.yml` не содержит
Redis-сервиса). Мотивация перехода — см. `proposal.md` (Why).

## Goals / Non-Goals

**Goals:**
- Server-side источник истины для активности сессии — logout/logout-all дают
  мгновенный и гарантированный эффект, без ожидания истечения TTL.
- Одна cookie вместо пары access/refresh, с sliding-TTL вместо раздельных
  коротких/длинных токенов.
- Минимальное изменение периметра: `LocalStrategy`, `RolesGuard`,
  `@CurrentUser()`, `@Roles()`, `@Public()` не меняются.

**Non-Goals:**
- UI со списком активных сессий пользователя ("мои устройства") — не входит в
  этот change, backend-функциональность (`logout-all`) самодостаточна и
  тестируется напрямую через API.
- Миграция `User.id` с `number` на `uuid` — существующее расхождение с
  `apps/backend/AGENTS.md`, вне объёма.
- Согласование `User.username`/`User.email` — отдельный открытый вопрос из
  `align-login-role-redirect`, не затрагивается.
- Персистентность сессий между рестартами Redis — сознательно не обеспечивается
  (см. Decisions).

## Decisions

### 1. Обычный `CanActivate` guard вместо `passport-custom` strategy

Новый `SessionAuthGuard` (`apps/backend/src/common/guards/session-auth.guard.ts`)
реализует `CanActivate` напрямую: читает `@Public()`-метадату (как сейчас
`JwtAuthGuard`), достаёт `session_id` из cookie, вызывает
`SessionService.validateAndTouch()`, при успехе загружает `User` из Postgres и
присваивает `request.user`.

Альтернатива — обернуть тот же lookup в `passport-custom`-стратегию и оставить
`AuthGuard('session')`, симметрично `JwtStrategy`. Отклонено: passport
проектировался под верификацию credential/token без server-side "прикосновения" к
состоянию при каждом запросе; sliding-TTL продление (`EXPIRE`) — обязательный
side-effect на каждый успешный запрос, и его естественное место — тело guard'а, а
не verify-callback стратегии. Прямой guard также проще unit-тестировать (мок
`SessionService`, без поднятия passport-контекста) и не добавляет зависимость
`passport-custom` ради нескольких строк кода. `LocalStrategy` остаётся на passport
— там она используется по прямому назначению (`usernameField`, встроенная
обработка `req.body`).

`strategies/jwt.strategy.ts` и `common/guards/jwt-auth.guard.ts` удаляются.
`app.module.ts`: `{provide: APP_GUARD, useClass: JwtAuthGuard}` →
`useClass: SessionAuthGuard`.

### 2. Схема ключей Redis и очистка "протухших" членов индекса

- `session:<sessionId>` — string, JSON `{userId, role, createdAt, lastSeenAt, ip,
  userAgent}`, TTL = `SESSION_TTL_SECONDS` (дефолт 36000 = 10ч), продлевается
  `EXPIRE` при каждом успешном `validateAndTouch`. `role` денормализован в сессию
  ради производительности (не ходить в Postgres за ролью на каждый запрос) — этот
  снапшот статичен в рамках сессии, как раньше был статичен `payload.role` в JWT
  (известное, не новое ограничение).
- `user-sessions:<userId>` — set идентификаторов сессий, используется только
  `logout-all`. Не имеет собственного TTL. `destroyAll(userId)`: `SMEMBERS` → `DEL
  session:<id>` для каждого id (не проверяя существование — удаление
  несуществующего ключа не ошибка) → `DEL user-sessions:<userId>` целиком.
  Такая стратегия устраняет "протухшие" id разом при каждом `logout-all`, не
  требуя фоновой очистки; между `logout-all`-вызовами id завершившихся по TTL
  сессий могут накапливаться в сете, но ограничены количеством login-событий
  пользователя за время его активности — не неограниченный рост.

Session id — `crypto.randomBytes(32).toString('base64url')` (256 бит энтропии),
генерируется только на сервере в `SessionService.create()`.

Redis-клиент — `ioredis`. Новый глобальный `RedisModule`
(`apps/backend/src/redis/`), провайдер `REDIS_CLIENT` через `useFactory`
(`ConfigService.get('REDIS_URL')`), `onModuleDestroy` → `client.quit()` для
чистого шатдауна (важно для Jest, чтобы e2e-раннер не зависал на открытом
соединении).

### 3. Одна cookie `session_id`, TTL/sliding-стратегия

Атрибуты: `httpOnly: true`, `secure` в production, `sameSite: 'lax'`, `path: '/'`,
`maxAge: SESSION_TTL_SECONDS * 1000`. Cookie выставляется один раз при `login`,
не переставляется на каждый запрос (это было бы избыточной нагрузкой без
функциональной пользы) — источник истины по TTL всегда Redis (`EXPIRE` в
`validateAndTouch`). Компромисс: при очень долгой непрерывной активности `maxAge`
cookie на клиенте может истечь раньше, чем реально продлённая Redis-сессия, если
браузер решит отбросить cookie по истечении исходного `maxAge` — на практике не
проявляется в пределах разумных сессий (часы), и не создаёт уязвимости (просто
преждевременный logout, не расширение доступа).

### 4. Redis без persistent volume

`infra/docker-compose.yml`: сервис `redis` (`redis:7-alpine`) без volume для
данных. Сессии по природе эфемерны — потеря всех сессий при рестарте Redis
(разлогин всех пользователей) не хуже текущего поведения "все JWT одновременно
теряют смысл", если сменить секрет подписи. Персистентность добавила бы
операционную сложность (бэкапы, риск устаревших данных после сбоя) без
компенсирующей пользы.

### 5. Контракт `AuthUser` не меняется

`POST /auth/login`, `POST /auth/logout`, `GET /auth/me` продолжают возвращать/не
менять `AuthUser`-схему (`api/src/components/schemas/auth.yaml`) — меняется
только транспортный механизм (cookie), не бизнес-данные ответа.

## Backend

- `apps/backend/src/redis/redis.constants.ts`, `redis.module.ts` — см. Decision 2.
- `apps/backend/src/auth/session.service.ts` (новый) — `create`,
  `validateAndTouch`, `destroy`, `destroyAll` (сигнатуры — см. `proposal.md`
  Impact и `tasks.md`).
- `apps/backend/src/auth/auth.service.ts` — убрать JWT-константы, `JwtService`,
  `signAccessToken`/`signRefreshToken`/`refresh()`; добавить `login`/`logout`/
  `logoutAll`, использующие `SessionService`.
- `apps/backend/src/auth/auth.controller.ts` — `POST /auth/logout-all` (новый,
  защищённый), удалить `POST /auth/refresh`.
- `apps/backend/src/auth/strategies/jwt.strategy.ts` — удалить.
- `apps/backend/src/auth/types.ts` — заменить `JwtPayload` на `SessionData`.
- `apps/backend/src/common/guards/jwt-auth.guard.ts` → новый
  `session-auth.guard.ts` (см. Decision 1).
- `apps/backend/src/app.module.ts` — `RedisModule` в imports, `APP_GUARD` →
  `SessionAuthGuard`.
- `apps/backend/src/main.ts` — `.addCookieAuth('access_token')` →
  `.addCookieAuth('session_id')`.
- `apps/backend/package.json` — `+ioredis`, `-@nestjs/jwt`, `-passport-jwt`.
- `apps/backend/.env.example` — `+REDIS_URL`, `-JWT_ACCESS_SECRET`,
  `-JWT_REFRESH_SECRET`.

Owner: разработчик, реализующий backend-часть change (первичная задача — API,
затем backend вслед за подтверждённым контрактом).

## Frontend

Затрагивается минимально: `packages/api/base/client.ts` использует
`credentials: 'include'` и не парсит имена cookie — переход на одну cookie
`session_id` не требует изменений в логике запросов. Обязательные шаги:
- Перегенерировать Kubb-клиент из обновлённого `api/src/openapi.yaml` (см.
  `apps/frontend/AGENTS.md` за точной командой) — исчезает `postAuthRefresh`,
  появляется клиент для `POST /auth/logout-all`.
- Удалить неиспользуемый retry-на-401 код (`getOnUnauthorized`/
  `setOnUnauthorized` в `packages/api/base/client.ts`) — он нигде не подключён
  (`setOnUnauthorized` не вызывается в кодовой базе) и был написан под идею
  "истёк access → дёрнуть refresh", которая перестаёт существовать вместе с
  удалением `/auth/refresh`.

UI для logout-all — Non-Goal (см. выше), явно не проектируется в этом change.

## API Shape

- `POST /auth/login` — без изменений в теле запроса/ответа
  (`LoginRequest`/`AuthUser`, `api/src/components/schemas/auth.yaml`); меняется
  только выставляемая cookie (`access_token`+`refresh_token` → `session_id`).
  Файл: `api/src/paths/auth-login.yaml`.
- `POST /auth/logout` — без изменений сигнатуры (`204`); очищает одну cookie
  вместо двух. Файл: `api/src/paths/auth-logout.yaml`.
- `POST /auth/logout-all` (**новый**) — `security: [cookieAuth: []]`, без тела
  запроса, `204` при успехе, `401` при отсутствии/недействительности сессии.
  Новый файл: `api/src/paths/auth-logout-all.yaml`, зарегистрировать в
  `api/src/openapi.yaml`.
- `POST /auth/refresh` — **удаляется**: файл `api/src/paths/auth-refresh.yaml`
  удаляется, путь убирается из `api/src/openapi.yaml`. **BREAKING**.
- `GET /auth/me` — без изменений.
- `components/securitySchemes.cookieAuth`: `name: access_token` →
  `name: session_id`.

Обратная совместимость: клиенты, ранее вызывавшие `/auth/refresh`, получат `404`;
фронтенд этого репозитория такой вызов не делает (проверено — retry-хендлер не
подключён), внешних потребителей контракта нет.

## Тестовая стратегия

Риск: **P0** — компонент аутентификации, затрагивает доступ ко всем защищённым
ручкам системы согласования корректировок.

TDD-порядок по каждому сценарию из `specs/session-management/spec.md`: failing
test → минимальная реализация → green → refactor.

- **Backend Unit** (`*.spec.ts`, Jest): `session.service.spec.ts` — `create`
  вызывает `SET`+`SADD` с ожидаемыми ключами/TTL; `validateAndTouch` — найдена
  сессия → `EXPIRE`+данные, не найдена → `null`; `destroy` — `DEL`+`SREM`;
  `destroyAll` — множественный `DEL`+`DEL` сета, пустой сет → no-op.
  `session-auth.guard.spec.ts` — `@Public()` пропускает, нет cookie → 401,
  невалидная сессия → 401, валидная → `request.user` установлен. Redis мокается
  (не реальный клиент) — юнит-тесты проверяют логику сервиса/guard'а, не сам
  Redis.
- **Backend Feature/E2E** (`*.e2e-spec.ts`, реальный Postgres + реальный тестовый
  Redis): расширение `apps/backend/test/auth.e2e-spec.ts` — сценарии "Успешный
  вход создаёт сессию", "Запрос с действующей сессией проходит"/"без cookie"/"с
  несуществующей сессией", "Logout завершает только текущую сессию", "Logout-all
  завершает все сессии пользователя"/"не затрагивает сессии других
  пользователей", "Деактивация учётной записи блокирует доступ по живой сессии",
  а также негативная проверка `POST /auth/refresh` → `404`. Сценарий sliding-TTL
  ("Бездействие дольше окна завершает сессию") — P0, но требует управления
  временем на масштабе часов; тестируется unit-уровнем на `SessionService`
  (мокнутый Redis TTL/время), а не e2e с реальным ожиданием — реальный e2e с
  ожиданием часов не оправдан по стоимости, здесь используется control через мок.
- **API**: `api/` — `npm run lint`/`npm run bundle` на обновлённом
  `openapi.yaml`.
- **Frontend**: критичных изменений поведения нет (см. раздел Frontend) —
  ограничивается regenerate Kubb-клиента и статической проверкой (`bun run
  lint`/`bun run build`), отдельных новых unit/component/E2E тестов на фронте не
  требуется для этого change.
- **Ручные проверки**: полный цикл через `docker compose up` — логин с двух
  вкладок браузера, проверка `logout` (одна сессия) и `logout-all` (обе), после
  чего защищённые страницы редиректят на `/`.

## Risks / Trade-offs

- [Risk] Redis становится обязательной runtime-зависимостью backend (ранее auth
  был полностью stateless) → Mitigation: healthcheck в `docker-compose.yml`,
  `depends_on` для backend-сервиса; при недоступности Redis все аутентифицированные
  запросы закономерно получают 5xx — это ожидаемое поведение новой архитектуры, не
  скрытый баг.
- [Risk] Расхождение TTL cookie (client-side hint) и реального TTL сессии в Redis
  (sliding) при очень долгой активности → Mitigation: описано в Decision 3,
  приемлемый компромисс (преждевременный logout, не расширение доступа).
- [Risk] `logout-all` убивает и ту сессию, из которой вызван запрос — пользователь
  сразу теряет доступ и должен войти заново → Mitigation: соответствует ожидаемой
  семантике "выйти со всех устройств" (см. `specs/session-management/spec.md`,
  Requirement "Завершение всех сессий пользователя"), задокументировано явно в
  spec, не требует дополнительной обработки.

## Migration Plan

1. Реализовать и слить backend+API+infra изменения в одном PR (единый change).
2. Выкатить `redis`-сервис в `infra/docker-compose.yml` перед деплоем новой
   версии backend (иначе backend не поднимется — `RedisModule` требует
   `REDIS_URL`).
3. При деплое все существующие JWT-сессии пользователей станут недействительны
   одномоментно (новый guard не понимает старые cookie) — ожидаемый разовый
   принудительный re-login всех пользователей, зафиксировать в release notes.
4. Откат: вернуть предыдущую версию backend-образа; `redis`-сервис можно оставить
   поднятым (не мешает JWT-версии) или убрать — не является блокером отката.
