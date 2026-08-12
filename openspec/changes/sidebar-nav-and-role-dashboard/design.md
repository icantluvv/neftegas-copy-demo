## Context

Текущая реализация (см. `apps/frontend/app/(private)/layout.tsx`) уже вызывает `getMe()` на сервере при каждом заходе в приватный контур и редиректит на `/` при 401/403/413 — SSR-доступ к данным сессии (`AuthUser`: `fullName`, `role`, ...) уже есть, отдельного клиентского запроса добавлять не нужно.

`SidebarNav` (`apps/frontend/app/(private)/components/sidebar-nav.tsx`) — клиентский компонент (`"use client"`), рендерится в `PrivateLayout` без пропсов. `navItems` — пустой локальный массив. Кнопка «Выйти» уже подключена к `useLogout` (Kubb-хук).

Ролевые разделы (`apps/frontend/app/(private)/{filial,cfo,dtoe}/{page,layout}.tsx`) — заглушки. У `cfo/layout.tsx` есть паттерн, который заново используется: серверный layout дёргает ролевой stats-эндпоинт, при 403 рендерит `AccessDeniedScreen` (`apps/frontend/app/(private)/components/access-denied-screen.tsx`), при 401 рендерит `null` (чтобы не задублировать редирект родителя — см. комментарий в файле). Ролевые stats-эндпоинты уже существуют в кодогене: `getCorrectionStatsFilial`, `getCorrectionStatsCfo`, `getCorrectionStatsDtoe` (`apps/frontend/packages/api/base/codegen/clients/correctionsController/`).

`login-form.tsx` сейчас редиректит по карте `ROLE_HOME_ROUTE` (`FILIAL → /filial`, `CFO → /cfo`, `DTOE → /dtoe`, fallback `/`).

Backend не меняется: ролевые эндпоинты статистики уже проверяют роль на сервере (см. `apps/backend/AGENTS.md` — фронт никогда не единственная защита).

## Goals / Non-Goals

**Goals:**
- Единая серверная страница `/dashboard`, которая по роли из SSR-сессии рендерит один из клиентских компонентов дашборда.
- Наполненный `SidebarNav`: брендинг, рабочие пункты меню, блок профиля из пропа, без собственных запросов сессии.
- Проброс `AuthUser` из `PrivateLayout` в `SidebarNav` одним рендером `getMe()` (не дублировать запрос).

**Non-Goals:**
- Контент самих ролевых дашбордов (реальные виджеты/таблицы корректировок) — вне области; создаются только структурные компоненты-заглушки с уже существующим stats-запросом, аналогично текущим `cfo/page.tsx`.
- Страница `/notifications` — только ссылка в меню, маршрут не создаётся.
- Поведение роли `ADMIN` — не входит в объём (как и в `align-login-role-redirect`).
- Загрузка/выбор картинки логотипа — только форма-плейсхолдер (круг без изображения).

## Decisions

### 1. `/dashboard` — серверный компонент с условным рендерингом по роли, а не три параллельных route-группы

Роль уже известна на сервере из `getMe()` (тот же вызов, что и в `PrivateLayout`). Вариант с `role-based route groups` (например, parallel routes или redirect на скрытые `/dashboard/(filial)` и т.п.) добавляет сложность без выгоды, так как роль не меняется в рамках сессии и нет необходимости в отдельных URL для каждой роли — предыдущий подход (`/filial`, `/cfo`, `/dtoe`) существовал только из-за старой ролевой route-guard модели (`align-login-role-redirect`), которая явно заменяется.

`apps/frontend/app/(private)/dashboard/page.tsx` — серверный компонент:
```
const user = await getMe();
switch (user.role) {
  case "FILIAL": return <FilialDashboard />;
  case "CFO": return <CfoDashboard />;
  case "DTOE": return <DtoeDashboard />;
  default: return <AccessDeniedScreen />; // ADMIN и любые будущие роли — вне объёма
}
```
`getMe()` уже вызывается родительским `PrivateLayout` для редиректа на 401 — второй вызов на странице `/dashboard` не является дублирующим сетевым паттерном для этого проекта: аналогичный паттерн уже применяется в `cfo/layout.tsx`, который тоже независимо дёргает свой запрос поверх родительского `getMe()`. Next.js App Router кеширует fetch на уровне запроса (`force-dynamic` уже стоит у `PrivateLayout`), поэтому дублирования по сети не будет благодаря дедупликации fetch внутри одного рендера.

