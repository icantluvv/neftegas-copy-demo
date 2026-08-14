# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Плитки статистики на дашборде филиала | Плитки показывают статистику филиала | P1 | Component | — | **Not covered** — план: `correction-stats-grid.component.test.tsx` |
| Распределение корректировок по этапам на дашборде филиала | График показывает 4 группы с числом каждой | P1 | Component | — | **Not covered** — план: `donut-chart.component.test.tsx` |
| Фильтр таблицы корректировок по укрупнённой группе | Выбор группы в фильтре сужает таблицу | P1 | Component | — | **Not covered** — план: `filial-corrections-overview.component.test.tsx` |
| Фильтр таблицы корректировок по укрупнённой группе | Клик по сегменту графика выставляет фильтр | P1 | Component | — | **Not covered** |
| Фильтр таблицы корректировок по укрупнённой группе | Повторный клик по тому же сегменту сбрасывает фильтр | P2 | Component | — | **Not covered** |
| Таблица «Мои корректировки» | Таблица показывает список корректировок филиала | P1 | Component | — | **Not covered** |
| Таблица «Мои корректировки» | Кнопка «Открыть» переходит на карточку корректировки | P0 | E2E | — | **Not covered** — план: `apps/frontend/e2e/filial-dashboard.e2e.spec.ts` |
| Таблица «Мои корректировки» | Пустое состояние при отсутствии корректировок | P2 | Component | — | **Not covered** |
| Кнопка «Создать корректировку» на дашборде филиала | Кнопка ведёт на экран создания | P1 | Component | — | **Not covered** |
| Экран создания корректировки | Кнопка «Создать» неактивна без выбранного типа | P1 | Component | — | **Not covered** — план: `create-correction-form.component.test.tsx` |
| Экран создания корректировки | Создание корректировки переводит на её карточку | P0 | E2E | — | **Not covered** |
| Экран создания корректировки | Кнопка «Отмена» возвращает без создания | P2 | Component | — | **Not covered** |
| Экран создания корректировки | Роль без прав не может открыть экран создания | P1 | Manual | — | Done (manual) — проверено `getMe()`-guard в коде `create/page.tsx`; ручной HTTP-обход роли не выполнялся |
| Список типов корректировок | Список типов корректировок возвращается авторизованному пользователю | P0 | Manual (curl) | — | Done (manual) — `GET /org/correction-types` под сессией `filial.donbassgaz@demo.local` вернул `200` с корректной формой ответа |
| Список типов корректировок | Фильтрация по активности | P2 | Manual (curl) | — | Done (manual) — `?isActive=true` проверен тем же curl-запросом |
| Список типов корректировок | Неавторизованный запрос отклоняется | P1 | Manual | — | **Not covered** — не проверялось явно без cookie в этой сессии (глобальный `SessionAuthGuard` покрывает по аналогии с остальными эндпоинтами) |
| Пункты меню навигации в сайдбаре (MODIFIED) | Пункт «Создать корректировку» виден роли FILIAL | P1 | Component | — | **Not covered** |
| Пункты меню навигации в сайдбаре (MODIFIED) | Пункт «Создать корректировку» не виден ролям ЦФО и ДТОиР | P1 | Component | — | **Not covered** |

## Required automated tests

### Unit
- [ ] Backend: `OrgController`/сервисная логика — `isActive` фильтрация (true/false/не задан).
- [ ] Frontend: не применимо отдельным unit-уровнем — вся новая логика (группировка статусов, синхронизация фильтра) покрывается на component-уровне.

### Component
- [ ] `CorrectionStatsGrid` — цвет значения по `tone`.
- [ ] `DonutChart` — сегменты, скрытие нулевых, клик → `onSegmentClick`, затемнение невыбранных.
- [ ] `FilialCorrectionsOverview` — пустое состояние, фильтрация по группе, синхронизация клика по графику и фильтра, кнопка «Открыть».
- [ ] `CreateCorrectionForm` — валидация кнопки «Создать», заполнение списка типов, редирект после создания, «Отмена».
- [ ] `SidebarNav` — ролезависимая видимость пункта «Создать корректировку».

