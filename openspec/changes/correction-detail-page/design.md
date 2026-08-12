## Context

См. `proposal.md` — Why. Технический контекст, релевантный реализации:

- API-контракт для страницы уже полностью описан в `api/src/openapi.yaml` и
  реализован в `apps/backend/src/corrections/` (см. проверку в ходе research —
  `getCorrection`, `returnCorrectionByCfo`, `approveCorrectionByCfo`,
  `sendCorrectionToDtoe`, `resubmitCorrection`, `resubmitToDtoe`, `dtoeApprove/Return`,
  fix/reopen/delete замечаний). Kubb уже сгенерировал клиент под этот контракт в
  `apps/frontend/packages/api/base/codegen/` — отдельная кодоген-задача не нужна,
  только точечная регенерация при отсутствии актуальных типов (см. задачу 1.1).
- Канонический паттерн работы с данными на фронтенде описан в
  `docs/adr/frontend-data-fetching.md`: TanStack Query v5 + Kubb, Suspense-first
  клиентские хуки (`useGetXxxSuspense`), RSC делает `prefetchQuery` +
  `dehydrate`/`HydrationBoundary`, `getQueryClient()` — `apps/frontend/src/utils/
  get-query-client.ts`, мутации инвалидируют кэш через `getXxxQueryKey()`.
- Существующая страница `apps/frontend/app/(private)/dashboard/page.tsx` **не**
  следует этому ADR: она делает `fetch` в RSC напрямую (`getCorrectionStatsFilial` и
  т.п.) без TanStack Query, что подходит для одного read-only запроса на страницу без
  клиентских мутаций.
- Карточка корректировки — не тот случай: странице нужен один общий детальный объект
  (`CorrectionDetail`) и множество клиентских мутаций (загрузка файла, согласование,
  возврат, повторное направление, отметка/удаление замечания), каждая из которых
  должна инвалидировать и локально обновлять один и тот же query-ключ. Поэтому дизайн
  этой страницы следует каноническому паттерну ADR (Suspense-хук + RSC-prefetch), а не
  паттерну `/dashboard`.
- Layout `apps/frontend/app/(private)/layout.tsx` уже выполняет `getMe()`, ролевой
  редирект на 401/403/413 и передаёт `user` в `SidebarNav` как проп — новая страница
  переиспользует этот layout, роль пользователя получает через тот же `getMe()` или
  через уже загруженный `user`, если Next дальше прокинет его серверным компонентам
  (см. Decisions).
- UI-примитивов для табличных списков, бейджей статуса, вкладок и диалогов в
  `apps/frontend/src/components/ui/` пока нет (есть только `button`, `input`,
  `label`) — их нужно добавить в рамках этой фичи.

## Goals / Non-Goals

**Goals:**
- Реализовать страницу `/corrections/[id]` со всеми блоками из `proposal.md` и
  ролевым/статусным поведением из `specs/correction-detail-page/spec.md`.
- Переиспользовать существующий Kubb-клиент без изменения `api/src/openapi.yaml`.
- Ввести минимальный набор переиспользуемых UI-примитивов (бейдж статуса, таблица,
  диалог формы замечания/возврата), которыми затем смогут пользоваться другие
  экраны корректировок (список корректировок и т.п.) — без излишнего дизайна системы
  компонентов сверх нужд этой карточки.

**Non-Goals:**
- Экран списка корректировок (`/corrections`) и его фильтры — не входят в эту фичу.
- Уведомления (центр нотификаций) — отдельный параллельный change
  `openspec/changes/notifications-center/`, не пересекается с этой страницей кроме
  того, что клик по уведомлению может вести на `/corrections/[id]` (интеграция не
  требует изменений здесь — маршрут уже соответствует ожидаемому формату).
- Изменение `api/src/openapi.yaml` — контракт уже полный, задача 1.1 только
  подтверждает это и перегенерирует клиент при необходимости.
- Мобильная адаптация сверх уже принятых брейкпоинтов `sidebar-nav` — экран
  проектируется desktop-first, как и остальной приватный контур на сегодня.

## Decisions

