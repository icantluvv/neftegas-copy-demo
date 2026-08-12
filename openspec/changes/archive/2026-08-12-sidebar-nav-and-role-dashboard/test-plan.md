# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Брендинг в верхней части сайдбара | Брендинг виден на приватной странице | P2 | Component | `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx` | Done |
| Пункты меню навигации в сайдбаре | Переход по пункту «Рабочий стол» | P1 | Component | `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx` | Done |
| Пункты меню навигации в сайдбаре | Переход по пункту «Уведомления» | P2 | Component | `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx` | Done |
| Блок профиля пользователя в нижней части сайдбара | Блок профиля отображает данные текущего пользователя | P1 | Unit + Component | `apps/frontend/src/utils/get-initials.unit.test.ts`, `sidebar-nav.component.test.tsx` | Done |
| Блок профиля пользователя в нижней части сайдбара | Блок профиля не выполняет отдельный запрос данных пользователя | P2 | Component | `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx` | Done |
| Единая страница рабочего стола с рендерингом по роли | Пользователь с ролью «Филиал» открывает рабочий стол | P0 | E2E | `apps/frontend/e2e/dashboard.e2e.spec.ts` | Done |
| Единая страница рабочего стола с рендерингом по роли | Пользователь с ролью «ЦФО» открывает рабочий стол | P0 | E2E | `apps/frontend/e2e/dashboard.e2e.spec.ts` | Done |
| Единая страница рабочего стола с рендерингом по роли | Пользователь с ролью «ДТОиР» открывает рабочий стол | P0 | E2E | `apps/frontend/e2e/dashboard.e2e.spec.ts` | Done |
| Единая страница рабочего стола с рендерингом по роли | Неавторизованный пользователь пытается открыть рабочий стол | P1 | Manual | Waiver: покрыто существующей логикой `PrivateLayout` (редирект на `/` при 401), которая не менялась в этом change; отдельный E2E-сценарий не добавлен — низкий риск регресса | Waived |
| Единая страница рабочего стола с рендерингом по роли | Роль без назначенного дашборда открывает рабочий стол | P2 | Unit | `apps/frontend/src/utils/get-dashboard-kind.unit.test.ts` | Done |
| Ролевой дашборд получает данные только по своей роли | Сервер отклоняет запрос данных дашборда как не соответствующий роли | P1 | Manual | ручная проверка (переиспользует существующий паттерн 403 из `cfo/layout.tsx`, бэкенд не меняется — регресс не ожидается) | Waived |

## Required automated tests

### Unit
- [x] `get-initials.unit.test.ts` — вычисление инициалов из ФИО (пустая строка, одно слово, несколько слов, лишние пробелы)
- [x] `get-dashboard-kind.unit.test.ts` — тест функции выбора ролевого компонента дашборда (`FILIAL`/`CFO`/`DTOE`/прочее → `AccessDeniedScreen`)

### Component
- [x] `sidebar-nav.component.test.tsx` — брендинг, пункты меню, блок профиля (аватар-инициалы + ФИО), отсутствие клиентского запроса за данными пользователя

### Integration
_(не вводится — не соответствует принятому в проекте разделению уровней тестирования)_

### E2E
- [x] `dashboard.e2e.spec.ts` — вход под каждой ролью → редирект на `/dashboard` → корректный ролевой дашборд; `/filial`, `/cfo`, `/dtoe` возвращают 404 (4/4 зелёные). Устаревший `login.e2e.spec.ts` (проверял удалённые `/filial`, `/cfo`, `/dtoe`) удалён как дублирующий и сломанный.

## Manual checks
- [x] Ручная проверка сценария 403 от ролевого stats-эндпоинта внутри `/dashboard` → экран «Доступ запрещён» (backend-логика не меняется, риск регресса низкий, отдельный автотест избыточен) — паттерн перенесён без изменений из `cfo/layout.tsx`, код-ревью подтверждает идентичную обработку 403/401 во всех трёх `*-dashboard.tsx`
- [x] Ручная проверка адаптивной раскладки сайдбара (мобильный бургер-меню) с новым содержимым — сам механизм бургер-меню уже покрыт `add-private-sidebar-nav`, проверяется только совместимость с новым контентом

## Test data
- Fixtures: typed-фабрика `AuthUser` (роль, `fullName`) на основе Kubb-типов и мок-хелперов кодогена (`createRole2` и аналогичные)
- API mocks: для component-тестов — мок пропа `user`, без сетевого мока; для E2E — реальный тестовый backend/seed (как в существующих `e2e/login.e2e.spec.ts`)
- User roles: `FILIAL`, `CFO`, `DTOE` (обязательны для покрытия), `ADMIN`/произвольная роль — для сценария «роль без дашборда»
- Seed data: переиспользуются существующие тестовые пользователи трёх ролей из текущей E2E-инфраструктуры

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices

## Verification commands
- [x] openspec validate sidebar-nav-and-role-dashboard --strict --no-interactive
- [x] frontend: `bun run lint` / `bunx tsc --noEmit` / `bun run test` / `bunx playwright test e2e/dashboard.e2e.spec.ts` / `bun run build` — все зелёные; единственное несвязанное падение (`src/test/setup-browser.component.test.ts`, формат цвета в глобальной тестовой инфраструктуре) задокументировано в `tasks.md` 3.4.3
- [x] backend: не затрагивается — команды не требуются
- [x] api: `npm run lint` (контракт не меняется, `npm run bundle` не требуется) — см. `tasks.md` 1.1
