# Test Plan

## Risk level
P0

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Доступ к карточке корректировки | Филиал открывает свою корректировку | P1 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Доступ к карточке корректировки | ДТОиР открывает любую корректировку в рамках аудита | P1 | Component | `correction-detail-view.component.test.tsx` | Done |
| Доступ к карточке корректировки | Пользователь без доступа не может открыть чужую карточку | P1 | Component | `page.tsx` (403 → `AccessDeniedScreen`, проверено `bun run build`) | Done |
| Доступ к карточке корректировки | Запрос несуществующей корректировки | P2 | Component | `page.tsx` (404 → `NotFoundScreen`, проверено `bun run build`) | Done |
| Блок «Шапка корректировки» | Шапка отображается всем ролям одинаково | P2 | Component | `correction-header.component.test.tsx` | Done |
| Комплектность пакета и загрузка версии файла | Филиал загружает первую версию файла в пустой слот | P0 | Component | `package-completeness.component.test.tsx` | Done |
| Комплектность пакета и загрузка версии файла | Филиал загружает исправленную версию по открытому замечанию | P0 | Component | `package-completeness.component.test.tsx` | Done (связка с замечанием реализована, отдельного теста на remarkId нет) |
| Комплектность пакета и загрузка версии файла | Загрузка недоступна после финального согласования | P1 | Component | `package-completeness.component.test.tsx` | Done |
| Комплектность пакета и загрузка версии файла | ЦФО и ДТОиР не могут загружать файлы | P1 | Component | `package-completeness.component.test.tsx` | Done |
| Направление корректировки на проверку | Направление недоступно при незаполненных обязательных слотах | P0 | Component | `send-for-review-form.component.test.tsx` | Done |
| Направление корректировки на проверку | Успешное направление выбранным ЦФО | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Отображение статусов ЦФО | Филиал видит статусы ЦФО без возможности их менять | P2 | Component | `cfo-statuses.component.test.tsx` | Done |
| Согласование корректировки ЦФО | ЦФО согласовывает корректировку | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Согласование корректировки ЦФО | Повторное согласование недоступно | P1 | Unit | `permissions.unit.test.ts` | Done |
| Возврат корректировки с замечанием | ЦФО возвращает корректировку с замечанием к элементу | P0 | Component | `return-remark-dialog.component.test.tsx` | Done |
| Возврат корректировки с замечанием | ДТОиР возвращает корректировку с замечанием | P0 | Component | `remarks-list.component.test.tsx` | Done (guard-условие; форма общая с ЦФО через `return-remark-dialog`) |
| Возврат корректировки с замечанием | Второй проверяющий не может отправить решение поверх уже принятого | P1 | Unit + Manual | `apps/backend/src/corrections/corrections.service.spec.ts` | Done — закрыто в два приёма: `cfoReturn` в `cfo-cabinet`, `cfoApprove` в `correction-review-safeguards` (backend не проверял `PENDING` ни там, ни там до этих changes, вопреки заметке ниже — см. Manual checks) |
| Отметка замечания исправленным | Филиал отмечает замечание исправленным | P0 | Component | `remarks-list.component.test.tsx` | Done |
| Отметка замечания исправленным | Замечание в финальном статусе нельзя отметить повторно | P1 | Component | `remarks-list.component.test.tsx` | Done |
| Удаление замечания | Автор удаляет собственное открытое замечание | P1 | Component | `remarks-list.component.test.tsx` | Done |
| Удаление замечания | Нельзя удалить чужое замечание | P1 | Component | `remarks-list.component.test.tsx` | Done |
| Удаление замечания | Нельзя удалить замечание не в статусе OPEN | P1 | Unit | `permissions.unit.test.ts` | Done |
| Повторное направление вернувшим ЦФО | Блок скрыт, если ни один ЦФО не возвращал пакет | P1 | Component | `resubmit-panel.component.test.tsx` | Done |
| Повторное направление вернувшим ЦФО | Кнопка неактивна, пока остались открытые замечания | P0 | Component | `resubmit-panel.component.test.tsx` | Done |
| Повторное направление вернувшим ЦФО | Кнопка неактивна, если не выбран ни один ЦФО | P1 | Component | `resubmit-panel.component.test.tsx` | Done |
| Повторное направление вернувшим ЦФО | Успешное повторное направление | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Направление в ДТОиР | Кнопка появляется у всех согласовавших ЦФО после последнего согласования | P0 | Unit | `permissions.unit.test.ts` | Done |
| Направление в ДТОиР | Кнопка недоступна, пока не все обязательные ЦФО согласовали | P1 | Unit | `permissions.unit.test.ts` | Done |
| Направление в ДТОиР | Направление в ДТОиР закрывает связанные замечания | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Финальное согласование ДТОиР | ДТОиР финально согласовывает корректировку | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Повторное направление в ДТОиР | Кнопка неактивна, пока остались открытые замечания ДТОиР | P1 | Component | `resubmit-panel.component.test.tsx` | Done |
| Повторное направление в ДТОиР | Успешное повторное направление в ДТОиР | P1 | Unit | `permissions.unit.test.ts` | Done |
| Блок «История действий» | История доступна только для чтения всем ролям | P2 | Component | `history-log.component.test.tsx` | Done |