### Данные: RSC-prefetch + клиентские Suspense-хуки (следуем ADR, не паттерну /dashboard)
Используем `apps/frontend/packages/api/base/codegen/hooks/correctionsController/
useGetCorrectionSuspense.ts` (`getCorrectionSuspenseQueryOptions`,
`getCorrectionSuspenseQueryKey`) в связке с `getQueryClient()` +
`prefetchQuery`/`dehydrate` в `page.tsx` (RSC) и `HydrationBoundary` в клиентском
дереве, как описано в `docs/adr/frontend-data-fetching.md`. Клиентский компонент
карточки читает данные через `useGetCorrectionSuspense({ humanId })`.

Альтернатива — скопировать паттерн `/dashboard` (fetch в RSC, пропсы вниз без
клиентского стора) — отклонена: после каждой мутации (загрузка файла, согласование,
возврат, повторное направление, отметка/удаление замечания) экран должен
консистентно обновить один и тот же объект `CorrectionDetail` без ручного
prop-drilling и повторной server-side навигации; TanStack Query даёт единый
query-key для инвалидации всех мутаций.

### Мутации: один хук-обёртка на действие, инвалидация по `getCorrectionSuspenseQueryKey`
Каждое действие («Направить», «Согласовать», «Вернуть», «Направить в ДТОиР»,
«Загрузить версию», «Отметить исправленным», «Удалить замечание», «Перенаправить»,
«Повторно направить в ДТОиР») использует уже сгенерированный Kubb-мутационный хук
(`useReturnCorrectionByCfo`, `useApproveCorrectionByCfo`, `useSendCorrectionToDtoe`,
`useResubmitCorrection`, и т.д. — полный список в задаче 3.3) и по `onSuccess`
инвалидирует `getCorrectionSuspenseQueryKey({ humanId })`, без ручного оптимистичного
обновления кэша — эндпоинты уже возвращают полный `CorrectionDetail`, поэтому проще и
надёжнее использовать `setQueryData` ответом мутации, чем поддерживать отдельную
optimistic-логику.

### Видимость блоков и guard-условия — чистые функции от `CorrectionDetail`
`CorrectionDetail` уже содержит вычисленные бэкендом флаги (`isFilialOwner`,
`isCfoReviewer`, `isDtoe`, `myCfoStatus`, `packageComplete`, `missingRequirements`,
`availableCfos`, `returnedCfos`, `myOpenRemarksCount`). Видимость блоков и
активность кнопок на фронте вычисляются как чистые функции от этих полей и статуса
корректировки/замечаний (`apps/frontend/app/(private)/corrections/[id]/lib/
permissions.ts` — новый файл), без дублирования бизнес-правил, уже посчитанных
бэкендом. Это соответствует правилу `apps/frontend/AGENTS.md`: guard-условия на
фронте дублируют бэкенд для UX, но не являются защитой — реальная проверка при
любой мутации выполняется бэкендом и обрабатывается как 403/409-ошибка.

### Компоновка блоков — один клиентский компонент на блок из proposal.md
`apps/frontend/app/(private)/corrections/[id]/components/`:
`correction-header.tsx`, `package-completeness.tsx`, `cfo-statuses.tsx`,
`remarks-list.tsx`, `resubmit-panel.tsx`, `history-log.tsx` — каждый получает уже
загруженный `CorrectionDetail` через `useGetCorrectionSuspense` (без повторных
запросов), что проще, чем спускать пропсами через родителя, и совпадает с
Suspense-моделью ADR (каждый вложенный компонент может сам подписаться на тот же
query без лишнего re-fetch благодаря общему кэшу).

### Новые UI-примитивы — минимальный набор, без дизайн-системы поверх задачи
Добавляем в `apps/frontend/src/components/ui/`: `badge/` (цветной бейдж статуса),
`table/` (для списков слотов/ЦФО/замечаний/истории), `dialog/` (форма замечания при
возврате, форма реопена). Как и `button`/`input`/`label`, используем стилизацию
Tailwind 4 (`tw:`), без сторонней UI-библиотеки — проект её пока не использует нигде.

## API Shape

Контракт не меняется. Задача 1.1 в `tasks.md` подтверждает актуальность против
текущего кода бэкенда и, если типы в `apps/frontend/packages/api/base/codegen/`
устарели относительно `api/src/openapi.yaml`, перегенерирует клиент штатной
codegen-командой Kubb (без ручного редактирования `codegen/`).

Задействованные существующие эндпоинты (все — `api/src/paths/corrections-*.yaml`,
без изменений):

