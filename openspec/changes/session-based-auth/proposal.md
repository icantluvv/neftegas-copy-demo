## Why

Сейчас аутентификация полностью построена на JWT в httpOnly cookie (access 30 мин
+ refresh 10 ч, `apps/backend/src/auth/`). Сервер не хранит состояние сессии —
украденный токен нельзя отозвать до истечения `exp`, а функции «выйти со всех
устройств» не существует в принципе: при компрометации токена единственная защита —
дождаться истечения TTL. Для системы согласования корректировок с чувствительными
документами и требованием полного аудита (ДТОиР) это неприемлемый разрыв между
инцидентом и реакцией на него. Переход на server-side сессии в Redis даёт
мгновенный и полный отзыв доступа.

## What Changes

- Аутентификация переводится с JWT (access+refresh) на server-side сессии,
  хранимые в Redis, с одной httpOnly cookie `session_id` вместо пары
  `access_token`/`refresh_token`.
- TTL сессии — sliding window (продлевается автоматически при каждом
  аутентифицированном запросе), дефолт 10 часов — сохраняет наблюдаемое поведение
  «сессия жива 10 часов бездействия», которое сейчас обеспечивал refresh-токен.
- Добавляется `POST /auth/logout-all` — завершает все активные сессии текущего
  пользователя (включая текущую), а не только одну.
- **BREAKING**: `POST /auth/refresh` удаляется полностью — при sliding-TTL
  отдельный refresh-эндпоинт избыточен; фронтенд его сейчас не вызывает
  (retry-хендлер на 401 существует в коде, но нигде не подключён).
- **BREAKING**: имя cookie для аутентификации меняется с `access_token` на
  `session_id`; cookie `refresh_token` перестаёт существовать.
- `JwtStrategy`/`JwtAuthGuard` заменяются на `SessionAuthGuard` — обычный
  `CanActivate`, читающий cookie и проверяющий сессию в Redis.
  `LocalStrategy`/`LocalAuthGuard` (логин по email/паролю) не меняются.
- В инфраструктуру (`infra/docker-compose.yml`) добавляется сервис `redis`.

## Capabilities

### New Capabilities
- `session-management`: жизненный цикл server-side сессии — создание при логине,
  sliding-продление TTL при активности, завершение конкретной сессии (logout),
  завершение всех сессий пользователя (logout-all), отказ в доступе при
  отсутствующей/истёкшей/уничтоженной сессии.

### Modified Capabilities
_Нет._ Capability `login` (аутентификация по email/паролю, редирект по роли) из
change `align-login-role-redirect` ещё не заархивирована в `openspec/specs/` —
формального базового spec на данный момент не существует, поэтому здесь нет
delta-спеки для неё. Механика проверки email/пароля (`AuthService.validateUser`,
`LocalStrategy`) не меняется — меняется только то, что происходит **после**
успешной проверки пароля (выдаётся сессия вместо пары JWT).

## Impact

- **Backend** (`apps/backend/`): `src/auth/auth.service.ts`,
  `src/auth/auth.controller.ts`, `src/auth/auth.module.ts`,
  `src/auth/strategies/jwt.strategy.ts` (удаляется), `src/auth/types.ts`,
  новый `src/auth/session.service.ts`; `src/common/guards/jwt-auth.guard.ts`
  (удаляется) → новый `src/common/guards/session-auth.guard.ts`; `src/app.module.ts`
  (APP_GUARD, новый глобальный `RedisModule`); новый `src/redis/`; `src/main.ts`
  (Swagger cookie-auth). `package.json`: `+ioredis`, `-@nestjs/jwt`,
  `-passport-jwt`.
- **API-контракт** (`api/`): `api/src/openapi.yaml`,
  `api/src/paths/auth-login.yaml`, `api/src/paths/auth-logout.yaml`,
  `api/src/paths/auth-refresh.yaml` (удаляется), новый
  `api/src/paths/auth-logout-all.yaml`, `securitySchemes.cookieAuth.name`.
- **Frontend** (`apps/frontend/`): перегенерация Kubb-клиента из обновлённого
  контракта (исчезает `postAuthRefresh`, появляется клиент для
  `/auth/logout-all`); удаление неиспользуемого retry-на-401 кода в
  `packages/api/base/client.ts`. UI для «выйти со всех устройств» — вне объёма
  этого change (эндпоинт покрывается тестами напрямую).
- **Инфраструктура** (`infra/`): новый сервис `redis` в `docker-compose.yml`
  (без persistent volume — сессии эфемерны по замыслу), `.env.example`
  (`+REDIS_URL`, `-JWT_ACCESS_SECRET`, `-JWT_REFRESH_SECRET`).
- **Внешние зависимости**: новый Redis-инстанс как обязательная runtime-зависимость
  backend (ранее backend был stateless по части auth).
