## Context

`apps/frontend/app/(private)/dashboard/page.tsx` уже реализует
`role-scoped-sections`: единый маршрут `/dashboard`, серверный switch по роли
на `FilialDashboard`/`CfoDashboard`/`DtoeDashboard`. До этого change
`FilialDashboard` (`apps/frontend/app/(private)/dashboard/components/filial-dashboard.tsx`)
запрашивал `getCorrectionStatsFilial()` только ради guard-логики (403 →
`AccessDeniedScreen`, 401 → `null`) и рендерил единственный `<h1>`. То же самое
верно было и для `CfoDashboard`/`DtoeDashboard` — их дашборды доработаны в
рамках отдельной более ранней сессии тем же паттерном (`CorrectionStatsGrid`),
этот change формально фиксирует только FILIAL-часть и сам переиспользуемый
компонент плиток.

`apps/backend/src/corrections/corrections.service.ts` уже реализует `findAll`
(`GET /corrections`, авто-скоуп по роли — FILIAL видит только свои),
`getStats` (`GET /corrections/stats/filial`) и `create` (`POST /corrections`,
разворачивает пустые `DocumentSlot` по `PackageRequirement` выбранного типа).
Всё это уже использовалось карточкой корректировки
(`apps/frontend/app/(private)/corrections/[humanId]/`), реализованной раньше и
без изменений в этом change.

`apps/backend/src/org/` содержал только TypeORM entities
(`Filial`, `Cfo`, `CorrectionType`, `PackageRequirement`, `FilialCfoLink`) — ни
одного `@Controller`, ни одного `Module`, нигде не зарегистрированного в
`AppModule`. При этом `api/src/paths/org-correction-types.yaml` и остальные
`org-*.yaml` уже существовали в контракте, и Kubb уже сгенерировал
`useGetCorrectionTypes` и весь остальной `orgController`-кодоген во
`apps/frontend/packages/api/base/codegen/**` — фронтенд был готов
интегрироваться с эндпоинтом, которого не существовало на сервере.

`apps/frontend/src/components/sidebar-nav/sidebar-nav.tsx` уже принимает
`user: AuthUser` пропом (для блока профиля, `private-navigation`), но
`navItems` (`apps/frontend/app/(private)/constants.ts`) был плоским списком
без учёта роли — оба существующих пункта («Рабочий стол», «Уведомления»)
одинаково видны всем ролям.

## Goals / Non-Goals

**Goals:**
- Дать роли FILIAL рабочий, а не декоративный `/dashboard`: обзор своих
  корректировок, визуальную сводку по этапам, путь к созданию новой.
- Реализовать ровно тот backend-эндпоинт, который нужен новой frontend-форме
  (`GET /org/correction-types`), не расширяя scope на весь `org`-CRUD.
- Переиспользовать существующие backend-эндпоинты (`GET /corrections`,
  `POST /corrections`, `GET /corrections/stats/filial`) без изменений
  контракта.

**Non-Goals:**
- Не вводится маршрут `/filial` (см. Decision ниже).
- Не реализуется остальной `org`-CRUD (создание/изменение справочников —
  отдельный будущий change при появлении административного интерфейса).
- Не меняется карточка корректировки (`/corrections/[humanId]`) и точки
  сопряжения с ЦФО — уже реализованы ранее.

## Decisions

### `/dashboard` с рендерингом по роли остаётся, `/filial` не вводится

ЧТЗ v3.0 (`docs/tz/filial-cabinet.md`, раздел 0.4) явно рекомендует разделить
кабинеты на `/filial`, `/cfo`, `/dtoe` с `/dashboard` как чистым технический
редиректом, аргументируя это содержательным различием кабинетов (разные
колонки, фильтры, права).

