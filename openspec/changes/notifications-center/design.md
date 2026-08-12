## Context

`apps/backend/src/notifications/` уже полностью реализован: `Notification` entity
(`userId`, `correctionId`, `text`, `isRead`, `createdAt`), `NotificationsService` с
`findForUser` (сортировка `createdAt DESC`, без пагинации) и `open` (проверка
`notification.userId === user.id`, иначе 403). `CorrectionsService`
(`apps/backend/src/corrections/corrections.service.ts`) уже вызывает приватный
хелпер `notifyUsers(manager, users, correctionId, text)` внутри тех же
`dataSource.transaction(...)`, что и смену статуса — на события: направление ЦФО,
все ЦФО согласовали, ЦФО вернул с замечанием, повторная отправка ЦФО, отправка в
ДТОиР, ДТОиР согласовал, ДТОиР вернул с замечанием. Текст уведомления — плоская
строка, уже включает `humanId` корректировки/замечания (например,
«ОГМ вернуло корректировку COR-000002 на доработку. Замечание REM-000002. …»).
Промежуточные согласования отдельных ЦФО намеренно не уведомляются — это уже
поведение `recomputeStatusAfterCfoAction`.

Во фронтенде `apps/frontend/app/(private)/layout.tsx` рендерит `SidebarNav` рядом с
`{children}` без общей «шапки» — колокольчику нужно новое место в layout. Пункт меню
`/notifications` в `apps/frontend/app/(private)/constants.ts` уже существует и ведёт
в никуда (404) — это единственная точка, которая уже ссылается на маршрут этой
фичи. Kubb codegen (`apps/frontend/packages/api/base/codegen/**`) уже содержит
`useGetNotifications`, `useOpenNotification`, `notificationSchema` (zod), сгенерированные
из текущего `api/src/openapi.yaml` — новый эндпоинт `read-all` потребует перегенерации.
Маршрута карточки корректировки (`/corrections/[humanId]` или аналог) во фронтенде
нет вовсе — ни одного файла под `apps/frontend/app/(private)/corrections/`.

## Goals / Non-Goals

**Goals:**
- Единая точка правды по непрочитанным — колокольчик, панель и страница читают один
  и тот же список через один и тот же TanStack Query key, чтобы отметка прочитанным в
  одном месте немедленно отражалась в другом (invalidateQueries).
- Массовая пометка прочитанным как атомарная операция на бэкенде (одним UPDATE, а не
  N вызовов `open`).
- Не вводить очередь сообщений/брокер — создание уведомлений остаётся синхронным
  вызовом внутри существующих транзакций `CorrectionsService`.

**Non-Goals:**
- Не проектируется полноценная карточка корректировки — только маршрут-заглушка,
  на который можно перейти и увидеть `humanId` из URL.
- Не вводится пагинация `GET /notifications` в этом change (см. «Риски»).
- Не вводятся push/email-каналы — только внутрисистемные записи.

## Decisions

### Создание уведомлений остаётся синхронным (без RabbitMQ/очереди)

Рассмотрено: вынести создание `Notification` в очередь (RabbitMQ/BullMQ), чтобы
отвязать от транзакции создания статуса.

Отклонено: в проекте нет ни одного брокера сообщений (`grep` по `apps/backend/src`,
`package.json`, `infra/docker-compose*` подтверждает отсутствие), а объём событий —
десятки корректировок в работе на internal-инструмент с 4 филиалами и 17 ЦФО,
на несколько порядков ниже уровня, где синхронная вставка одной-двух строк в той же
транзакции стала бы узким местом. Обратное — de-факто уже принятое в кодовой базе
решение: `notifyUsers` вызывается внутри того же `dataSource.transaction`, что и
смена `Correction.status`, что даёт бесплатную атомарность (правило 10 корневого
`AGENTS.md`: «каждое действие, меняющее статус… обязано быть атомарным») — очередь
эту гарантию только усложнила бы (нужен outbox-паттерн, чтобы не потерять событие
при падении после commit). Эта часть системы уже реализована и в change не входит;
здесь фиксируется явно, чтобы не переоткрывать вопрос при последующих правках.

### Один эндпоинт `POST /notifications/read-all`, без тела запроса

Массовая пометка — это единственная операция, которую сегодня нельзя выполнить без
N запросов `POST /notifications/:id/open`. Разница с `open`: `open` берёт `humanId`
затронутой корректировки (используется для перехода), `read-all` возвращает только
факт выполнения — фронту не нужны данные по каждой записи, он делает
`invalidateQueries` на `getNotifications` сразу после успеха.

