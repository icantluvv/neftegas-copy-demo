## Context

См. `proposal.md` — Why/What Changes. Технические ограничения, важные для решений
ниже:

- `User.entity.ts` (`apps/backend/src/users/entities/user.entity.ts`) уже содержит
  ДВА разных поля: `username` (`@Index({ unique: true })`, реально используется как
  логин во всех auth-потоках — `LocalStrategy`, `AuthService.validateUser`) и
  `email` (`@Column({ default: '' })`, не уникален, нигде не используется для
  входа, сейчас всегда пустая строка в seed-данных). Документированная в корневом
  `apps/backend/AGENTS.md` модель `User` фиксирует единственное поле `email` как
  уникальный логин — фактический код разошёлся с этим описанием ещё до этого
  change.
- `LoginRequest`/`User`/`UserSummary`/`UserCreateInput` в `api/src/components/
  schemas/*.yaml` независимо друг от друга объявляют поле `username` — оно
  используется не только для логина, но и во всём домене управления
  пользователями (админ создаёт/просматривает пользователей).
- `apps/backend/src/database/seed.ts` создаёt демо-пользователей с `username`:
  `'filial'`, `'cfo'`, `'dtoe'`, `'admin'` — не в формате email.
- В проекте нет каталога TypeORM-миграций; `synchronize: true` действует только
  вне production (`apps/backend/src/app.module.ts:29`), в production схема
  обновляется отдельным процессом, которого в этом репозитории пока нет.
- `RolesGuard` (`apps/backend/src/common/guards/roles.guard.ts`) уже подключён
  глобально через `APP_GUARD` в `app.module.ts` вместе с `JwtAuthGuard` — новый
  guard не нужен, `@Roles(Role.X)` на хендлере достаточно для 403 на чужую роль.
- `CorrectionsService.getStats(user)` (`apps/backend/src/corrections/
  corrections.service.ts:263`) уже возвращает разные данные в зависимости от
  `user.role` (CFO видит свои `CorrectionCfoStatus`, FILIAL — свои корректировки,
  DTOE — без фильтра, все) — подходящий источник данных для заглушек ролевых
  разделов без дублирования бизнес-логики.
- `(private)/layout.tsx` уже содержит паттерн «серверный вызов → перехват 401/403
  → редирект/иной рендер» — новые ролевые layout'ы переиспользуют этот же паттерн.

## Goals / Non-Goals

**Goals:**
- Поле логина в контракте `POST /auth/login` называется `email` и валидируется
  как email на фронте и бэке.
- После успешного входа фронтенд редиректит по роли на `/filial`, `/cfo`,
  `/dtoe`.
- Прямой заход на чужой ролевой раздел получает `403` от бэкенда и экран
  «Доступ запрещён» на фронте.

**Non-Goals:**
- Полное переименование `username` → `email` во всём домене `users` (модель
  `User`, `UserSummary`, `UserCreateInput`, админский CRUD пользователей). Это
  отдельная, более крупная задача выравнивания модели данных с
  `apps/backend/AGENTS.md`; фиксируется как открытый вопрос ниже.
- Наполнение `/filial`, `/cfo`, `/dtoe` реальным продуктовым функционалом —
  только заглушка, достаточная для проверки редиректа и guard'а.
- Создание маршрута `/login` — страница входа остаётся на `/` (подтверждено
  пользователем).
- Настройка TypeORM-миграций для production — используется существующий
  механизм `synchronize` в dev/test; для production изменение схемы выполняется
  вручную DBA как и остальные существующие изменения схемы в проекте (вне этого
  change).

## Decisions

### 1. `LoginRequest.email` продолжает читаться из колонки `username`

Переименовываем **только** поле логина в `LoginRequest`/`LoginDto`/фронтовой
форме: `username` → `email`, с проверкой формата. Внутри `AuthService` и
`LocalStrategy` значение по-прежнему ищется по существующей колонке
`user.username` (переименование самой колонки и согласование с отдельным полем
`User.email` — вне области этого change, см. Open Questions).