Рассмотрено и отклонено: действующая архитектура `role-scoped-sections`
(зафиксирована как капабилити в `openspec/specs/role-scoped-sections/spec.md`,
уже заархивированный change `2026-08-12-sidebar-nav-and-role-dashboard`) уже
даёт то же самое различие содержимого без физического разделения маршрута —
`DashboardPage` определяет роль на сервере и рендерит только соответствующий
компонент; ролевой guard уже есть (`AccessDeniedScreen` при 403). Введение
`/filial` потребовало бы отдельного change, меняющего уже принятую и
заархивированную спецификацию `role-scoped-sections` (переименование
маршрута — не аддитивное изменение существующего требования), что признано
избыточным риском ради выгоды, которую действующая архитектура уже
обеспечивает по факту (разный контент на один и тот же URL). Решение
принято явно пользователем в ходе реализации (см. диалог), а не по умолчанию.

### 4 группы статуса вместо 5, фильтр — только по группе

ЧТЗ (раздел 2.2, 2.4) описывает 5 групп доната (включая отдельную «Готово к
ДТОиР» для `ALL_CFO_APPROVED`/`SENT_TO_DTOE`) и двухсекционный фильтр
(укрупнённая группа + точный статус из 10 значений).

Рассмотрено и отклонено по явному запросу в ходе реализации: `ALL_CFO_APPROVED`/
`SENT_TO_DTOE` объединены с группой «В работе» (эти статусы так же не требуют
действия от филиала, как и «На проверке ЦФО»/«Частично согласовано»/«Повторно
направлено» — семантически однородны с точки зрения филиала, который ничего
не делает, пока корректировка не вернулась или не согласована окончательно).
Секция «Точный статус» убрана из фильтра целиком — оставлена только секция
«Укрупнённая группа», синхронизированная с кликом по графику/легенде.

### `STAGE_GROUPS` — единственный источник группировки для графика и фильтра

`apps/frontend/app/(private)/dashboard/components/filial-corrections-overview.tsx`
определяет один массив `STAGE_GROUPS` (4 группы, каждая — `key`/`label`/
`statuses`/`strokeClassName`/`dotClassName`), из которого выводятся и сегменты
`DonutChart`, и опции `Select`-фильтра. Клик по сегменту/легенде устанавливает
`filterValue = "group:<key>"` (повторный клик по тому же сегменту сбрасывает
в `"all"`). Это гарантирует, что график и фильтр никогда не разойдутся в
составе групп — альтернатива (раздельные списки для графика и фильтра)
создавала бы риск рассинхронизации при будущих правках.

### Плитки статистики берут данные из `GET /corrections/stats/filial`, донат и таблица — из `GET /corrections`

Верхний ряд из 4 плиток (`CorrectionStatsGrid`) продолжает использовать
серверный вызов `getCorrectionStatsFilial()` в `FilialDashboard` (серверный
компонент) — сохраняет уже принятое в `role-scoped-sections` требование
«Ролевой дашборд получает данные только по своей роли» (403-guard на
специфичном для роли эндпоинте). Донат-график и таблица, напротив, берут
полный список через клиентский `useGetCorrections({ pageSize: 100 })` в
`FilialCorrectionsOverview` и агрегируют группы на клиенте — так как ЧТЗ
явно требует клиентскую фильтрацию таблицы «без нового запроса к серверу»
(раздел 2.4), а `GET /corrections/stats/filial` не дал бы разбивку по 4
группам (отдаёт только `total`/`inReview`/`returned`/`approved`, где
`inReview` уже включает `ALL_CFO_APPROVED` иначе, чем требуется для доната).
Два источника данных могут разойтись на доли секунды при высокой
одновременной активности — riesgo признан приемлемым при текущем масштабе
(единицы корректировок на филиал), не блокирует change.

### `min-h-12` на кнопках создания — согласованность с существующим `Select`-фильтром

Кнопки «+ Создать корректировку» и «Создать первую корректировку» получили
`min-h-12`, чтобы совпадать по высоте с уже существующим `SelectTrigger`
(`h-12 min-h-12`) в том же ряду — визуальная правка по запросу пользователя
после первой реализации, не отдельное требование.

## Тестовая стратегия

TDD-порядок из `openspec/config.yaml` (failing test → минимальная реализация →
green → refactor) **не соблюдён** — весь код этого change написан
итеративно в ходе диалога с пользователем без предварительных тестов. Это
явный технический долг, а не соответствие процессу.

