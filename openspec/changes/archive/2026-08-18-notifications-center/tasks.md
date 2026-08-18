## 1. API

- [x] 1.1 [api] Добавить `api/src/paths/notifications-read-all.yaml` (`POST /notifications/read-all`, request без тела, response `200 { updatedCount: integer }`, `401` без авторизации) и зарегистрировать путь в `api/src/openapi.yaml`; выполнить `npm run lint` из `api/` (и `npm run bundle`, если требуется схемой проекта). `GET /notifications` и `POST /notifications/:id/open` контракт не меняют — подтвердить явно.

## 2. Backend

- [x] 2.1 [backend] Написать падающий unit-тест `NotificationsService.markAllRead`: помечает прочитанными только уведомления текущего пользователя (не задевает чужие записи), идемпотентен при повторном вызове (0 обновлений без ошибки), возвращает число реально обновлённых записей.
- [x] 2.2 [backend] Реализовать `NotificationsService.markAllRead(user)` (одним `UPDATE` по `userId` и `isRead = false`) — минимальная реализация до green.
- [x] 2.3 [backend] Добавить `NotificationsController.readAll` (`POST /notifications/read-all`, `@CurrentUser()`), задействовать `NotificationsService.markAllRead`.
- [x] 2.4 [backend] Написать падающий e2e-тест (`apps/backend/test/*.e2e-spec.ts`): `POST /notifications/read-all` без токена → `401`; с токеном → `200`, последующий `GET /notifications` возвращает все записи с `isRead: true`.
- [x] 2.5 [backend] Прогнать e2e до green, при необходимости доработать guard/сериализацию ответа (потребовался явный `@HttpCode(HttpStatus.OK)` — Nest по умолчанию отвечает 201 на POST).
- [x] 2.6 [backend] `npm run lint` и `npm run test` из `apps/backend` (lint: 0 ошибок в файлах этой задачи; 15 ошибок/3 предупреждения — pre-existing debt в незатронутых файлах `auth.controller.ts`, `current-user.decorator.ts`, `roles.guard.ts`, `session-auth.guard.ts(.spec.ts)`, `corrections.mapper.ts`, `corrections.service.ts`, `main.ts`; test: 15/15 green).

## 3. Frontend