**Почему**: колонка `username` физически хранит текущие логины и используется
guard'ами/стратегией аутентификации; полное согласование `User.username` и
`User.email` — это отдельная миграция данных, затрагивающая весь домен `users`
(схемы `User`, `UserSummary`, `UserCreateInput`, `users.controller.ts`,
`users.service.ts`, seed), а не только экран входа. Смешивать это с login-flow
change увеличивает риск и объём непропорционально задаче «экран входа».

**Альтернатива (отклонена)**: переименовать колонку `username` → `email` и
удалить старое неиспользуемое поле `email` из `User.entity.ts` целиком.
Технически чище, но расширяет change на весь `users`-домен (создание
пользователей администратором, поиск, отображение), не входящий в
согласованный scope. Оставлено как рекомендация для отдельного change.

**Последствие**: `seed.ts` обновляется — 4 демо-логина меняются на
email-подобные строки (например, `filial@demo.local`), чтобы удовлетворять
`@IsEmail()`; иначе демо-вход перестанет проходить валидацию формата.

### 2. Ролевые заглушки переиспользуют `CorrectionsService.getStats`

Для разделов `/filial`, `/cfo`, `/dtoe` добавляются три тонких GET-хендлера в
`corrections.controller.ts`: `GET /corrections/stats/filial`
(`@Roles(Role.FILIAL)`), `GET /corrections/stats/cfo` (`@Roles(Role.CFO)`),
`GET /corrections/stats/dtoe` (`@Roles(Role.DTOE)`) — каждый вызывает уже
существующий `service.getStats(user)`.

**Почему**: `getStats` уже возвращает данные, отфильтрованные под роль
(`corrections.service.ts:263`) — не нужно писать новую бизнес-логику или новый
домен ради заглушки. Ролевой guard навешивается декоратором `@Roles()` на
отдельный путь для каждой роли, поэтому попытка вызвать «чужой» путь (например,
CFO дергает `/corrections/stats/dtoe`) получает `403` от уже существующего
`RolesGuard`, без написания нового guard-кода.

**Альтернатива (отклонена)**: не проверять роль на бэкенде отдельным
эндпоинтом, полагаться только на фронтовый редирект по `role` из `/auth/me`.
Отклонено — противоречит корневому правилу `AGENTS.md` «проверка обязана
выполняться на бэкенде, а не только скрытием на фронте» и явному сценарию
спеки экрана входа (403 от бэкенда обязателен).

### 3. Ролевые layout'ы переиспользуют паттерн `(private)/layout.tsx`

`apps/frontend/app/(private)/filial/layout.tsx` (и аналогично `cfo/`, `dtoe/`)
на сервере вызывает соответствующий Kubb-хук (`getCorrectionsStatsFilial()` и
т.д.), перехватывает ошибку: при `cause.status === 403` рендерит компонент
`AccessDeniedScreen` вместо `children`, иначе пробрасывает как во внешнем
`PrivateLayout`.

**Почему**: минимальное расхождение со сложившимся в кодовой базе паттерном
(`(private)/layout.tsx` уже перехватывает 401/403/413 и решает, что рендерить);
не вводится новый способ проверки прав на фронте.

## Risks / Trade-offs

- [Смешение `LoginRequest.email` (реально колонка `username`) и уже
  существующего, отдельного `User.email`/`AuthUser.email` (всегда пустая
  строка)] → задокументировано как известное ограничение в Open Questions;
  не блокирует объявленные в `specs/login/spec.md` сценарии, так как они
  описывают только форму входа, а не профиль пользователя.
- [Демо-логины меняются в `seed.ts`] → все, кто пользуется локальным seed для
  разработки/тестов, должны использовать новые email-подобные логины; отражается
  в `tasks.md` и, если есть, в README/README дев-окружения.
- [Три новых почти одинаковых GET-хендлера в `corrections.controller.ts`] →
  осознанный минимальный дубль ради простоты и согласованности с существующим
  guard-паттерном; тело каждого хендлера — одна строка, дублирования логики нет.