### Integration
_(не вводится отдельный frontend integration-уровень — см. `design.md` родительского процесса)_

### E2E
- [ ] Happy path: `/dashboard` → «+ Создать корректировку» → выбор типа → «Создать» → карточка `/corrections/{humanId}` открыта, новая корректировка видна в списке при возврате на `/dashboard`.

### Backend
- [ ] `OrgController.findCorrectionTypes` unit (см. Unit выше).
- [ ] `GET /org/correction-types` e2e: 401 без сессии, 200 с сессией, фильтр `isActive`.

## Manual checks (выполнены в ходе реализации)
- [x] `POST /auth/login` → `GET /org/correction-types?isActive=true` под
  `filial.donbassgaz@demo.local` — `200`, тело содержит существующий тип
  «Стандартная корректировка программы».
- [x] `POST /corrections` (`{"correctionTypeId":1}`) → `GET /corrections?pageSize=100` —
  созданная корректировка `COR-000001` присутствует в ответе с полями,
  ожидаемыми компонентом таблицы (`correctionType.name`, `stageNote`,
  `status`, `humanId`).
- [x] SSR-разметка `/dashboard` под `filial.donbassgaz@demo.local` (`curl` с
  сессионной cookie) содержит заголовок «Мои корректировки» и текстовые узлы
  плиток статистики.
- [x] SSR-разметка `/corrections/create` под тем же аккаунтом содержит форму
  выбора типа; под неавторизованной cookie `/corrections/create` не
  проверялась отдельно (полагается на общий `PrivateLayout`-редирект,
  общий для всех приватных маршрутов).

## Gaps (честно, без автотестов на момент фиксации)

Весь новый UI-код (`CorrectionStatsGrid` с `tone`, `DonutChart`,
`FilialCorrectionsOverview`, `CreateCorrectionForm`, ролезависимый
`SidebarNav`) и новый backend-код (`OrgController`) написаны без
автоматизированных тестов — только `tsc --noEmit`/`eslint` (статические
проверки) и ручная HTTP/SSR-проверка ключевых путей. Это блокирует
архивацию change по правилу `openspec/config.yaml` («для P0/P1 отсутствие
покрытия блокирует завершение change») до выполнения задач 4.2–4.3 из
`tasks.md`.

## Test data
- Существующие backend seed-аккаунты (`apps/backend/src/database/seed.ts`):
  4 филиала × 17 ЦФО, по одному FILIAL/CFO-аккаунту на каждый + `dtoe@demo.local`/`admin@demo.local`.
- Для ручной проверки использован `filial.donbassgaz@demo.local` / `Password123`.
- Тип корректировки: единственный сидируемый — «Стандартная корректировка программы» (id 1).

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- Полный `org`-CRUD (см. `proposal.md`, «Вне области»)
- Карточка корректировки и точки сопряжения с ЦФО (уже реализованы отдельно, не входят в этот change)

## Verification commands
- [ ] `openspec validate filial-corrections-overview --strict --no-interactive`
- [x] frontend: `bunx tsc --noEmit -p tsconfig.json` (0 ошибок)
- [x] frontend: `bun run lint` на затронутых файлах (0 ошибок)
- [x] frontend: `bun run test` (39/39 unit green; component/E2E не прогонялись — нет Chromium в окружении)
- [ ] frontend: `bun run build`
- [x] backend: `npx tsc --noEmit` (0 ошибок)
- [x] backend: `npx eslint` на затронутых файлах (0 ошибок)
- [x] backend: `npm test` (15/15 green, существующий набор — новых тестов нет)
- [ ] backend: `npm run test:e2e`
- [x] api: `npm run lint` (контракт не менялся, проверка пройдена ранее)