Каждый `*Dashboard` компонент (`FilialDashboard`, `CfoDashboard`, `DtoeDashboard`) — серверный компонент, переносящий текущий паттерн `cfo/layout.tsx` (вызов своего stats-эндпоинта, 403 → `AccessDeniedScreen`, 401 → `null`) внутрь себя, без отдельного `layout.tsx`.

**Альтернатива (отклонена)**: оставить три маршрута и просто улучшить каждый по отдельности. Отклонено, так как явно противоречит требованию проблемы — единая точка входа «Рабочий стол» и единый компонент, переключающий вид по роли.

### 2. Данные пользователя для `SidebarNav` — проп из `PrivateLayout`, а не отдельный клиентский запрос/контекст

`PrivateLayout` уже владеет результатом `getMe()`. Проброс пропом (`<SidebarNav user={user} />`) не требует нового React Context или клиентского запроса и хранит единственный источник истины на SSR. Инициалы ФИО для аватара вычисляются чистой функцией на основе `user.fullName` (без сетевого запроса).

**Альтернатива (отклонена)**: клиентский запрос `useMe()`-хука внутри `SidebarNav`. Отклонена — дублирует уже выполненный на сервере запрос и создаёт лишний late-loading стейт для статичных данных сессии.

### 3. `SidebarNav` остаётся клиентским компонентом

Компонент уже клиентский из-за интерактивности (мобильное меню, `usePathname`, кнопка «Выйти» с мутацией). Проп `user: AuthUser` передаётся из серверного родителя — стандартный паттерн server → client boundary, доп. библиотек не требует.

### 4. Логотип и инициалы — общий визуальный паттерн «круглый плейсхолдер»

Оба элемента (логотип сверху, аватар профиля снизу) — `div` с `rounded-full`, фон акцентного цвета темы сайдбара, без `<img>`. Для логотипа — пустой круг (или буква «Ч» как заглушка, финальное решение — на этапе вёрстки, не влияет на спеки). Для аватара — инициалы, вычисленные из `fullName` (первые буквы первого и второго слова).

## Risks / Trade-offs

- [Удаление `/filial`, `/cfo`, `/dtoe` — прямые ссылки/закладки пользователей на старые URL перестанут работать] → Next.js по умолчанию отдаст 404 на удалённый route; т.к. единственная точка входа в эти разделы — редирект после логина и пункт меню сайдбара (оба меняются в этом же change), внешних ссылок на старые пути не предполагается.
- [Двойной вызов `getMe()` на SSR (в `PrivateLayout` и в `/dashboard/page.tsx`) может выглядеть как лишний запрос] → Мигрирует существующий в проекте паттерн (`cfo/layout.tsx` уже так делает поверх родителя); в рамках одного рендера Next.js дедуплицирует одинаковые `fetch`-запросы.
- [Роль `ADMIN` не имеет своего дашборда] → Явно вне объёма (см. Non-Goals), `default`-ветка показывает `AccessDeniedScreen`, а не падает с ошибкой рендера.

## Тестовая стратегия

