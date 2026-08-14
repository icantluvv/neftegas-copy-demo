## 1. API

_(нет задач — контракт не меняется, эндпоинт `GET /notifications` переиспользуется без изменений)_

## 2. Backend

_(нет задач — backend не затронут)_

## 3. Frontend

- [ ] 3.1 [frontend] Падающий component/unit-тест `useDesktopNotifications`:
  первый вызов после монтирования не создаёт системных уведомлений (только
  запоминает базовый набор id); последующий вызов с новой непрочитанной
  записью вызывает `new Notification(...)`; запись без изменения статуса не
  создаёт повторного уведомления при следующем опросе.
- [x] 3.2 [frontend] Реализовать `apps/frontend/src/hooks/use-desktop-notifications.ts`
  (запрос разрешения при монтировании, диф по `Set<id>` в `useRef`, `tag` на
  основе id для идемпотентности, `onclick` → `window.focus()` + `onSelect` +
  `close()`) — опережает тест 3.1.
- [ ] 3.3 [frontend] Падающий component-тест `NotificationBell`: панель
  содержит кнопку «Отметить все прочитанными» при наличии непрочитанных
  записей; кнопка отсутствует при их отсутствии; клик вызывает
  `useMarkAllNotificationsRead` и обнуляет бейдж.
- [x] 3.4 [frontend] Подключить `useDesktopNotifications` в
  `NotificationBell`, обернуть `handleSelectNotification`/`invalidateNotifications`
  в `useCallback` (стабильные ссылки для зависимостей эффекта); добавить
  кнопку «Отметить все прочитанными» в заголовок панели — опережает тест 3.3.
  **Внимание**: реализация напрямую противоречит `SHALL NOT`-требованию
  `notifications-center` (см. `design.md`, «Незаархивированный конфликт») —
  не отмечать этот change `ready`/архивировать, пока конфликт не разрешён (см.
  задачу 4.1).
- [x] 3.5 [frontend] `npx tsc --noEmit` (0 ошибок) и `bun run lint` на
  `src/components/notification-bell/**`, `src/hooks/**` (0 ошибок).
- [ ] 3.6 [frontend] `bun run test` для `notification-bell.component.test.tsx`
  (существующий файл `notifications-center` — актуализировать под новую
  кнопку) и нового `use-desktop-notifications.test.ts` — заблокировано: нет
  Chromium в dev-контейнере (тот же waiver, что и в `filial-corrections-overview`).
- [x] 3.7 [frontend] Ручная проверка HTTP-уровня: существующий unit-набор
  (39/39) прогнан после изменений — остаётся зелёным, `notification-bell`
  не имеет unit-тестов вне component-уровня, поэтому явно не задет.

## 4. Верификация и завершение

- [ ] 4.1 [root] Разрешить конфликт с `notifications-center` (см. `design.md`)
  — обновить `notifications-center/specs/notifications/spec.md` (убрать
  `SHALL NOT`-требование и сценарий «В панели нет кнопки массовой пометки»,
  актуализировать его `tasks.md`/`test-plan.md`) или зафиксировать
  альтернативное решение — **блокирует архивацию обоих changes**.
- [ ] 4.2 [openspec] `openspec validate desktop-notifications --strict --no-interactive`.
- [ ] 4.3 [root] Установить Chromium в dev-образ frontend — тот же блокер,
  что в `filial-corrections-overview/tasks.md` (4.3), не дублировать работу.
- [ ] 4.4 [root] Ручная проверка в реальном браузере: показ системного
  уведомления при получении нового события, клик по нему — не выполнена в
  этой сессии (нет GUI в среде агента).
