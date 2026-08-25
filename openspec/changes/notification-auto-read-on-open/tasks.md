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

- [x] 3.1 [frontend] `correction-detail-view.tsx`: `useMarkNotificationsReadByCorrection`
      + `useEffect`/`useRef`-guard по `detail.id`, инвалидация
      `getNotificationsQueryKey()` в `onSuccess`.
- [x] 3.2 [frontend] `npx tsc --noEmit` — чисто. `bun run lint` — без новых
      ошибок.
- [ ] 3.3 [frontend] Failing component-тест на однократность эффекта при
      той же `detail.id` — не написан.
- [ ] 3.4 [frontend] Failing E2E-сценарий (прямой переход на карточку →
      бейдж уменьшился) — не написан.

## 4. OpenSpec

- [x] 4.1 [openspec] `specs/notifications/spec.md` (MODIFIED Requirements) —
      требование переименовано, сценарий прямого открытия карточки
      инвертирован, сценарий открытия панели без клика не изменён.

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
