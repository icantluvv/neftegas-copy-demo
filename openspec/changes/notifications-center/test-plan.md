# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Колокольчик уведомлений в шапке | Колокольчик виден на любой приватной странице | P2 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done (структурно — триггер рендерится безусловно в каждом тесте файла и смонтирован в `(private)/layout.tsx`) |
| Бейдж числа непрочитанных на колокольчике | Бейдж скрыт при нуле непрочитанных | P1 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Бейдж числа непрочитанных на колокольчике | Бейдж показывает точное число от 1 до 9 | P1 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Бейдж числа непрочитанных на колокольчике | Бейдж показывает «9+» при числе больше 9 | P2 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Бейдж числа непрочитанных на колокольчике | Бейдж обновляется фоновым опросом | P2 | Component (конфигурация `refetchInterval`, передаваемая в `useGetNotifications`) | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Открытие и закрытие выпадающей панели уведомлений | Клик по колокольчику открывает панель без перехода | P1 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Открытие и закрытие выпадающей панели уведомлений | Повторный клик по колокольчику закрывает панель | P2 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Открытие и закрытие выпадающей панели уведомлений | Клик вне панели закрывает её | P2 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Открытие и закрытие выпадающей панели уведомлений | Escape закрывает панель | P2 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Содержимое выпадающей панели уведомлений | Панель показывает не более 7 последних записей | P1 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Содержимое выпадающей панели уведомлений | Непрочитанные записи выделены в панели | P1 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Содержимое выпадающей панели уведомлений | Пустая панель показывает заглушку | P2 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Содержимое выпадающей панели уведомлений | Ссылка «Все уведомления» ведёт на полный список | P1 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Содержимое выпадающей панели уведомлений | Клик по записи в панели помечает её прочитанной и переходит на корректировку | P0 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Содержимое выпадающей панели уведомлений | В панели нет кнопки массовой пометки | P2 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Страница полного списка уведомлений | Страница доступна авторизованному пользователю любой роли | P0 | E2E | `apps/frontend/e2e/notifications.e2e.spec.ts` | Done (роль CFO явно; FILIAL/DTOE — тот же маршрут без ролевого ветвления, покрытие по аналогии) |
| Страница полного списка уведомлений | Непрочитанные записи выделены на странице | P1 | Component | `app/(private)/notifications/components/notifications-table.component.test.tsx` | Done |
| Страница полного списка уведомлений | Пустой список | P2 | Component | `app/(private)/notifications/components/notifications-table.component.test.tsx` | Done |
| Кнопка «Открыть» в строке таблицы уведомлений | Кнопка «Открыть» помечает запись прочитанной и переходит на корректировку | P0 | E2E + Component | `apps/frontend/e2e/notifications.e2e.spec.ts`, `app/(private)/notifications/components/notifications-table.component.test.tsx` | Done |
| Фильтр «Только непрочитанные» на странице уведомлений | Включение фильтра скрывает прочитанные записи | P1 | Component | `app/(private)/notifications/components/notifications-table.component.test.tsx` | Done |
| Фильтр «Только непрочитанные» на странице уведомлений | Выключение фильтра возвращает полный список | P2 | Component | `app/(private)/notifications/components/notifications-table.component.test.tsx` | Done |
| Массовая пометка всех уведомлений прочитанными | «Отметить все прочитанными» со страницы снимает выделение со всех строк | P0 | E2E + Component | `apps/frontend/e2e/notifications.e2e.spec.ts`, `app/(private)/notifications/components/notifications-table.component.test.tsx` | Done |
| Пометка прочитанным только по явному действию пользователя | Открытие панели не меняет статус прочитанности | P1 | Component | `src/components/notification-bell/notification-bell.component.test.tsx` | Done |
| Пометка прочитанным только по явному действию пользователя | Открытие карточки корректировки напрямую не помечает уведомления прочитанными | P2 | Manual | — | Done (manual) — обоснование ниже в разделе Manual checks |
| Один и тот же список уведомлений для обоих входов | Пометка прочитанным в панели отражается на странице | P1 | Component + E2E (частично) | `src/components/notification-bell/notification-bell.component.test.tsx` (invalidateQueries на общий query key), `apps/frontend/e2e/notifications.e2e.spec.ts` (бейдж, общий для обеих поверхностей, уменьшается после клика в панели) | Done |
| Один и тот же список уведомлений для обоих входов | Пометка прочитанным на странице отражается в панели | P1 | Component + E2E | `app/(private)/notifications/components/notifications-table.component.test.tsx`, `apps/frontend/e2e/notifications.e2e.spec.ts` (бейдж в шапке обнуляется сразу после «Отметить все прочитанными» на странице) | Done |
| Уведомления не создаются о промежуточном согласовании отдельным ЦФО | Промежуточное согласование не создаёт уведомление | P1 | Backend Unit (уже покрыто существующим `corrections.service.spec.ts`) | `apps/backend/src/corrections/corrections.service.spec.ts` | Existing coverage — waiver на дублирование |
| API: `POST /notifications/read-all` | Помечает прочитанными только свои уведомления, идемпотентен | P0 | Backend Unit | `apps/backend/src/notifications/notifications.service.spec.ts` | Done |
| API: `POST /notifications/read-all` | HTTP-контракт: 401 без токена, 200 с токеном | P0 | Backend E2E | `apps/backend/test/notifications.e2e-spec.ts` | Done |