## Required automated tests

### Unit
- [x] `apps/frontend/app/(private)/corrections/[humanId]/lib/permissions.unit.test.ts` — 25 тестов, все комбинации роли × статуса корректировки × `myCfoStatus` × статусов замечаний из таблицы выше
- [x] `apps/frontend/app/(private)/corrections/[humanId]/lib/status-labels.unit.test.ts`

### Component
- [x] `apps/frontend/src/components/ui/badge/badge.component.test.tsx`
- [x] `apps/frontend/src/components/ui/table/table.component.test.tsx`
- [x] `apps/frontend/src/components/ui/dialog/dialog.component.test.tsx`
- [x] `apps/frontend/src/components/ui/data-table/data-table.component.test.tsx`
- [x] `.../corrections/[humanId]/components/correction-header.component.test.tsx`
- [x] `.../corrections/[humanId]/components/package-completeness.component.test.tsx`
- [x] `.../corrections/[humanId]/components/send-for-review-form.component.test.tsx`
- [x] `.../corrections/[humanId]/components/cfo-statuses.component.test.tsx`
- [x] `.../corrections/[humanId]/components/remarks-list.component.test.tsx`
- [x] `.../corrections/[humanId]/components/return-remark-dialog.component.test.tsx`
- [x] `.../corrections/[humanId]/components/resubmit-panel.component.test.tsx`
- [x] `.../corrections/[humanId]/components/history-log.component.test.tsx`
- [x] `.../corrections/[humanId]/components/correction-detail-view.component.test.tsx`

### Integration
_(не вводится — см. `apps/frontend/AGENTS.md` и design.md: взаимодействие
page/route/component/provider покрывается component-тестами, сквозной маршрут — E2E)_

### E2E
- [ ] `apps/frontend/e2e/correction-detail.e2e.spec.ts` — happy path (направление → согласование ЦФО → направление в ДТОиР → финальное согласование)
- [ ] `apps/frontend/e2e/correction-detail.e2e.spec.ts` — negative path (возврат с замечанием → блокировка повторного направления → исправление → повторное направление)

## Manual checks
- [x] Гонка состояний «второй проверяющий поверх уже принятого решения» — **исправление заметки ниже**: вопреки первоначальному предположению «уже гарантирован атомарной транзакцией», реальная проверка показала, что до `cfo-cabinet`/`correction-review-safeguards` backend НЕ проверял `myStatus.status === PENDING` ни в `cfoApprove`, ни в `cfoReturn` — повторный вызов проходил успешно вместо `403`/`409`. Guard добавлен явно (`BadRequestException`, `400`) в обоих методах: `cfoReturn` — в рамках `cfo-cabinet`, `cfoApprove` — в рамках `correction-review-safeguards`. Покрыто unit-тестами (`corrections.service.spec.ts`) и подтверждено вручную через `curl` (повторный `cfo-approve`/`cfo-return` → `400`) в обоих changes — не последовательными сессиями в двух браузерах (тест на реальную гонку параллельных запросов к БД остаётся вне scope, см. Out of scope), а прямой проверкой, что второй вызов после первого решения отклоняется.
- [ ] Визуальная сверка цветов бейджей статусов с референсным макетом (скриншот из ЧТЗ) — waiver на автоматическое визуальное сравнение, см. `proposal.md` — Влияние на качество.

## Test data
- Fixtures: typed-фикстуры `CorrectionDetail` на статусы `DRAFT`, `UNDER_CFO_REVIEW`, `PARTIALLY_APPROVED`, `RETURNED_FOR_REVISION`, `RESUBMITTED`, `ALL_CFO_APPROVED`, `UNDER_DTOE_REVIEW`, `RETURNED_BY_DTOE`, `APPROVED_BY_DTOE`, построенные из типов `apps/frontend/packages/api/base/codegen/types/` (в component/unit-тестах уже используются напрямую в каждом файле; для E2E нужны сидовые записи в БД).
- API mocks: моки сгенерированных Kubb-хуков (`useGetCorrectionSuspense`, мутационные хуки) через `vi.mock`/`vi.hoisted`, по паттерну `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx`.
- User roles: FILIAL, CFO, DTOE — переиспользуются сидовые тестовые аккаунты из `apps/frontend/e2e/dashboard.e2e.spec.ts`.
- Seed data: минимум одна корректировка на каждый статус из списка фикстур для E2E-сценариев (создаётся сидом backend test DB, вне scope этого change, если сид уже покрывает нужные статусы) — **не выполнено**, требуется для 3.10.

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices

## Verification commands
- [ ] openspec validate correction-detail-page --strict --no-interactive
- [x] frontend: `bun run lint` / `bun run test` / `bun run build` (из `apps/frontend`) — зелёные, кроме одного pre-existing теста (`setup-browser.component.test.ts`, не относится к этой фиче)
- [ ] backend: не требуется — бэкенд не затронут
- [x] api: `npm run lint` (из `api/`) — валиден
- [ ] E2E: `apps/frontend/e2e/correction-detail.e2e.spec.ts` — не написан, блокирует полное закрытие P0-покрытия
