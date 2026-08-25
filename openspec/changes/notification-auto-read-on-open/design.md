## Context

См. `proposal.md` — Why. Технический контекст:

- `Notification` (`apps/backend/src/notifications/entities/notification.entity.ts`)
  имеет прямую колонку `correctionId` (FK, `onDelete: 'CASCADE'`) — массовая
  пометка по корректировке не требует join через `humanId`, достаточно
  внутреннего числового `id`, который фронтенд уже получает как часть
  `CorrectionDetail` (`detail.id`) через `useGetCorrectionSuspense`.
- Единственные существующие способы поменять `isRead` до этого change:
  `NotificationsService.open(user, id)` (одно уведомление по его
  собственному `id`) и `markAllRead(user)` (все уведомления пользователя).
  Ни один не подходит напрямую для «все уведомления одного пользователя по
  одной корректировке» — нужен третий метод.
- `openspec/specs/notifications/spec.md`, Requirement «Пометка прочитанным
  только по явному действию пользователя» — уже опубликованная
  спецификация, содержащая ровно противоположный текущему change сценарий
  для прямого открытия карточки. Delta-спека в этом change — MODIFIED,
  требование переименовано (старое название описывало уже неверное
  поведение) и один из двух сценариев инвертирован.

## Goals / Non-Goals

**Goals:**
- Реализовать автопометку прочитанным при открытии карточки корректировки,
  единообразно для обоих способов попадания на неё.
- Обновить бейдж колокольчика без ожидания фонового 60-секундного опроса.

**Non-Goals:**
- Изменение поведения выпадающей панели (открытие без клика по-прежнему не
  меняет прочитанность) — ЧТЗ закрывает только вопрос про карточку.
- Отдельный UI-индикатор «уведомления по этой корректировке помечены
  прочitanными» на самой карточке — не запрошено.

## Decisions

### Новый эндпоинт `POST /notifications/by-correction/{correctionId}/read`, не переиспользование `open`
Альтернатива — на фронте получать список непрочитанных уведомлений по
корректировке (`GET /notifications`, фильтрация на клиенте) и вызывать
`POST /notifications/{id}/open` для каждого — отклонена: N запросов вместо
одного, дополнительная фильтрация полного списка уведомлений пользователя
только ради нескольких id, без атомарности (частичный сбой на середине
цикла оставляет часть уведомлений непрочитанными без явной ошибки для
пользователя). Один идемпотентный bulk-update по `(userId, correctionId,
isRead=false)` — как `markAllRead`, но с дополнительным условием по
корректировке — проще и надёжнее.

### Эффект на клиенте — `useEffect` с ref-guard по `detail.id`, не серверный вызов в RSC
`CorrectionDetailView` уже клиентский компонент с `useGetCorrectionSuspense`;
добавление серверного вызова в `page.tsx` потребовало бы либо дублировать
`correctionId` через дополнительный проп, либо ещё один запрос за деталями
корректировки в RSC. Клиентский `useEffect`, срабатывающий при смене
`detail.id` (не при каждом ре-рендере — `useRef` предотвращает повторный
вызов для той же корректировки), проще и не требует RSC-изменений.

## API Shape

| Метод | Путь | Роль | Назначение |
|---|---|---|---|
| POST | `/notifications/by-correction/{correctionId}/read` | любая авторизованная | Пометить прочитанными все уведомления текущего пользователя по одной корректировке |

Response `200`: `{ updatedCount: integer }` — та же форма, что у
`POST /notifications/read-all`. Идемпотентно: повторный вызов после первого
успешного возвращает `updatedCount: 0`.

Обратная совместимость: аддитивно.

## Backend

`apps/backend/src/notifications/`:
- `notifications.service.ts` — метод `markReadByCorrection(user, correctionId)`.
- `notifications.controller.ts` — `POST by-correction/:correctionId/read`.

## Frontend

`apps/frontend/app/(private)/corrections/[humanId]/components/correction-detail-view.tsx`
— `useMarkNotificationsReadByCorrection` + `useEffect` с `useRef`-guard по
`detail.id`, инвалидация `getNotificationsQueryKey()` в `onSuccess`.

## Files / Owners

| Область | Файлы | Владелец |
|---|---|---|
| API | `api/src/paths/notifications-by-correction-correction-id-read.yaml`, `api/src/openapi.yaml` | автор change |
| Backend | `apps/backend/src/notifications/{notifications.service.ts,notifications.controller.ts}` | автор change |
| Frontend | `apps/frontend/app/(private)/corrections/[humanId]/components/correction-detail-view.tsx` | автор change |

## Readiness Decision

**ready with conditions** — backend-часть проверена вручную через `curl`
(идемпотентная массовая пометка подтверждена); визуальная проверка
обновления бейджа в браузере и автоматизированные тесты отсутствуют — см.
`test-plan.md`.

## Тестовая стратегия

- Риск фичи: **P1** — реверс уже опубликованного поведения, видимого всем
  трём ролям на каждой приватной странице.
- Backend Unit: `markReadByCorrection` — идемпотентность (второй вызов
  `updatedCount: 0`), изоляция по пользователю (не трогает чужие
  уведомления той же корректировки) и по корректировке (не трогает
  уведомления того же пользователя по другой корректировке).
- Frontend Component: эффект в `correction-detail-view` вызывается ровно
  один раз при монтировании с данной `detail.id` и не повторяется при
  ре-рендерах без смены корректировки.
- Frontend E2E: непрочитанное уведомление → переход на карточку по прямой
  ссылке (не через клик по уведомлению) → бейдж колокольчика уменьшился.
- Verification gates: `npx tsc --noEmit`, `bun run lint` (backend и
  frontend) — выполнены, чисто; `redocly lint` (`api/`) — валиден.

## Risks / Trade-offs

- [Риск] Реверс уже опубликованной спецификации может застать врасплох
  того, кто полагался на прежнее поведение (например, при написании других
  фич, ссылающихся на «уведомления не помечаются автоматически») →
  Митигация: спецификация обновлена этим же change (MODIFIED, не отдельный
  забытый текст), причина реверса явно задокументирована в `proposal.md`.
- [Риск] Обновление бейджа зависит от успешного `onSuccess` мутации; при
  сетевом сбое бейдж останется устаревшим до следующего фонового опроса (до
  60 секунд) → Митигация: это деградация до уже существующего поведения
  (опрос раз в 60 секунд), не хуже, чем до этого change.

## Open Questions

Нет — ЧТЗ по этому пункту (раздел 6.6) содержит принятое решение, не
открытый вопрос.
