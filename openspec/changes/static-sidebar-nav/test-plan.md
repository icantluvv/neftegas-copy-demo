# Test Plan

## Risk level
P2

## Scenario coverage

Файл Component-тестов: `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx`.

| Requirement | Scenario | Risk | Test level | Test / кейс | Status |
|---|---|---:|---|---|---|
| Пункты меню навигации в сайдбаре | Переход по пункту «Рабочий стол» | P2 | Component | «содержит пункт меню „Рабочий стол“ со ссылкой на /dashboard» | covered |
| Пункты меню навигации в сайдбаре | Переход по пункту «Уведомления» | P2 | Component | «содержит пункт меню „Уведомления“ со ссылкой на /notifications» | covered |
| Пункты меню навигации в сайдбаре | Пункты разделов «План на 2027», «Выполнение», «Факт» со ссылками | P2 | Component | «содержит пункты разделов „План на 2027“, „Выполнение“, „Факт“» | covered |
| Пункты меню навигации в сайдбаре | Состав пунктов не зависит от текущей страницы | P2 | Component | «показывает те же пункты навигации независимо от текущей страницы» | covered |
| Пункты меню навигации в сайдбаре | «Создать корректировку» виден только роли «Филиал» | P2 | Component | «показывает „Создать корректировку“ … для роли „Филиал“» | covered |
| Пункты меню навигации в сайдбаре | «Создать корректировку» скрыт для остальных ролей | P2 | Component | «не показывает „Создать корректировку“ роли, отличной от „Филиал“» (кейс `CFO`; `DTOE` — та же ветка фильтра по `roles`) | covered |
| Пункты меню навигации в сайдбаре | Отсутствие верхних вкладок навигации | P3 | Manual | шапка `app/(private)/layout.tsx` — `justify-end`, только `NotificationBell` | covered |
| Подсветка активного пункта навигации | Подсветка по точному совпадению маршрута | P2 | Component | «подсвечивает активный пункт по точному совпадению маршрута» (`/notifications`) | covered |
| Подсветка активного пункта навигации | Подсветка по префиксу вложенного маршрута | P2 | Component | «подсвечивает „Рабочий стол“ на вложенных страницах корректировок» (`/corrections/COR-000001`) | covered |
| Подсветка активного пункта навигации | Неактивные пункты не подсвечены | P2 | Component | «не подсвечивает пункты, не соответствующие текущему маршруту» | covered |

## Required automated tests

### Unit
- [x] `isNavItemActive`: точное совпадение, совпадение по префиксу, отсутствие совпадения — покрыто через Component-тесты подсветки сайдбара; отдельный unit не вводился (waiver: чистая функция из 2 строк, поведение целиком наблюдаемо в Component-слое)

### Component
- [x] Все пункты отрисованы с корректными `href`
- [x] Состав и ссылки идентичны при `usePathname` = `/dashboard` и `/planning`
- [x] Подсветка активного пункта: `/notifications` → «Уведомления»
- [x] Подсветка по префиксу: `/corrections/COR-000001` → «Рабочий стол»
- [x] Неактивные пункты без класса подсветки
- [x] «Создать корректировку» виден для `FILIAL`, скрыт для `CFO`

### Integration
- [ ] Не применимо

### E2E
- [ ] Не применимо (нет критического маршрута с сессией в объёме change)

## Manual checks
- [x] Шапка приватного контура не содержит вкладок навигации, только колокольчик — `app/(private)/layout.tsx:34` (`justify-end`, `<NotificationBell/>`)
- [x] Проход по `/dashboard`, `/planning`, `/execution`, `/fact`, `/corrections/COR-*`, `/notifications`: состав пунктов одинаков, подсвечен верный пункт (задача 5.3)
- [x] Иконки пунктов отображаются (согласование с `sidebar-nav-icons`) — поле `icon: LucideIcon` сохранено в `NavItem`, каждому пункту `sidebarItems` назначена иконка (`constants.ts:14,25`), иконка рендерится перед лейблом (`sidebar-nav.tsx:81`)

## Test data
- Fixtures: `testUser` из существующего `sidebar-nav.component.test.tsx`
- API mocks: `useLogout` — существующий мок; сетевые запросы не требуются
- User roles: `FILIAL`, `CFO`
- Seed data: не требуется

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices

## Verification commands
- [x] openspec validate static-sidebar-nav --strict --no-interactive
- [x] frontend: `bun run test` — 156 passed; `bun run lint` / `bun run build` падают из-за предсуществующих проблем окружения (нет `.env`, дефекты eslint-конфига), не связанных с change
- [x] backend: не затронут
- [x] api: не затронут
- [x] E2E smoke / ручная проверка: ручной проход по разделам (задача 5.3)