## Migration Plan

- Backend: правки `User`-независимых файлов (DTO, strategy, service, seed) не
  требуют миграции схемы БД — колонка `username` не переименовывается и не
  удаляется. `synchronize: true` (dev/test) подхватит новые Corrections-роуты
  без изменений схемы.
- Откат: изменения обратимы стандартным git revert — новых необратимых операций
  (удаление колонок, необратимые миграции) нет.

## Open Questions

- Нужно ли в отдельном change согласовать `User.username`/`User.email` с
  документированной в `apps/backend/AGENTS.md` моделью (`email` — единственный
  уникальный логин), включая весь домен `users` (админский CRUD,
  `UserSummary`, `UserCreateInput`)? Не блокирует этот change — email-формат в
  `LoginRequest` работает поверх текущей колонки `username` независимо от
  итогового решения.

## API Shape

**Изменённый эндпоинт**

- `POST /auth/login` (`api/src/paths/auth-login.yaml`,
  `api/src/components/schemas/auth.yaml`): `LoginRequest.username` → `email`
  (`type: string, format: email`), `required: [email, password]` без изменений
  количества полей. Ответы `200`/`401` без изменений. **BREAKING** для любых
  внешних клиентов, отправляющих `username`.

**Новые эндпоинты**

- `GET /corrections/stats/filial` — `operationId: getCorrectionStatsFilial`,
  `security`: как у остальных эндпоинтов домена (JWT-cookie, глобальный guard),
  доступ только роли `FILIAL`. `200`: `../components/schemas/correction-
  stats.yaml` (тот же ответ, что у `GET /corrections/stats`). `403`: чужая
  роль — `../components/schemas/error-response.yaml`.
- `GET /corrections/stats/cfo` — аналогично для роли `CFO`.
- `GET /corrections/stats/dtoe` — аналогично для роли `DTOE`.
- Файлы: `api/src/paths/corrections-stats-filial.yaml`,
  `corrections-stats-cfo.yaml`, `corrections-stats-dtoe.yaml`, регистрация в
  `api/src/openapi.yaml` под `/corrections/stats/filial`,
  `/corrections/stats/cfo`, `/corrections/stats/dtoe`.

## Backend

**Файлы / Owners** (владелец — автор change, начавший с API-задачи):
- `api/src/components/schemas/auth.yaml`, `api/src/paths/auth-login.yaml` —
  переименование поля.
- `apps/backend/src/auth/dto/login.dto.ts` — `username` → `email`,
  `@IsEmail()` вместо `@IsString()`.
- `apps/backend/src/auth/strategies/local.strategy.ts` — `usernameField:
  'email'`, `validate(email, password)`, комментарий о временном маппинге на
  колонку `username` (см. Decisions §1).
- `apps/backend/src/auth/auth.service.ts` — `validateUser(email, password)`,
  запрос остаётся `where('user.username = :email', { email })` с комментарием.
- `apps/backend/src/database/seed.ts` — 4 демо-логина заменяются на
  email-подобные строки.
- `apps/backend/src/corrections/corrections.controller.ts` — три новых
  GET-хендлера (`filialStats`, `cfoStats`, `dtoeStats`), каждый
  `@Roles(Role.<X>)` + вызов `this.service.getStats(user)`.
- Новых guard'ов, decorator'ов и модулей не создаётся — используются
  существующие `@Roles`, `RolesGuard`, `JwtAuthGuard`.

**Readiness Decision**: `blocked` до завершения задачи 1.1 (API-контракт) —
Backend-задачи по `email`-полю и новым `stats/*`-эндпоинтам зависят от
зафиксированной версии `api/src/openapi.yaml`.

## Frontend

**Файлы / Owners**:
- `apps/frontend/app/(public)/components/login-form.tsx` — поле `username` →
  `email` (label «Email», `type="email"`, `autoComplete="email"`), редирект в
  `onSuccess` меняется с `router.replace("/dashboard")` на выбор пути по
  `data.role` (`FILIAL` → `/filial`, `CFO` → `/cfo`, `DTOE` → `/dtoe`; `ADMIN` —
  временно `/dashboard`, см. proposal.md Impact).