Альтернатива (отклонена): `PATCH /notifications?isRead=true` (bulk-patch по
query) — непоследовательно с уже принятым в проекте REST-стилем экшн-эндпоинтов
(`:id/open`, `send`, `cfo-approve` и т.д. в `corrections`), не даёт выигрыша.

### Колокольчик и панель — общий клиентский компонент в приватном layout, а не в `SidebarNav`

`SidebarNav` (`apps/frontend/src/components/sidebar-nav/sidebar-nav.tsx`) — боковая
панель, а колокольчик по макету — в шапке, общей для всех страниц `(private)`.
Вводится отдельный `NotificationBell` (client component), рендерится в
`apps/frontend/app/(private)/layout.tsx` рядом с `SidebarNav` в новой узкой
top-bar обёртке — это не меняет требование `private-navigation` (сайдбар остаётся
как есть), только добавляет соседний элемент шапки.

### Панель — те же 7 записей, что и первые 7 записей полного списка (без отдельного API-параметра)

`GET /notifications` уже возвращает полный список, отсортированный `createdAt DESC`.
Панель берёт `data.slice(0, 7)` из уже загруженного React Query кэша — отдельный
`?limit=7` параметр не нужен, а `/notifications` и панель используют один и тот же
query key, поэтому повторного запроса при открытии панели после захода на страницу
не происходит (и наоборот).

### `/notifications` — SSR-страница с клиентским компонентом таблицы

Соответствует уже принятому в проекте паттерну (`apps/frontend/app/(private)/dashboard/page.tsx`):
серверный `page.tsx` не делает предварительной выборки уведомлений (данные не
привязаны к роли и не участвуют в защите доступа — эндпоинт сам скоупит по
`CurrentUser`), а рендерит клиентский компонент `NotificationsTable`, который
выполняет запрос через `useGetNotifications`. `export const dynamic = "force-dynamic"`
не требуется (страница не читает `getMe()` напрямую — авторизация уже гарантирована
`PrivateLayout`), но naming и структура (`page.tsx` + `components/*.tsx`) следуют
паттерну `dashboard/`.

### Маршрут-заглушка `/corrections/[humanId]`

Минимальная серверная страница, отображающая `humanId` из параметров маршрута и
текст-заглушку («Карточка корректировки COR-000002 будет доступна в следующем
обновлении»). Не делает запросов к бэкенду. Явно помечается как временная — комментарий
в коде не нужен (это не skip TODO, а зафиксированная в proposal граница scope);
будущий change с полноценной карточкой заменит файл целиком.

## Risks / Trade-offs

- [Риск] `GET /notifications` не пагинирован; список растёт бессрочно (уведомления
  не удаляются) → Смягчение: при текущем масштабе (десятки корректировок, единицы
  уведомлений на событие) объём ответа остаётся в пределах десятков–сотен записей на
  пользователя в течение всего жизненного цикла системы; порог пагинации — открытый
  вопрос ниже, не блокирует эту фичу.
- [Риск] Общий query key между панелью и страницей означает, что открытие панели на
  странице `/notifications` не делает лишний запрос, но и не форсирует свежие данные
  — если сервер создал новое уведомление в последнюю секунду, staleTime может показать
  чуть устаревший список → Смягчение: `refetchInterval: 60_000` (фоновый опрос) уже
  покрывает свежесть в пределах минуты, что соответствует требованию макета.
- [Риск] Маршрут-заглушка `/corrections/[humanId]` может создать ложное ощущение
  готовой фичи у пользователей → Смягчение: явный текст-заглушка на странице и явная
  фиксация границы scope в proposal.md/design.md для следующего change.

## Migration Plan

Аддитивные изменения, миграций БД не требуется (`Notification.isRead` уже существует).
Шаги развёртывания: (1) добавить и задеплоить `api/src/paths/notifications-read-all.yaml`
+ регенерировать backend Swagger и frontend Kubb-клиент, (2) задеплоить backend
(`NotificationsController.readAll`), (3) задеплоить frontend (колокольчик, панель,
страница, роут-заглушка). Откат — revert коммитов без обратных миграций.

## Тестовая стратегия

TDD-порядок: для каждого MUST/SHALL-сценария из `specs/notifications/spec.md` — сперва
падающий тест на нужном уровне, затем минимальная реализация, затем green, затем
рефакторинг.