- [x] 3.1 [frontend] Перегенерировать Kubb-клиент из обновлённого `api/src/openapi.yaml` (появляется `useMarkAllNotificationsRead` в `apps/frontend/packages/api/base/codegen/**`) — не редактировать сгенерированные файлы вручную. Коммит ограничен файлами, относящимися к `markAllNotificationsRead` — параллельно в рабочем дереве шли несвязанные изменения другого change (`document-slot`), их не трогал.
- [x] 3.2 [frontend] Падающий component-тест `NotificationBell`: бейдж скрыт при 0 непрочитанных, показывает точное число 1–9, показывает «9+» при >9.
- [x] 3.3 [frontend] Реализовать `NotificationBell` (иконка + бейдж), подключить `useGetNotifications` с `refetchInterval: 60_000`; довести тест 3.2 до green.
- [x] 3.4 [frontend] Падающий component-тест: клик по колокольчику открывает панель без перехода маршрута; повторный клик, клик вне панели и `Escape` закрывают панель.
- [x] 3.5 [frontend] Реализовать popover-панель (открытие/закрытие по клику, вне-клику, `Escape`, без блокировки остального интерфейса) на базе `@base-ui/react/popover` (уже в зависимостях, даёт dismiss по клику вне/Escape из коробки); довести тест 3.4 до green.
- [x] 3.6 [frontend] Падающий component-тест: панель показывает не более 7 последних уведомлений (новые сверху), непрочитанные выделены жирным, пустое состояние «Новых уведомлений нет», ссылка «Все уведомления» ведёт на `/notifications`.
- [x] 3.7 [frontend] Реализовать содержимое панели (список из первых 7 записей уже загруженного `getNotifications`, заголовок с числом непрочитанных, ссылка «Все уведомления»); довести тест 3.6 до green.
- [x] 3.8 [frontend] Падающий component-тест: клик по записи в панели помечает её прочитанной (`useOpenNotification`) и переходит на маршрут корректировки.
- [x] 3.9 [frontend] Реализовать обработчик клика по записи панели (mutate `openNotification` → `router.push` на `/corrections/[humanId]`); довести тест 3.8 до green.
- [x] 3.10 [frontend] ~~Падающий component-тест: кнопка «Отметить все прочитанными» в панели вызывает массовую пометку~~ — **пересмотрено**: продуктовое решение убрать кнопку массовой пометки из панели (дублирование действия со страницей `/notifications` сочтено лишним в поповере). Тест заменён на «панель не содержит кнопку „Отметить все прочитанными“» и «открытие панели не вызывает мутации пометки» (без `markAllRead`).
- [x] 3.11 [frontend] ~~Реализовать кнопку «Отметить все прочитанными» в панели~~ — **пересмотрено**: кнопка и `useMarkAllNotificationsRead` убраны из `NotificationBell`; массовая пометка остаётся только на странице `/notifications` (см. 3.20–3.21). Спека `specs/notifications/spec.md` обновлена (`SHALL NOT` дублировать действие в панели).
- [x] 3.12 [frontend] Подключить `NotificationBell` в `apps/frontend/app/(private)/layout.tsx` рядом с `SidebarNav` (новая top-bar обёртка шапки).
- [x] 3.13 [frontend] Создать маршрут-заглушку `apps/frontend/app/(private)/corrections/[humanId]/page.tsx`: серверный компонент, читает `humanId` из параметров, отображает текст-заглушку без запросов к бэкенду.
- [x] 3.14 [frontend] Падающий component-тест `NotificationsTable`: колонки «Дата»/«Сообщение», непрочитанные строки жирным, пустое состояние «Уведомлений нет».
- [x] 3.15 [frontend] Реализовать `apps/frontend/app/(private)/notifications/page.tsx` (серверная страница) и `apps/frontend/app/(private)/notifications/components/notifications-table.tsx` (клиентский компонент на `useGetNotifications`, тот же query key, что и у `NotificationBell`); довести тест 3.14 до green.
- [x] 3.16 [frontend] Падающий component-тест: кнопка «Открыть» в строке помечает запись прочитанной и переходит на `/corrections/[humanId]`.
- [x] 3.17 [frontend] Реализовать кнопку «Открыть» в строке таблицы; довести тест 3.16 до green.
- [x] 3.18 [frontend] Падающий component-тест: фильтр «Только непрочитанные» скрывает/показывает прочитанные записи без запроса на сервер (клиентская фильтрация уже загруженного списка).
- [x] 3.19 [frontend] Реализовать переключатель «Только непрочитанные»; довести тест 3.18 до green.
- [x] 3.20 [frontend] Падающий component-тест: кнопка «Отметить все прочитанными» на странице `/notifications` снимает выделение со всех строк и обнуляет бейдж колокольчика (общий query key).
- [x] 3.21 [frontend] Реализовать кнопку «Отметить все прочитанными» на странице (переиспользовать логику из 3.11); довести тест 3.20 до green.
- [x] 3.22 [frontend] Падающий E2E-тест (`apps/frontend/e2e/notifications.e2e.spec.ts`): happy path — клик по колокольчику → открытие панели → клик по записи → переход на `/corrections/[humanId]`, запись помечена прочитанной, бейдж уменьшился. Сидинг данных — через реальный HTTP API (филиал создаёт и направляет корректировку ЦФО демо-сида), а не мок.
- [x] 3.23 [frontend] Падающий E2E-тест: на странице `/notifications` клик «Отметить все прочитанными» обнуляет бейдж и снимает выделение со всех строк.
- [x] 3.24 [frontend] Довести оба E2E-теста (3.22, 3.23) до green. По пути отключён плавающий dev-индикатор Next.js (`devIndicators: false` в `next.config.ts`) — перехватывал клики Playwright поверх контента; не связано с продуктовым поведением.
- [x] 3.25 [frontend] Unit-тест на конфигурацию фонового опроса (`refetchInterval: 60_000` у query-хука уведомлений) как обоснованная замена ручной 60-секундной проверки в E2E — покрыто на component-уровне в рамках 3.2 (тест «настраивает фоновый опрос раз в 60 секунд»), отдельный unit-файл избыточен.
- [x] 3.26 [frontend] `npx tsc --noEmit` (нет скрипта `typecheck` в package.json — 0 ошибок), `bun run lint` (0 ошибок в файлах этого change; все найденные ошибки — в pre-existing сгенерированном Kubb-кодогене и в файлах параллельного change `correction-detail-page`), `bun run test` (120/121 green; единственный красный — `setup-browser.component.test.ts`, pre-existing и не связан с этим change), `bun run build` (успешно, `/notifications` и `/corrections/[humanId]` собираются как динамические маршруты) — все из `apps/frontend`.

## 4. Верификация и завершение

- [x] 4.1 [openspec] Обновить `test-plan.md` построчно по мере закрытия задач 2.x/3.x (статус Done/тест-файл для каждого сценария).
- [x] 4.2 [openspec] `openspec validate notifications-center --strict --no-interactive`.
- [ ] 4.3 [root] Убедиться, что продуктовая задача переведена в трек «Приемка», и только после этого запускать `/openspec-archive-change notifications-center` — вне зоны ответственности реализации, требует подтверждения заказчика/трекера задач.
