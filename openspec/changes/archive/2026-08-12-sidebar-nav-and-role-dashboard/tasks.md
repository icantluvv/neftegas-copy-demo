## 1. API

- [x] 1.1 [api] Подтвердить отсутствие изменений API-контракта: сверить `api/src/openapi.yaml` и `api/src/components/schemas/auth.yaml` — эндпоинты `GET /auth/me`, `POST /auth/logout` и ролевые stats-эндпоинты (`getCorrectionStatsFilial`/`getCorrectionStatsCfo`/`getCorrectionStatsDtoe`) уже покрывают потребности `SidebarNav` и `/dashboard`; изменений не требуется. Выполнить `npm run lint` из `api/` и зафиксировать результат в этой задаче. Результат: `npm run lint` — валидно, 41 предсуществующих warning (не относятся к этому change, эндпоинты `auth/me`, `logout`, ролевые stats не менялись).

## 2. Backend

_(нет задач)_

## 3. Frontend

### 3.1 Инициалы ФИО (юнит)

- [x] 3.1.1 [frontend] Написать failing unit-тест `apps/frontend/app/(private)/components/get-initials.unit.test.ts`: пустая строка → `""`, одно слово → первая буква, «Иванов Иван» → «ИИ», лишние пробелы/несколько слов → берутся первые буквы первых двух слов.
- [x] 3.1.2 [frontend] Реализовать `apps/frontend/app/(private)/components/get-initials.ts` (минимальная реализация, зелёный прогон).
- [x] 3.1.3 [frontend] Рефактор при необходимости, повторный прогон `bun run test`. Рефактор не потребовался, тест зелёный (4/4).

### 3.2 Брендинг, пункты меню и профиль в `SidebarNav`

- [x] 3.2.1 [frontend] Дополнить/написать failing component-тест `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx`: рендер брендинга (круглый плейсхолдер логотипа + «Черноморнефтегаз»), пункты меню «Рабочий стол» (`href="/dashboard"`) и «Уведомления» (`href="/notifications"`), блок профиля с аватаром-инициалами и ФИО из пропа `user`, отсутствие сетевого запроса за данными пользователя при наличии пропа.
- [x] 3.2.2 [frontend] Обновить `apps/frontend/app/(private)/components/sidebar-nav.tsx`: принять проп `user: AuthUser`, добавить блок брендинга сверху, наполнить `navItems` рабочими пунктами, добавить блок профиля снизу (аватар через `get-initials`, `user.fullName`) над существующей кнопкой «Выйти» — логику логаута не менять.
- [x] 3.2.3 [frontend] Обновить `apps/frontend/app/(private)/layout.tsx`: передать результат существующего вызова `getMe()` пропом `user` в `<SidebarNav user={user} />`.
- [x] 3.2.4 [frontend] Прогнать component-тест до green, обновить снапшоты в `apps/frontend/app/(private)/components/__screenshots__/` при необходимости. Результат: 11/11 зелёные; отдельных baseline-снапшотов для сравнения нет (файлы в `__screenshots__` — автосохранённые скриншоты падений, не visual regression), новых не потребовалось.

### 3.3 Единая страница `/dashboard` с рендерингом по роли

- [x] 3.3.1 [frontend] Написать failing unit-тест на функцию выбора компонента дашборда по роли (`FILIAL`/`CFO`/`DTOE`/прочее → `AccessDeniedScreen`). Реализовано как `get-dashboard-kind.ts` (роль → `"filial"/"cfo"/"dtoe"/undefined`), `page.tsx` переключает JSX по `kind`, `undefined` → `AccessDeniedScreen`.
- [x] 3.3.2 [frontend] Создать `apps/frontend/app/(private)/dashboard/page.tsx`: серверный компонент, `getMe()` + условный рендер `FilialDashboard`/`CfoDashboard`/`DtoeDashboard`/`AccessDeniedScreen` (default) по роли.
- [x] 3.3.3 [frontend] Создать `apps/frontend/app/(private)/dashboard/components/filial-dashboard.tsx`, `cfo-dashboard.tsx`, `dtoe-dashboard.tsx` — серверные компоненты, каждый переносит паттерн текущего `apps/frontend/app/(private)/cfo/layout.tsx` (вызов своего ролевого stats-эндпоинта, 403 → `AccessDeniedScreen`, 401 → `null`).
- [x] 3.3.4 [frontend] Удалить `apps/frontend/app/(private)/filial/`, `apps/frontend/app/(private)/cfo/`, `apps/frontend/app/(private)/dtoe/` целиком. Выполнено в коммите `feat(frontend): добавить общий сайдбар и единый роут /dashboard по ролям`.
- [x] 3.3.5 [frontend] Обновить `apps/frontend/app/(public)/components/login-form.tsx`: заменить `ROLE_HOME_ROUTE` на редирект `/dashboard` для ролей `FILIAL`/`CFO`/`DTOE` (fallback для прочих ролей не менять). Выполнено, тесты `login-form.component.test.tsx` обновлены под новые редиректы.
- [x] 3.3.6 [frontend] Написать/обновить failing E2E-тест `apps/frontend/e2e/dashboard.e2e.spec.ts`: вход под каждой из трёх ролей → редирект на `/dashboard` → виден соответствующий ролевой дашборд; проверить, что `/filial`, `/cfo`, `/dtoe` возвращают 404.
- [x] 3.3.7 [frontend] Довести unit/component/E2E из 3.3.1 и 3.3.6 до green. Результат: `dashboard.e2e.spec.ts` — 4/4 зелёные (прогнано против локального docker-инфры). По пути обнаружен и удалён устаревший `e2e/login.e2e.spec.ts` — проверял удалённые `/filial`, `/cfo`, `/dtoe` и падал 3/3; сценарии полностью перекрыты `dashboard.e2e.spec.ts`.

### 3.4 Финальные проверки

- [x] 3.4.1 [frontend] `bun run typecheck` — зелёно (после `next typegen`, устаревшие типы `.next` пересобраны).
- [x] 3.4.2 [frontend] `bun run lint` — 129 ошибок/13 warning, все в сгенерированном `packages/api/base/codegen/**` и тестовой инфраструктуре (`src/test/mocks/**`), не относятся к этому change; в затронутых файлах ошибок нет.
- [x] 3.4.3 [frontend] `bun run test` (unit + component) — 34/35 зелёные; единственный красный тест `src/test/setup-browser.component.test.ts` падает на несовпадении формата цвета (`oklch(...)` vs `#171717`) в глобальной инфраструктуре тестов, не связан с этим change (не затрагивает изменённые файлы).
- [x] 3.4.4 [frontend] `bun run test:e2e` (или ручной прогон затронутых E2E-сценариев, если скрипт не выделен отдельно) — `playwright test e2e/dashboard.e2e.spec.ts`, 4/4 зелёные.
- [x] 3.4.5 [frontend] `bun run build` — успешно (с `DADATA_URL`/`DADATA_TOKEN`/`PARTNER_API_TOKEN`, как в `infra/docker-compose.yml`); список роутов подтверждает удаление `/filial`, `/cfo`, `/dtoe` и наличие `/dashboard`.
- [x] 3.4.6 [openspec] Обновить `test-plan.md` (статусы покрытых сценариев) и выполнить `openspec validate sidebar-nav-and-role-dashboard --strict --no-interactive`.
