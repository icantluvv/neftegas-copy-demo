## 1. API

- [x] 1.1 [api] Подтвердить, что контракт не меняется: `GET /org/correction-types`
  уже описан в `api/src/paths/org-correction-types.yaml` и зарегистрирован в
  `api/src/openapi.yaml` до начала этого change; `npm run lint` из `api/`
  выполнен без ошибок.

## 2. Backend

- [ ] 2.1 [backend] Написать падающий unit-тест `OrgController.findCorrectionTypes`
  / сервисной логики: возвращает все типы без параметра, только активные при
  `isActive=true`, только неактивные при `isActive=false`.
- [x] 2.2 [backend] Реализовать `apps/backend/src/org/org.controller.ts` (`GET
  /org/correction-types`, `FindCorrectionTypesQueryDto`, маппинг через
  `toCorrectionTypeDto` из `corrections.mapper.ts`) и `org.module.ts`
  (`TypeOrmModule.forFeature([CorrectionType])`); зарегистрировать `OrgModule`
  в `apps/backend/src/app.module.ts` — реализация опережает тест 2.1 (не
  соблюдён TDD-порядок, см. `design.md`).
- [ ] 2.3 [backend] Написать падающий e2e-тест (`apps/backend/test/*.e2e-spec.ts`):
  `GET /org/correction-types` без сессии → `401`; с сессией → `200`,
  `isActive=true` возвращает только активные записи.
- [ ] 2.4 [backend] Довести тесты 2.1 и 2.3 до green.
- [x] 2.5 [backend] `npm run lint` и `npm run test` из `apps/backend` — lint: 0
  ошибок в файлах `org/*`; test: существующий набор 15/15 green (новых тестов
  нет, см. 2.1/2.3/2.4).

## 3. Frontend

- [ ] 3.1 [frontend] Падающий component-тест `CorrectionStatsGrid`: рендерит
  плитку с `tone: "warning"` жёлтым текстом, `tone: "danger"` — красным,
  `tone: "success"` — зелёным, `tone: "neutral"`/без `tone` — без цветового
  класса.
- [x] 3.2 [frontend] Реализовать `CorrectionStatsGrid` с полем `tone` (`neutral`
  /`warning`/`success`/`danger`) и подключить в `FilialDashboard` (4 плитки:
  Всего/На проверке/Возвращено/Согласовано ДТОиР) — опережает тест 3.1.
- [ ] 3.3 [frontend] Падающий component-тест `DonutChart`: рендерит сегмент на
  каждую ненулевую группу, скрывает сегменты с нулевым значением, вызывает
  `onSegmentClick` с ключом группы по клику на сегмент и по клику на строку
  легенды, применяет затемнение (`opacity-30`) сегментам, отличным от
  `selectedKey`.
- [x] 3.4 [frontend] Реализовать `DonutChart` (SVG, `stroke-dasharray`/`stroke-dashoffset`,
  без внешних chart-библиотек; раскладка сегментов через `Array.reduce`, без
  мутации переменной в теле рендера — иначе `react-hooks/immutability`
  ESLint-правило падает, см. историю правок) — опережает тест 3.3.
- [ ] 3.5 [frontend] Падающий component-тест `FilialCorrectionsOverview`:
  пустое состояние при пустом списке корректировок; фильтр по группе сужает
  таблицу; клик по сегменту графика устанавливает фильтр; повторный клик по
  тому же сегменту сбрасывает фильтр в «все статусы»; кнопка «Открыть» в
  строке ведёт на `/corrections/{humanId}`.
- [x] 3.6 [frontend] Реализовать `FilialCorrectionsOverview` (`useGetCorrections`
  с `pageSize: 100`, клиентская группировка `STAGE_GROUPS`, клиентская
  фильтрация без повторного запроса, таблица через `DataTable`) — опережает
  тест 3.5.
- [ ] 3.7 [frontend] Падающий component-тест `CreateCorrectionForm`: кнопка
  «Создать» неактивна без выбранного типа; список типов заполняется из
  `useGetCorrectionTypes`; успешное создание переводит на
  `/corrections/{humanId}`; «Отмена» переводит на `/dashboard` без мутации.