| Метод | Путь | Роль | Назначение |
|---|---|---|---|
| GET | `/corrections/{humanId}` | все три | детальная карточка (`CorrectionDetail`) |
| POST | `/corrections/{humanId}/slots/{slotId}/files` | Филиал | загрузка версии файла в слот |
| POST | `/corrections/{humanId}/send` | Филиал | направление на проверку выбранным ЦФО |
| POST | `/corrections/{humanId}/resubmit` | Филиал | повторное направление вернувшим ЦФО |
| POST | `/corrections/{humanId}/send-to-dtoe` | ЦФО | направление в ДТОиР |
| POST | `/corrections/{humanId}/resubmit-to-dtoe` | Филиал | повторное направление в ДТОиР |
| POST | `/corrections/{humanId}/cfo-approve` | ЦФО | согласование от лица ЦФО |
| POST | `/corrections/{humanId}/cfo-return` | ЦФО | возврат с замечанием от ЦФО |
| POST | `/corrections/{humanId}/dtoe-approve` | ДТОиР | финальное согласование |
| POST | `/corrections/{humanId}/dtoe-return` | ДТОиР | возврат с замечанием от ДТОиР |
| POST | `/corrections/{humanId}/remarks/{remarkId}/fix` | Филиал | отметить замечание исправленным |
| POST | `/corrections/{humanId}/remarks/{remarkId}/reopen` | ЦФО/ДТОиР | вернуть замечание в OPEN (см. Open Questions) |
| DELETE | `/corrections/{humanId}/remarks/{remarkId}` | автор замечания | удаление своего OPEN-замечания |
| GET | `/files/{id}/download` | все три (по доступу к корректировке) | скачивание версии файла |

Обратная совместимость: не затронута, эндпоинты существуют и используются впервые
только этим фронтендом.

## Backend

Не затрагивается. Вся необходимая логика (`corrections.controller.ts`,
`corrections.service.ts`, guard-условия статусной модели) уже реализована и
соответствует `apps/backend/AGENTS.md`. Задач в `## Backend` секции `tasks.md`,
кроме верификационных, нет.

## Frontend

Новые файлы (полные пути от корня монорепозитория):

- `apps/frontend/app/(private)/corrections/[id]/page.tsx` — RSC: `getMe()`,
  `prefetchQuery(getCorrectionSuspenseQueryOptions({ humanId: params.id }))`,
  `dehydrate`, рендерит `<HydrationBoundary>` с клиентским деревом карточки.
- `apps/frontend/app/(private)/corrections/[id]/components/correction-detail-view.tsx`
  — `"use client"`, компонует блоки, читает `useGetCorrectionSuspense`.
- `.../components/correction-header.tsx`, `package-completeness.tsx`,
  `cfo-statuses.tsx`, `remarks-list.tsx`, `resubmit-panel.tsx`, `history-log.tsx`.
- `.../lib/permissions.ts` — чистые функции видимости блоков/активности кнопок по
  роли и статусам (описаны в Decisions).
- `.../lib/status-labels.ts` — маппинг статусов корректировки/ЦФО/замечания на
  текст и цвет бейджа (используется в `correction-header.tsx`, `cfo-statuses.tsx`,
  `remarks-list.tsx`).
- `apps/frontend/src/components/ui/badge/`, `table/`, `dialog/` — новые примитивы.

Изменённые файлы: нет (страница — новый изолированный маршрут, `layout.tsx` и
`sidebar-nav` не меняются — ссылка на карточку добавляется отдельно списком
корректировок вне этой фичи или напрямую по URL).

## Files / Owners

| Область | Файлы | Владелец |
|---|---|---|
| API | `api/src/openapi.yaml` (без изменений, только проверка) | автор change |
| Backend | — (нет задач) | — |
| Frontend | `apps/frontend/app/(private)/corrections/[id]/**`, `apps/frontend/src/components/ui/{badge,table,dialog}/**` | автор change |

## Readiness Decision

**ready** — контракт (`api/src/openapi.yaml`) и его backend-реализация уже
существуют и не требуют изменений; задача 1.1 лишь формально это подтверждает.
Frontend-задачи не заблокированы ожиданием API-работы.

## Тестовая стратегия

