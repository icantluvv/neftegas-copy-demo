## API

_(нет задач)_

## Backend

_(нет задач)_

## Frontend

- [x] 1.1 [frontend] Добавить компонент `SectionPlaceholder`
      (`apps/frontend/src/components/section-placeholder`)
- [x] 1.2 [frontend] Добавить страницы `/planning`, `/execution`, `/fact`
      с использованием `SectionPlaceholder` и перечнем форм Регламента
- [x] 1.3 [frontend] Добавить пункты меню «План на 2027», «Выполнение»,
      «Факт» в `navItems`; переименовать «Рабочий стол» → «Корректировка»
      (`apps/frontend/app/(private)/constants.ts`)
- [x] 1.4 [frontend] Обновить тест `sidebar-nav.component.test.tsx` под
      новый лейбл пункта `/dashboard`

## Проверка

- [x] `bun run typecheck` (apps/frontend)
- [x] `bun run lint` по изменённым файлам (apps/frontend)
- [x] `bun run test` (apps/frontend) — component-тесты не выполнились из-за
      отсутствия системных библиотек Chromium в dev-контейнере
      (окружение, не связано с изменением); unit-тесты (53) прошли
- [x] Ручная проверка: все 4 пункта меню отдают 200 и корректный HTML под
      демо-пользователем роли FILIAL