- **Риск**: P1 (см. proposal.md — Влияние на качество).
- **TDD-порядок**: для каждого ключевого сценария (см. specs) — сначала failing component/unit/E2E-тест, затем минимальная реализация, зелёный прогон, рефактор.
- **Frontend Unit** (`*.unit.test.ts`, Vitest node): чистая функция вычисления инициалов из `fullName` (пустая строка, одно слово, несколько слов, лишние пробелы); функция/switch выбора компонента дашборда по роли (все роли + неизвестная/`ADMIN` роль → `AccessDeniedScreen`).
- **Frontend Component** (`*.component.test.tsx`, Vitest Browser Mode + Playwright): `SidebarNav` с пропом `user` — рендер брендинга, пунктов меню со ссылками, блока профиля (аватар с инициалами, ФИО), клик «Выйти» (переиспользует существующий тест-паттерн `sidebar-nav.component.test.tsx`, дополняется новыми ассершенами вместо переписывания с нуля).
- **Frontend E2E** (`*.e2e.spec.ts`, Playwright): вход под каждой из трёх ролей → редирект на `/dashboard` → виден соответствующий ролевой дашборд; попытка получить чужие ролевые данные — не применимо на уровне URL (единый маршрут), проверяется на уровне backend-контракта (не меняется, регресс не ожидается, отдельный e2e не добавляется).
- **Моки/фикстуры**: typed-фабрика `AuthUser` (роль, fullName) для юнит/компонент-тестов на основе уже сгенерированных Kubb-типов и `createRole2`/мок-хелперов кодогена; реальные ролевые stats-эндпоинты в E2E не мокаются (используется существующий тестовый backend/seed, как в текущих e2e).
- **Verification gates**: `apps/frontend` — `bun run lint`, `bun run test` (unit+component), `bun run build`; целевой E2E-сценарий входа по ролям — `bun run test:e2e` (если такой скрипт есть в проекте) или ручной прогон Playwright для затронутого маршрута.

## Backend

Не затрагивается. Используются существующие ролевые эндпоинты статистики (`GET` через `getCorrectionStatsFilial`/`getCorrectionStatsCfo`/`getCorrectionStatsDtoe`) и `GET /auth/me` — оба уже реализованы и проверяют роль/сессию на сервере. Новых модулей, DTO или guard'ов не создаётся.

## Frontend

- `apps/frontend/app/(private)/layout.tsx` — сохранить существующий вызов `getMe()`, передать результат пропом `user` в `<SidebarNav user={user} />`.
- `apps/frontend/app/(private)/components/sidebar-nav.tsx` — принять проп `user: AuthUser`; добавить верхний блок брендинга (круглый плейсхолдер + «Черноморнефтегаз»); наполнить `navItems` рабочими пунктами (`/dashboard`, `/notifications`); добавить нижний блок профиля (аватар-инициалы, `user.fullName`) над существующей кнопкой «Выйти» (логика кнопки не меняется).
- Новый `apps/frontend/app/(private)/dashboard/page.tsx` — серверный компонент, `getMe()` + `switch` по `user.role` → `FilialDashboard` / `CfoDashboard` / `DtoeDashboard` / `AccessDeniedScreen` (default).
- Новые `apps/frontend/app/(private)/dashboard/components/{filial,cfo,dtoe}-dashboard.tsx` — серверные компоненты, каждый переносит паттерн текущего `apps/frontend/app/(private)/cfo/layout.tsx` (вызов своего stats-эндпоинта, 403 → `AccessDeniedScreen`, 401 → `null`).
- Удаляются: `apps/frontend/app/(private)/filial/`, `apps/frontend/app/(private)/cfo/`, `apps/frontend/app/(private)/dtoe/` целиком (page + layout).
- `apps/frontend/app/(public)/components/login-form.tsx` — `ROLE_HOME_ROUTE` заменяется на единый редирект `/dashboard` для ролей `FILIAL`/`CFO`/`DTOE` (fallback для прочих ролей, включая `ADMIN`, не меняется — остаётся `/`, как и раньше).
- Новая чистая функция вычисления инициалов ФИО — расположить рядом с `sidebar-nav.tsx` (например, `apps/frontend/app/(private)/components/get-initials.ts`), чтобы отдельно юнит-тестировать без рендера компонента.

## Readiness Decision

`ready` — API-контракт не меняется, все нужные бэкенд-эндпоинты (`getMe`, ролевые stats, `logout`) уже существуют и покрыты кодогеном; блокеров для параллельной FE-реализации нет.
