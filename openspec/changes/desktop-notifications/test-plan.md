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
| Содержимое выпадающей панели уведомлений (кнопка массовой пометки) | Кнопка «Отметить все прочитанными» видна в панели при непрочитанных | P2 | Component | — | **Not covered** — конфликтует с `notifications-center`, см. `design.md` |

## Required automated tests

### Unit
- [ ] `useDesktopNotifications`: первый прогон не уведомляет; новая непрочитанная запись после первого прогона уведомляет; повторный опрос с тем же составом не дублирует.

### Component
- [ ] `NotificationBell`: кнопка «Отметить все прочитанными» в панели — видимость по числу непрочитанных, вызов мутации, обнуление бейджа.

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
- [x] frontend: `bunx tsc --noEmit -p tsconfig.json` (0 ошибок)
- [x] frontend: `bun run lint` на затронутых файлах (0 ошибок)
- [x] frontend: `bun run test` (39/39 unit green; component/E2E не прогонялись)
- [ ] frontend: `bun run build`
