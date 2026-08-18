# Test Plan

## Risk level
P2

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Разрешение на системные уведомления | Запрос разрешения при первом посещении | P2 | Manual | — | **Not covered** — нет GUI-браузера в среде агента |
| Системное уведомление о новом непрочитанном сообщении | Новое уведомление показывается системным всплытием | P1 | Unit/Component | — | **Not covered** — план: `use-desktop-notifications.test.ts` |
| Системное уведомление о новом непрочитанном сообщении | Уведомления, существовавшие при загрузке страницы, не показываются повторно | P1 | Unit/Component | — | **Not covered** |
| Переход по клику на системное уведомление | Клик по системному уведомлению открывает корректировку | P1 | Manual | — | **Not covered** — нет GUI-браузера в среде агента |
| Содержимое выпадающей панели уведомлений | В панели нет кнопки массовой пометки | P2 | Component | `notification-bell.component.test.tsx` | Covered |
| Содержимое выпадающей панели уведомлений | Заголовок панели не показывает число непрочитанных | P3 | Component | — | **Not covered** — план: добавить в `notification-bell.component.test.tsx` |
| Содержимое выпадающей панели уведомлений | Ссылка «Все уведомления» ведёт на полный список | P2 | Component | `notification-bell.component.test.tsx` | Covered |

## Required automated tests

### Unit
- [ ] `useDesktopNotifications`: первый прогон не уведомляет; новая непрочитанная запись после первого прогона уведомляет; повторный опрос с тем же составом не дублирует.

### Component
- [ ] `NotificationBell`: панель не содержит кнопку «Отметить все прочитанными»;
  заголовок панели показывает «Уведомления» без числа непрочитанных; кнопка
  «Все уведомления» ведёт на `/notifications`.

### Integration
_(не вводится)_

### E2E
_(не запланирован для P2 — риск сосредоточен в конфликте с notifications-center, не в механике)_

## Manual checks
- [ ] Реальный показ системного уведомления ОС и клик по нему — не выполнено (нет GUI в среде агента, см. `proposal.md`).

## Gaps (честно)

Полностью отсутствует автоматизированное покрытие — ни unit, ни component.
Единственная проверка — статическая (`tsc`/`eslint`) и то, что существующий
39-тестовый unit-набор не сломан. Показ настоящего системного уведомления
браузером **не подтверждён ни разу** за пределами чтения исходного кода —
это наибольший риск: `Notification` API имеет различия в поведении между
браузерами (разрешения, `tag`-дедупликация), которые статическая проверка не
ловит.

## Test data
- Тот же демо-аккаунт `filial.donbassgaz@demo.local`, что и в
  `filial-corrections-overview`.

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- Push-уведомления при закрытом браузере (Service Worker)

## Verification commands
- [ ] `openspec validate desktop-notifications --strict --no-interactive`
- [x] frontend: `bunx tsc --noEmit -p tsconfig.json` (0 ошибок на затронутых файлах;
  1 предсуществующая ошибка `app/layout.tsx` — `LayoutProps`, не связана с этим
  change)
- [x] frontend: `bun run lint` на затронутых файлах (0 ошибок)
- [x] frontend: `bun run test -- --project=unit` (39/39 green; component/E2E
  по-прежнему не прогонялись — нет Chromium в dev-контейнере)
- [ ] frontend: `bun run build`