- `apps/frontend/packages/api/base/codegen/**` — перегенерируется Kubb из
  обновлённого контракта (`zod/loginRequestSchema.ts`, `types/LoginRequest.ts`,
  новые клиенты `clients/correctionsController/getCorrectionStatsFilial.ts` и
  т.п.); вручную не редактируется.
- Новые страницы-заглушки: `apps/frontend/app/(private)/filial/page.tsx`,
  `apps/frontend/app/(private)/cfo/page.tsx`,
  `apps/frontend/app/(private)/dtoe/page.tsx` — по аналогии с существующим
  `(private)/dashboard/page.tsx`.
- Новые серверные layout'ы: `apps/frontend/app/(private)/filial/layout.tsx`,
  `.../cfo/layout.tsx`, `.../dtoe/layout.tsx` — вызывают соответствующий
  Kubb-хук, при `403` рендерят `AccessDeniedScreen`.
- Новый компонент `apps/frontend/app/(private)/components/access-denied-
  screen.tsx` — экран «Доступ запрещён», переиспользуется всеми тремя layout'ами.

**Readiness Decision**: `blocked` до завершения задачи 1.1; после фиксации
контракта — `ready`.

## Тестовая стратегия

Риск: **P1** (изменение поведения аутентификации и защиты приватных разделов —
не платёжный/статусный флоу корректировок, но напрямую влияет на доступ к
системе для всех ролей).

TDD-порядок по ключевым сценариям — сначала failing test, затем минимальная
реализация:

- **Backend unit/feature** (`apps/backend`, Jest):
  - `auth.service.spec.ts` / `auth.controller.e2e-spec.ts` (или существующий
    аналог) — расширяется: логин с валидным/невалидным форматом email,
    `400` на невалидный формат в обход фронта, единый `401` на неверные
    email/пароль/заблокированную запись.
  - `corrections.controller.e2e-spec.ts` (или новый) — по одному кейсу на
    каждый `GET /corrections/stats/<role>`: своя роль → `200`, чужая роль →
    `403`.
- **Frontend component** (Vitest Browser Mode + Playwright,
  `*.component.test.tsx`):
  - `login-form.component.test.tsx` (уже существует, расширяется): ошибка
    формата email под полем без сети, состояние загрузки кнопки блокирует
    повторную отправку, единое сообщение об ошибке на `401`.
  - Новый `access-denied-screen.component.test.tsx` — рендер сообщения.
- **Frontend E2E** (Playwright, `*.e2e.spec.ts`) — по одному тесту на
  ключевой journey:
  - Успешный вход `FILIAL` → редирект на `/filial`.
  - Успешный вход `CFO` → редирект на `/cfo` (достаточно одного
    дополнительного E2E на happy path каждой роли для P1; DTOE можно покрыть
    component/unit-уровнем редирект-функции, если она вынесена отдельно).
  - `CFO` открывает `/dtoe` напрямую по URL → видит экран «Доступ запрещён».
- Моки: typed fixtures на основе Kubb `mocks/createAuthUser.ts`,
  `mocks/createLoginRequest.ts` (перегенерируются с полем `email`); свободных
  JSON-моков не вводится.
- Роли для тестовых данных: `FILIAL`, `CFO`, `DTOE` — по одному
  фикстур-пользователю на роль, переиспользуются между backend e2e и frontend
  E2E тестовыми данными/seed.
- Verification gates: API `npm run lint` (и `npm run bundle` при необходимости)
  из `api/`; Backend `npm run test`, `npm run test:e2e`, `npm run lint` из
  `apps/backend`; Frontend `bun run typecheck`, `bun run lint`, `bun run test`,
  `bun run build` из `apps/frontend`; `openspec validate align-login-role-
  redirect --strict --no-interactive`.
