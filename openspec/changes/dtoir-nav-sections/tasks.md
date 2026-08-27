## API

_(нет задач)_

## Backend

_(нет задач)_

## Frontend

- [x] 1.1 [frontend] Добавить компонент `SectionPlaceholder`
      (`apps/frontend/src/components/section-placeholder`)
- [x] 1.2 [frontend] Добавить страницы `/planning`, `/execution`, `/fact`
      с использованием `SectionPlaceholder` и перечнем форм Регламента
- [x] 1.3 [frontend] Разделить `navItems` на `sidebarNavItems` и `topTabs`
      (`apps/frontend/app/(private)/constants.ts`)
- [x] 1.4 [frontend] Добавить компонент `TopTabs`
      (`apps/frontend/src/components/top-tabs`) и подключить его в шапку
      `app/(private)/layout.tsx`
- [x] 1.5 [frontend] Обновить `SidebarNav` — рендерить только
      `sidebarNavItems` (боковое меню без переключателей разделов)
- [x] 1.6 [frontend] Обновить тест `sidebar-nav.component.test.tsx` под
      сокращённый список пунктов бокового меню
- [x] 1.7 [frontend] Добавить тест `top-tabs.component.test.tsx` —
      4 вкладки, подсветка активной по маршруту

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