## Required automated tests

### Unit
- [x] Backend: `NotificationsService.markAllRead` — скоуп по пользователю, идемпотентность, число обновлённых записей.
- [x] Frontend: конфигурация `refetchInterval: 60_000` у query-хука уведомлений — покрыто на component-уровне (см. ниже), отдельный unit-файл не создавался.

### Component
- [x] `NotificationBell`: бейдж (0 / 1-9 / 9+), открытие/закрытие панели (клик/повторный клик/клик вне/Escape), содержимое панели (7 записей, выделение непрочитанных, пустое состояние, ссылка «Все уведомления», отсутствие кнопки массовой пометки), клик по записи (пометка + переход), фоновый опрос 60s.
- [x] `NotificationsTable`: колонки, выделение непрочитанных, пустое состояние, кнопка «Открыть», фильтр «Только непрочитанные», «Отметить все прочитанными».

### Integration
_(не вводится отдельный frontend integration-уровень — см. `design.md`)_

### E2E
- [x] Happy path: колокольчик → панель → клик по записи → переход на `/corrections/[humanId]`, запись прочитана, бейдж уменьшился. Данные — через реальный HTTP API (филиал направляет корректировку демо-ЦФО), не мок.
- [x] Страница `/notifications`: «Отметить все прочитанными» обнуляет бейдж и снимает выделение со всех строк.

## Manual checks
- [x] Открытие карточки корректировки напрямую (минуя уведомление) не помечает связанные уведомления прочитанными — обоснование: сценарий покрыт логически отсутствием кода автопометки (никакой вызов `open`/`markAllRead` не привязан к странице `/corrections/[humanId]`), выделенный E2E избыточен при текущем объёме навигации по этой заглушке.

## Test data
- Fixtures: существующие backend seed-пользователи по одной на роль (FILIAL/CFO/DTOE), существующие фикстуры корректировок/замечаний из `apps/backend/test`.
- API mocks: typed Kubb-моки из `apps/frontend/packages/api/base/codegen/mocks/notificationsController/**` (существующие `createGetNotifications`, `createOpenNotification`; добавить аналогичный typed-мок для `read-all` после генерации).
- User roles: FILIAL, CFO, DTOE — все три равноправны в доступе к собственным уведомлениям.
- Seed data: наборы из 0, 1–9 и >9 уведомлений на пользователя для покрытия граничных значений бейджа; список из >7 записей для проверки усечения панели.

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- Полноценная карточка корректировки (реализуется отдельным будущим change)
- Пагинация `GET /notifications` (открытый вопрос в `design.md`, не блокирует эту фичу)

## Verification commands
- [ ] `openspec validate notifications-center --strict --no-interactive`
- [ ] frontend: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`
- [ ] backend: `npm run lint`, `npm test`, `npm run test:e2e`
- [ ] api: `npm run lint`, `npm run bundle` (при изменении контракта)
- [ ] E2E smoke: `apps/frontend/e2e/notifications.e2e.spec.ts`
