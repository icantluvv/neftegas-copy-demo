## 1. API

- [x] 1.1 [api] Подтвердить отсутствие изменений API-контракта: фича использует уже существующий `POST /auth/logout` из `api/src/openapi.yaml`, новых эндпоинтов не требуется. Выполнить `npm run lint` из `api/` для контроля, что контракт не сломан.

## 2. Backend

_(нет задач)_

## 3. Frontend

- [x] 3.1 [frontend] Написать падающий component-тест `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx`: рендер `SidebarNav` показывает пункт навигации «Дашборд» (ссылка на `/dashboard`) и кнопку «Выйти».
- [x] 3.2 [frontend] Реализовать `apps/frontend/app/(private)/components/sidebar-nav.tsx` — клиентский компонент со статическим списком пунктов меню, `usePathname()` для активного пункта, версткой `bg-sidebar text-sidebar-foreground`; довести тест 3.1 до green.
- [x] 3.3 [frontend] Обновить `apps/frontend/app/globals.css`: значения `--sidebar` (тёмно-синий) и `--sidebar-foreground` (белый) в `:root` и `.dark`, чтобы сайдбар не зависел от системной темы.
- [x] 3.4 [frontend] Подключить `SidebarNav` в `apps/frontend/app/(private)/layout.tsx`: обернуть `children` в flex-раскладку `w-1/5` (сайдбар) / `w-4/5` (контент), сохранив существующую server-side проверку сессии через `getMe()`.
- [x] 3.5 [frontend] Написать падающий component-тест на сценарий «Успешный выход»: клик по кнопке «Выйти» вызывает мутацию `useLogout`, после успеха — `router.replace("/login")` (мокать `next/navigation` и мутацию `useLogout` по паттерну существующих тестов `login-form`).
- [x] 3.6 [frontend] Реализовать обработчик успешного выхода в `SidebarNav`; довести тест 3.5 до green.
- [x] 3.7 [frontend] Написать падающий component-тест на сценарий «Ошибка при выходе»: мутация `useLogout` завершается ошибкой → вызывается `toast.error`, редиректа не происходит, пользователь остаётся на странице.
- [x] 3.8 [frontend] Реализовать обработчик ошибки выхода в `SidebarNav`; довести тест 3.7 до green.
- [x] 3.9 [frontend] Написать падающие component-тесты на мобильное поведение (viewport < `md`): сайдбар скрыт и видна кнопка-бургер по умолчанию; клик по бургеру открывает сайдбар на всю ширину экрана; повторный клик закрывает сайдбар.
- [x] 3.10 [frontend] Реализовать адаптивную раскладку в `SidebarNav`/`layout.tsx`: `hidden md:flex` для десктопной колонки `w-1/5`, кнопка-бургер `md:hidden` в левом верхнем углу, `useState`-переключатель и мобильный оверлей `fixed inset-0 z-50 w-full` при открытии; довести тесты 3.9 до green.
- [x] 3.11 [frontend] Написать падающий component-тест: на мобильном viewport при открытом сайдбаре клик по пункту навигации закрывает сайдбар.
- [x] 3.12 [frontend] Добавить `onClick`-обработчик на пунктах меню, закрывающий сайдбар (`setIsOpen(false)`) при выборе пункта на мобильном; довести тест 3.11 до green.
- [x] 3.13 [frontend] Обновить `test-plan.md`: отметить статус покрытия для каждого сценария по мере прохождения тестов 3.1, 3.5, 3.7, 3.9, 3.11.
- [x] 3.14 [frontend] Verification: `bun run typecheck` (`tsc --noEmit`), `bun run lint`, `bun run test` (unit + component), `bun run build` — все зелёные для кода этого change. Примечание: `src/test/setup-browser.component.test.ts` падает независимо от этого change (несвязанный WIP-тест на формат `--foreground`, не относящийся к `private-navigation`) — см. итоговое сообщение.

## 4. OpenSpec

- [x] 4.1 [openspec] `openspec validate add-private-sidebar-nav --strict --no-interactive` — без ошибок.
