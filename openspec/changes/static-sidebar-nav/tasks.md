## 1. Конфигурация навигации

- [x] 1.1 В `app/(private)/constants.ts` заменить `ModuleTab` на `NavSection` (`href`, `label`, `icon`, `roles?`, `matchPrefixes?`)
- [x] 1.2 Ввести статический `sidebarItems: NavSection[]` (Рабочий стол, План на 2027, Выполнение, Факт, Создать корректировку [FILIAL], Уведомления); «Рабочий стол» — `matchPrefixes: ["/corrections"]`
- [x] 1.3 Добавить чистую функцию `isNavItemActive(item, pathname)` (точное совпадение или префикс)
- [x] 1.4 Удалить `topTabs` и `FALLBACK_HOME_HREF`

## 2. Компоненты

- [x] 2.1 `SidebarNav` рендерит из `sidebarItems` с фильтром по роли и подсветкой через `isNavItemActive`
- [x] 2.2 Удалить `src/utils/get-sidebar-items.ts` и `src/utils/find-active-module.ts`
- [x] 2.3 Удалить `src/components/top-tabs/*` и убрать `TopTabs` из `app/(private)/layout.tsx` (шапка — только `NotificationBell`, `justify-end`)

## 3. Тесты

- [x] 3.1 Обновить `sidebar-nav.component.test.tsx`: единый статический список, ссылки пунктов, идентичность состава при разных `usePathname`
- [x] 3.2 Добавить кейсы подсветки: точное совпадение (`/notifications`), префикс (`/corrections/COR-000001` → «Рабочий стол»), неактивные пункты без подсветки
- [x] 3.3 Кейсы видимости «Создать корректировку»: показан для `FILIAL`, скрыт для `CFO`/`DTOE`
- [x] 3.4 Удалить `top-tabs.component.test.tsx`

## 4. Синхронизация артефактов

- [x] 4.1 Обновить `test-plan.md` под фактическое покрытие сценариев
- [x] 4.2 Проверить согласование с незавершённым change `sidebar-nav-icons` (иконки пунктов сохранены)

## 5. Верификация

- [x] 5.1 `openspec validate static-sidebar-nav --strict --no-interactive`
- [x] 5.2 frontend: `bun run test` — 156 passed; `bun run lint` / `bun run build` падают из-за пред­существующих проблем окружения (нет `.env`, дефекты eslint-конфига), не связанных с change
- [x] 5.3 Ручная проверка: `/dashboard`, `/planning`, `/execution`, `/fact`, `/corrections/COR-*`, `/notifications` — состав одинаков, верная подсветка, шапка без вкладок