- **Backend Unit** (`apps/backend/src/notifications/*.spec.ts`): `markAllRead`
  помечает прочитанными только уведомления текущего пользователя (не задевает чужие),
  идемпотентен при повторном вызове (уже всё прочитано → 0 обновлений, без ошибки).
- **Backend Feature/E2E** (`apps/backend/test/*.e2e-spec.ts`): `POST /notifications/read-all`
  без авторизации → 401; с авторизацией → 200 и последующий `GET /notifications`
  возвращает все `isRead: true`.
- **Frontend Component** (`*.component.test.tsx`, Vitest Browser Mode): `NotificationBell` —
  бейдж скрыт при 0, показывает число при 1–9, «9+» при >9; панель показывает не
  более 7 записей, пустое состояние, выделение непрочитанных; `NotificationsTable` —
  фильтр «Только непрочитанные», выделение непрочитанных, пустое состояние, кнопка
  «Открыть» вызывает `useOpenNotification` и переход.
- **Frontend E2E** (`apps/frontend/e2e/*.e2e.spec.ts`): happy path — клик по
  колокольчику → открытие панели → клик по записи → переход на
  `/corrections/[humanId]` и запись помечена прочитанной (бейдж уменьшился); на
  странице `/notifications` — «Отметить все прочитанными» обнуляет бейдж и снимает
  выделение со всех строк.
- **Ручная проверка**: фоновый опрос раз в 60 секунд — конфигурация `refetchInterval`
  проверяется unit-тестом на параметры хука, реальное ожидание 60 секунд в E2E не
  автоматизируется (waiver, см. proposal.md «Влияние на качество»).
- Роли: `FILIAL`, `CFO`, `DTOE` — уведомления одинаково доступны всем трём (см.
  таблицу ролей в задаче), тесты используют существующие seed-фикстуры пользователей
  по одной на роль, без новых typed fixtures сверх уже имеющихся в `apps/backend/test`
  и `apps/frontend/e2e`.

## API Shape

### `POST /notifications/read-all`

- **Файлы**: `api/src/paths/notifications-read-all.yaml` (новый), регистрация пути в
  `api/src/openapi.yaml`.
- **Авторизация**: как у остальных `/notifications/*` — текущий авторизованный
  пользователь (JWT), без ограничения по роли — доступно всем трём ролям.
- **Request**: без тела и без параметров.
- **Response `200`**: `{ updatedCount: integer }` — число реально помеченных записей
  (уже прочитанные не пересчитываются повторно).
- **Errors**: `401` — не авторизован (как у прочих приватных эндпоинтов).
- **Обратная совместимость**: новый путь, существующие `GET /notifications` и
  `POST /notifications/:id/open` не меняются.

## Files / Owners

- **API**: `api/src/paths/notifications-read-all.yaml`, `api/src/openapi.yaml` —
  владелец: разработчик, создавший этот change.
- **Backend**: `apps/backend/src/notifications/notifications.service.ts`,
  `apps/backend/src/notifications/notifications.controller.ts`,
  `apps/backend/src/notifications/*.spec.ts` (новые), `apps/backend/test/*.e2e-spec.ts`
  (новый или дополненный notifications e2e-файл).
- **Frontend**: `apps/frontend/app/(private)/layout.tsx` (подключение колокольчика),
  новый `apps/frontend/src/components/notification-bell/` (или аналогичная папка по
  паттерну `sidebar-nav`), `apps/frontend/app/(private)/notifications/page.tsx` +
  `apps/frontend/app/(private)/notifications/components/notifications-table.tsx`,
  `apps/frontend/app/(private)/corrections/[humanId]/page.tsx` (заглушка),
  `apps/frontend/app/(private)/constants.ts` (без изменений — пункт меню уже есть).

**Readiness Decision**: `ready with conditions` — реализация FE, зависящая от
`useMarkAllNotificationsRead`, заблокирована до завершения задачи по API-контракту
(`notifications-read-all.yaml`) и успешной перегенерации Kubb-кодогена; остальная
часть FE (колокольчик на существующих `useGetNotifications`/`useOpenNotification`,
страница `/notifications`, роут-заглушка) не заблокирована и может вестись
параллельно.

## Open Questions

- Порог, при котором `GET /notifications` потребует пагинации (число записей на
  пользователя) — не блокирует эту фичу, можно решить отдельным change при
  накоплении данных в проде.
