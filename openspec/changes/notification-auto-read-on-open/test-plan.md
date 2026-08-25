# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Пометка прочитанным при переходе на карточку корректировки из интерфейса | Открытие панели не меняет статус прочитанности | P2 | (не изменялось этим change — покрыто существующим сценарием `notifications` spec) | — | Unchanged |
| Пометка прочитанным при переходе на карточку корректировки из интерфейса | Клик по кнопке «Открыть» в дашборде помечает связанные уведомления прочитанными | P0 | Manual | curl (5.1) | Done |
| Пометка прочитанным при переходе на карточку корректировки из интерфейса | Открытие карточки через клик по уведомлению помечает все связанные уведомления прочитанными | P1 | Manual | не выполнено визуально в браузере — waiver | Waiver |
| Пометка прочитанным при переходе на карточку корректировки из интерфейса | Обновление уже открытой карточки не отправляет повторный запрос на пометку | P1 | Manual | ручная проверка через DevTools Network не выполнена — waiver | Waiver |

## Required automated tests

### Unit
- [ ] `apps/backend/src/notifications/notifications.service.spec.ts` — `markReadByCorrection`: идемпотентность, изоляция по пользователю, изоляция по корректировке

### Component
- [ ] `apps/frontend/src/hooks/use-mark-correction-notifications-read.test.ts` (новый) — инвалидация `getNotificationsQueryKey()` только при `updatedCount > 0`, мутация вызывается на каждый вызов возвращённой функции
- [ ] `apps/frontend/src/components/notification-bell/notification-bell.component.test.tsx` (расширение) — клик по записи вызывает `useMarkCorrectionNotificationsRead(notification.correctionId)`, не `useOpenNotification`

### Integration
_(не вводится)_

### E2E
- [ ] `apps/frontend/e2e/correction-detail.e2e.spec.ts` (расширение) — непрочитанное уведомление → клик по нему → бейдж уменьшился; обновление уже открытой карточки (F5) не создаёт запрос `POST /notifications/by-correction/*/read`

## Manual checks
- [x] `curl` под `filial.donbassgaz@demo.local`: `POST /notifications/by-correction/1/read` → `{"updatedCount":5}`
- [ ] Визуальная проверка обновления бейджа колокольчика в браузере — **waiver**: в dev-контейнере frontend нет установленного Chromium для Playwright/Vitest Browser Mode, `chromium-cli` недоступен в среде агента (то же инфраструктурное ограничение, что зафиксировано в `filial-corrections-overview`)

## Test data
- Fixtures: пользователь с ≥1 непрочитанным уведомлением, связанным с конкретной корректировкой; второй пользователь с уведомлением по той же корректировке (для проверки изоляции по пользователю); уведомление того же пользователя по другой корректировке (для проверки изоляции по корректировке).
- API mocks: мок `useMarkNotificationsReadByCorrection` для component-теста, по паттерну существующих моков Kubb-хуков в `corrections/[humanId]/components/*.component.test.tsx`.
- User roles: FILIAL, CFO, DTOE — уведомления создаются для всех трёх ролей, поведение не должно зависеть от роли.
- Seed data: не требуется сверх обычных демо-сценариев (возврат/согласование уже создают уведомления).

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- Изменение поведения выпадающей панели без клика — не входит в объём этого change

## Verification commands
- [ ] openspec validate notification-auto-read-on-open --strict --no-interactive
- [x] frontend: `npx tsc --noEmit` — чисто
- [x] frontend: `bun run lint` — без новых ошибок
- [ ] frontend: `bun run test` (component) — блокируется написанием 3.3
- [ ] frontend: `bun run build`
- [x] backend: `npx tsc --noEmit` — чисто
- [x] backend: `bun run lint` — без новых ошибок
- [ ] backend: `bun run test` — блокируется написанием 2.4
- [x] api: `redocly lint` — валиден
- [x] Manual: `curl`-проверка массовой пометки — см. Manual checks
