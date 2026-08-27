## API

_(нет задач)_

## Backend

_(нет задач)_

## Frontend

- [x] 1.1 [frontend] Добавить компонент `SectionPlaceholder`
      (`apps/frontend/src/components/section-placeholder`)
- [x] 1.2 [frontend] Добавить страницы `/planning`, `/execution`, `/fact`
      с использованием `SectionPlaceholder` и перечнем форм Регламента
- [x] 1.3 [frontend] Ввести модель `ModuleTab` (`topTabs` с `sidebarItems` и
      `matchPrefixes` на модуль), `findActiveModule`, `getSidebarItems`
      (`apps/frontend/app/(private)/constants.ts`)
- [x] 1.4 [frontend] Добавить компонент `TopTabs`
      (`apps/frontend/src/components/top-tabs`) и подключить его в шапку
      `app/(private)/layout.tsx`; активная вкладка — через `findActiveModule`
- [x] 1.5 [frontend] Обновить `SidebarNav` — состав меню зависит от активного
      модуля через `getSidebarItems(pathname)`, а не статический список
- [x] 1.6 [frontend] Обновить тест `sidebar-nav.component.test.tsx`: пункт
      «Создать корректировку» виден только внутри модуля «Корректировка»
      (`/dashboard`, `/corrections/*`), не виден в других модулях
- [x] 1.7 [frontend] Добавить тест `top-tabs.component.test.tsx` —
      4 вкладки, подсветка активной по маршруту, вкладка «Корректировка»
      остаётся активной на `/corrections/*`

## Проверка

- [x] `bunx tsc --noEmit` (apps/frontend)
- [x] `bun run lint` по изменённым файлам (apps/frontend)
- [ ] `bun run test` (apps/frontend) — component-тесты не выполняются из-за
      отсутствия системных библиотек Chromium в dev-контейнере (окружение, не
      связано с изменением); требует подтверждения после решения этого
      ограничения окружения
- [x] Ручная проверка: все 4 верхние вкладки отдают 200 и корректный HTML под
      демо-пользователем роли FILIAL; после перезапуска dev-контейнера
      предупреждение о дублирующемся `key` в консоли не воспроизводится