- **Backend**: новых unit/e2e-тестов для `OrgController.findCorrectionTypes`
  не написано. Существующий backend-набор (`apps/backend/src/**/*.spec.ts`,
  15 тестов) прогнан после изменений — остаётся зелёным (не задет).
- **Frontend**: новых component/E2E-тестов для `FilialCorrectionsOverview`,
  `DonutChart`, `CreateCorrectionForm`, ролезависимой фильтрации
  `SidebarNav` не написано. Существующий frontend unit-набор (39 тестов)
  прогнан — остаётся зелёным; `*.component.test.tsx`/`*.e2e.spec.ts` не
  прогонялись вовсе (см. Impact/waiver в `proposal.md`).
- **Ручная/API-проверка выполнена**: `GET /org/correction-types` (200, форма
  ответа соответствует `CorrectionType[]`), `POST /corrections` → `GET
  /corrections` (создание и появление в списке под `filial.donbassgaz@demo.local`),
  SSR-разметка `/dashboard` и `/corrections/create` (`curl` под сессионной
  cookie, проверено наличие ожидаемых текстовых узлов).
- Полный список пробелов покрытия — `test-plan.md`, раздел Gaps.

## API Shape

### `GET /org/correction-types`

- **Файлы**: контракт не менялся — уже существовал
  (`api/src/paths/org-correction-types.yaml`, зарегистрирован в
  `api/src/openapi.yaml`). Backend-реализация: новые
  `apps/backend/src/org/org.controller.ts`, `org.module.ts`,
  `dto/find-correction-types-query.dto.ts`.
- **Авторизация**: любой авторизованный пользователь (session-cookie,
  `SessionAuthGuard` глобальный) — без ограничения по роли (`@Roles()` не
  применён, аналогично `GET /corrections`).
- **Request**: query-параметр `isActive?: boolean` (опционален).
- **Response `200`**: `CorrectionType[]` — `{ id, code, name, description,
  isActive }[]`, отсортировано по `id ASC`.
- **Errors**: `401` — не авторизован (глобальный guard).
- **Обратная совместимость**: новый серверный обработчик уже описанного пути,
  без изменений схемы ответа относительно контракта.

## Files / Owners

- **API**: изменений нет — контракт уже существовал до этого change.
- **Backend**: `apps/backend/src/org/org.controller.ts`,
  `apps/backend/src/org/org.module.ts`,
  `apps/backend/src/org/dto/find-correction-types-query.dto.ts`,
  `apps/backend/src/app.module.ts` (регистрация `OrgModule`).
- **Frontend**: `apps/frontend/app/(private)/dashboard/components/filial-dashboard.tsx`,
  `correction-stats-grid.tsx`, `donut-chart.tsx`,
  `filial-corrections-overview.tsx`; `apps/frontend/app/(private)/corrections/create/page.tsx`,
  `apps/frontend/app/(private)/corrections/create/components/create-correction-form.tsx`;
  `apps/frontend/app/(private)/constants.ts`,
  `apps/frontend/src/components/sidebar-nav/sidebar-nav.tsx`;
  `apps/frontend/app/(private)/lib/status-labels.ts` (перенесён из
  `app/(private)/corrections/[humanId]/lib/`, обновлены 3 импорта в
  `corrections/[humanId]/components/*.tsx`).

**Readiness Decision**: `ready with conditions` — реализация функционально
завершена и вручную проверена (HTTP/SSR), но автоматизированное тестовое
покрытие (P1 по `proposal.md`) отсутствует; перед архивацией change требуется
либо написать тесты по сценариям `test-plan.md`, либо оформить явный waiver
по каждому непокрытому P0/P1-сценарию.

## Open Questions

- Нужно ли развести источники данных доната/таблицы и плиток статистики на
  единый агрегирующий эндпоинт (`GET /corrections/stats/filial` с разбивкой по
  4 группам), чтобы устранить риск рассинхронизации из раздела Decisions? Не
  блокирует текущий масштаб данных.
- Открытые вопросы самого ЧТЗ (`docs/tz/filial-cabinet.md`, раздел 8) —
  редактирование типа корректировки в статусе «Черновик», удаление черновика,
  автопометка уведомлений, ограничения на файлы, экспорт в Excel — не решены
  и не входят в этот change.
