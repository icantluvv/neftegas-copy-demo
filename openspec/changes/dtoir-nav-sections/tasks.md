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
      остаётся активной на `/corrections/*` и `/notifications`
- [x] 1.8 [frontend] «Рабочий стол» в `getSidebarItems` ведёт на домашнюю
      страницу активного модуля (`activeModule.href`), а не всегда на
      `/dashboard` — переход из другого модуля больше не переключает модуль
- [x] 1.9 [frontend] Перенести «Уведомления» из общих пунктов в
      `sidebarItems` модуля «Корректировка» (единственный модуль с реальными
      уведомлениями сегодня); тест на отсутствие пункта в других модулях
- [x] 1.10 [frontend] Добавить компонент `CreateCorrectionStub`
      (`apps/frontend/src/components/create-correction-stub`) — визуальная
      копия `CreateCorrectionForm` без вызовов API, с задизейбленной кнопкой
      «Создать» и статическим списком элементов пакета документов
- [x] 1.11 [frontend] Добавить страницу `/planning/create` (роль FILIAL) на
      основе `CreateCorrectionStub` с элементами «Excel корректировка»,
      «Пакет документов», «Счета на оплату»; добавить пункт «Создать
      корректировку» в `sidebarItems` модуля «План на 2027» и
      `matchPrefixes: ["/planning"]`, чтобы вкладка не гасла на `/planning/create`
- [x] 1.12 [frontend] Тесты: `create-correction-stub.component.test.tsx`
      (заголовок, список документов, задизейбленная кнопка «Создать»,
      «Отмена» → `cancelHref`); дополнены `sidebar-nav.component.test.tsx` и
      `top-tabs.component.test.tsx` под новый пункт модуля «План на 2027»

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