- Риск фичи: **P0** (см. `proposal.md` — Влияние на качество).
- TDD-порядок по каждому блоку: сначала failing component-тест на guard-условие
  видимости/активности (`lib/permissions.unit.test.ts` — unit для чистых функций,
  `*.component.test.tsx` — для рендера кнопок/блоков) → минимальная реализация
  компонента → green → refactor. Для трёх ключевых сквозных маршрутов (направление
  филиалом, согласование/возврат ЦФО, финальное согласование ДТОиР) — сначала
  failing E2E (`apps/frontend/e2e/correction-detail.e2e.spec.ts`) по паттерну
  `apps/frontend/e2e/dashboard.e2e.spec.ts` (хелпер `login(page, email)`).
- Frontend Unit (Vitest node, `*.unit.test.ts`): `lib/permissions.ts` (видимость
  блоков и активность кнопок по всем комбинациям роли/статуса из spec),
  `lib/status-labels.ts` (маппинг статус → текст/цвет).
- Frontend Component (Vitest Browser Mode + Playwright, `*.component.test.tsx`, по
  паттерну `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx`
  — мокать сгенерированные Kubb-хуки через `vi.mock`/`vi.hoisted`): каждый блок
  карточки — рендер данных, disabled/hidden состояния кнопок, вызов мутации при
  клике, форма замечания при возврате ЦФО/ДТОиР.
- Frontend E2E (Playwright, `apps/frontend/e2e/correction-detail.e2e.spec.ts`):
  happy path «Филиал загружает пакет → направляет ЦФО → ЦФО согласовывает → ЦФО
  направляет в ДТОиР → ДТОиР согласовывает» и negative path «ЦФО возвращает с
  замечанием → Филиал не может перенаправить, пока замечание открыто → отмечает
  исправленным → перенаправляет».
- Моки/фикстуры: typed-фикстуры `CorrectionDetail` на все статусы, используемые в
  сценариях (`DRAFT`, `UNDER_CFO_REVIEW`, `PARTIALLY_APPROVED`,
  `RETURNED_FOR_REVISION`, `ALL_CFO_APPROVED`, `UNDER_DTOE_REVIEW`,
  `RETURNED_BY_DTOE`, `APPROVED_BY_DTOE`) — строятся из сгенерированных Kubb/Zod
  типов (`apps/frontend/packages/api/base/codegen/types/`), не free-form JSON.
- Роли для E2E: тестовые пользователи `FILIAL`, `CFO`, `DTOE` — переиспользуются
  сидовые аккаунты, уже используемые в `apps/frontend/e2e/dashboard.e2e.spec.ts`.
- Verification gates: `bun run typecheck`, `bun run lint`, `bun run test` (unit +
  component), `bun run build`, точечный E2E-прогон новой спеки.

## Risks / Trade-offs

- [Riск] Ролевая матрица и статусная модель дублируются во фронтовых guard-функциях
  и могут разойтись с бэкендом при будущих изменениях статусной модели →
  Митигация: guard-функции читают уже вычисленные бэкендом флаги
  (`isFilialOwner`/`isCfoReviewer`/`isDtoe`/`myCfoStatus`) вместо пересчёта роли из
  сырых данных, и любое расхождение проявляется как 403/409 от мутации, а не как
  тихая ошибка состояния.
- [Риск] Открытый вопрос в `apps/backend/AGENTS.md` про инициатора «Повторно
  направить в ДТОиР» уже снят наблюдением кода (`corrections.service.ts:766` —
  разрешено только `Role.FILIAL`, владельцу корректировки) → зафиксировано в
  `API Shape` и в specs как действие филиала.
- [Риск] Отсутствие UI-примитивов таблицы/бейджа/диалога в проекте на старте фичи →
  Митигация: минимальный набор примитивов вводится этим же change и переиспользуется
  будущими экранами корректировок, без over-engineering сверх текущих потребностей.

## Open Questions

- Эндпоинт `POST /corrections/{humanId}/remarks/{remarkId}/reopen` присутствует в
  контракте, но не описан ни в `proposal.md`, ни в блоках экрана из присланного
  ЧТЗ. По `apps/backend/src/corrections/dto/remark-reopen.dto.ts` и
  `RemarkReopenInput` это, вероятно, действие проверяющего — «отклонить исправление
  и вернуть замечание в OPEN с новым описанием», отдельное от «Вернуть на
  доработку». Не блокирует эту фичу: страница может не показывать эту кнопку в
  первой итерации (в spec и tasks её не включаем), UI для неё — предмет
  отдельного уточнения продукта и, при необходимости, отдельного small change.