- [x] 3.8 [frontend] Реализовать `apps/frontend/app/(private)/corrections/create/page.tsx`
  (серверный guard по роли — `getMe()` + `AccessDeniedScreen` для не-FILIAL) и
  `components/create-correction-form.tsx` — опережает тест 3.7.
- [x] 3.9 [frontend] Добавить ролезависимый `NavItem.roles` в
  `apps/frontend/app/(private)/constants.ts` и фильтрацию по `user.role` в
  `apps/frontend/src/components/sidebar-nav/sidebar-nav.tsx`; пункт «Создать
  корректировку» виден только роли FILIAL.
- [ ] 3.10 [frontend] Падающий component-тест `SidebarNav`: пункт «Создать
  корректировку» отображается для роли FILIAL и отсутствует для CFO/DTOE.
- [x] 3.11 [frontend] Побочный рефакторинг: перенести
  `apps/frontend/app/(private)/corrections/[humanId]/lib/status-labels.ts`
  (+ `.unit.test.ts`) в `apps/frontend/app/(private)/lib/status-labels.ts` —
  теперь общий для `/dashboard` и `/corrections/[humanId]`; обновлены 3
  импорта в `corrections/[humanId]/components/*.tsx`. Существующий
  unit-тест (3 кейса) продолжает проходить на новом месте.
- [x] 3.12 [frontend] `npx tsc --noEmit` (0 ошибок) и `bun run lint` (0 ошибок
  в затронутых файлах) из `apps/frontend`.
- [ ] 3.13 [frontend] `bun run test` для новых `*.component.test.tsx` (не
  созданы, см. 3.1/3.3/3.5/3.7/3.10) и `apps/frontend/e2e/*.e2e.spec.ts` для
  сценария «создать корректировку через дашборд» (не создан) — заблокировано:
  в dev-контейнере нет установленного Chromium для Vitest Browser Mode /
  Playwright (см. `proposal.md`, waiver).
- [x] 3.14 [frontend] `bun run test` для существующего unit-набора (39/39
  green, включая перенесённый `status-labels.unit.test.ts`) — component/E2E
  часть пропущена по причине из 3.13.

## 4. Верификация и завершение

- [ ] 4.1 [openspec] `openspec validate filial-corrections-overview --strict --no-interactive`.
- [ ] 4.2 [root] Написать недостающие тесты (2.1, 2.3, 3.1, 3.3, 3.5, 3.7,
  3.10) либо оформить по каждому явный waiver в `test-plan.md` с
  обоснованием — обязательно для P1 перед архивацией change.
- [ ] 4.3 [root] Установить Chromium в dev-образ frontend (`bunx playwright
  install` или добавить в `apps/frontend/Dockerfile`), чтобы component/E2E
  тесты вообще можно было прогонять в этом окружении — блокирует 3.13 и все
  будущие фронтенд component/E2E задачи, не только этого change.
- [ ] 4.4 [root] Продуктовое решение по открытым вопросам ЧТЗ (`docs/tz/filial-cabinet.md`,
  раздел 8, включая пункт 6 — семантика переключателя роли в шапке,
  добавленный в ЧТЗ после первой версии этого change) и по Open Questions
  `design.md` — вне зоны ответственности реализации.
- [ ] 4.5 [frontend] После ответа заказчика на открытый вопрос ЧТЗ (раздел 8,
  пункт 6 / раздел 7.3): реализовать переключатель роли в шапке
  (`(private)/layout.tsx` или `sidebar-nav.tsx`) — новый компонент,
  backend-эндпоинт со списком доступных пользователю филиалов/ролей (сейчас
  не существует ни в `api/src/openapi.yaml`, ни в `apps/backend`), обработчик
  выбора пункта (перезагрузка данных на месте либо переход в другой кабинет —
  зависит от ответа). Не начинать без явного продуктового решения (4.4).
