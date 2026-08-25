## 1. API

- [x] 1.1 [api] Добавить путь `POST /notifications/by-correction/{correctionId}/read`
      (`api/src/paths/notifications-by-correction-correction-id-read.yaml`),
      response `{ updatedCount: integer }` по образцу `notifications-read-all.yaml`.
      Зарегистрировать в `api/src/openapi.yaml`. `redocly lint` — валиден.
- [x] 1.2 [api] Перегенерировать Kubb-клиент (`bun run generate` из
      `apps/frontend/packages/api`) — `useMarkNotificationsReadByCorrection`.

## 2. Backend

- [x] 2.1 [backend] `NotificationsService.markReadByCorrection(user, correctionId)`
      — `update({ userId, correctionId, isRead: false }, { isRead: true })`,
      возвращает `{ updatedCount }`.
- [x] 2.2 [backend] `NotificationsController`: `POST by-correction/:correctionId/read`.
- [x] 2.3 [backend] `npx tsc --noEmit` — чисто. `bun run lint` — 0 новых ошибок.
- [ ] 2.4 [backend] Написать `notifications.service.spec.ts` тесты:
      идемпотентность, изоляция по пользователю и по корректировке — не
      написаны.

## 3. Frontend

- [x] 3.1 [frontend] Хук `use-mark-correction-notifications-read.ts`
      (`useMarkNotificationsReadByCorrection` + инвалидация
      `getNotificationsQueryKey()` только при `updatedCount > 0`), подключён
      в обработчиках клика: `NotificationBell.handleSelectNotification`,
      `NotificationsContent.handleOpen` (заменили точечный
      `useOpenNotification`), новый `OpenCorrectionLink` в
      `filial-corrections-overview.tsx`/`cfo-corrections-overview.tsx`.
      Ревью: исходный вариант с `useEffect`/`useRef`-guard на
      `CorrectionDetailView` слал запрос на пометку при каждом заходе на
      карточку (обновление страницы, переход назад/вперёд) — заменён на
      триггер по клику, `correction-detail-view.tsx` без изменений.
- [x] 3.2 [frontend] `npx tsc --noEmit` — чисто (ошибка `LayoutProps` в
      `app/layout.tsx` — предсуществующая, не связана с change). `bun run
      lint` для изменённых файлов — 0 ошибок.
- [ ] 3.3 [frontend] Failing component-тест на
      `useMarkCorrectionNotificationsRead` (инвалидация только при
      `updatedCount > 0`) — не написан.
- [ ] 3.4 [frontend] Failing E2E-сценарий (клик по уведомлению → бейдж
      уменьшился; повторный заход на уже прочитанную карточку не шлёт
      запрос) — не написан.

## 4. OpenSpec

- [x] 4.1 [openspec] `specs/notifications/spec.md` (MODIFIED Requirements) —
      требование переименовано и переформулировано под пометку по клику
      (не по факту отображения карточки); сценарий «прямой заход» заменён
      сценарием «клик по кнопке «Открыть» в дашборде» + новый сценарий
      «обновление уже открытой карточки не шлёт повторный запрос»; сценарий
      открытия панели без клика не изменён.

## 5. Верификация и завершение

- [x] 5.1 [root] Ручная проверка через `curl` под демо-аккаунтом
      `filial.donbassgaz@demo.local`: `POST /notifications/by-correction/1/read`
      → `{"updatedCount":5}` для корректировки с пятью непрочитанными
      уведомлениями пользователя.
- [ ] 5.2 [root] Визуальная проверка обновления бейджа колокольчика в
      браузере — waiver, см. `test-plan.md` (нет Chromium в dev-контейнере
      frontend).
- [ ] 5.3 [openspec] Написать недостающие тесты (2.4, 3.3, 3.4) либо
      оформить явный waiver в `test-plan.md`, затем
      `openspec validate notification-auto-read-on-open --strict --no-interactive`.
