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
- [ ] 3.3 [frontend] Падающий component-тест `NotificationBell`: панель не
  содержит кнопку «Отметить все прочитанными» ни при наличии, ни при
  отсутствии непрочитанных записей; заголовок панели показывает текст
  «Уведомления» без числа непрочитанных в скобках.
- [x] 3.4 [frontend] Подключить `useDesktopNotifications` в
  `NotificationBell`, обернуть `handleSelectNotification`/`invalidateNotifications`
  в `useCallback` (стабильные ссылки для зависимостей эффекта) — опережает
  тест 3.3. Кнопка «Отметить все прочитанными» в панель не добавляется (см.
  задачу 3.8 и `design.md`).
- [x] 3.5 [frontend] `npx tsc --noEmit` (0 ошибок) и `bun run lint` на
  `src/components/notification-bell/**`, `src/hooks/**` (0 ошибок).
- [ ] 3.6 [frontend] `bun run test` для `notification-bell.component.test.tsx`
  (существующий файл `notifications-center` — актуализировать под новую
  кнопку) и нового `use-desktop-notifications.test.ts` — заблокировано: нет
  Chromium в dev-контейнере (тот же waiver, что и в `filial-corrections-overview`).
- [x] 3.7 [frontend] Ручная проверка HTTP-уровня: существующий unit-набор
  (39/39) прогнан после изменений — остаётся зелёным, `notification-bell`
  не имеет unit-тестов вне component-уровня, поэтому явно не задет.
- [x] 3.8 [frontend] Редизайн попапа панели по запросу пользователя:
  уменьшен внутренний отступ (`p-6` → `p-3`), из заголовка убрано число
  непрочитанных в скобках, кнопка «Отметить все прочитанными» окончательно
  убрана из панели (`useMarkAllNotificationsRead` больше не используется в
  `notification-bell.tsx`), ссылка «Все уведомления» оформлена как кнопка
  (`buttonVariants({variant: "secondary"})`) на всю ширину контейнера внизу
  попапа. См. `design.md`, «Редизайн попапа панели уведомлений».
- [x] 3.9 [frontend] Увеличен визуальный зазор между датой и временем записи
  в `notification-panel-list.tsx`: `formatNotificationDateTime` возвращает
  `{datePart, timePart}`, разметка рендерит их двумя `<span>` с `gap-2`.
- [x] 3.10 [frontend] `bunx tsc --noEmit` и `bun run lint` повторно на
  `src/components/notification-bell/**`, `src/utils/format-notification-date-time.ts`
  после редизайна попапа (0 ошибок).

## 4. Верификация и завершение

- [x] 4.1 [root] Разрешить конфликт с `notifications-center` (см. `design.md`,
  «Разрешённый конфликт с `notifications-center`») — реализация приведена в
  соответствие с базовой спекой (`openspec/specs/notifications/spec.md`),
  кнопка «Отметить все прочитанными» окончательно убрана из панели, добавлен
  `MODIFIED Requirements` в `specs/notifications/spec.md` этого change для
  части про заголовок без числа непрочитанных.
- [x] 4.2 [openspec] `openspec validate desktop-notifications --strict --no-interactive` — valid.
- [ ] 4.3 [root] Установить Chromium в dev-образ frontend — тот же блокер,
  что в `filial-corrections-overview/tasks.md` (4.3), не дублировать работу.
- [ ] 4.4 [root] Ручная проверка в реальном браузере: показ системного
  уведомления при получении нового события, клик по нему — не выполнена в
  этой сессии (нет GUI в среде агента).
