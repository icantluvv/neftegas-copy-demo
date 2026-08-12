# Test Plan

## Risk level
P0

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Доступ к карточке корректировки | Филиал открывает свою корректировку | P1 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Доступ к карточке корректировки | ДТОиР открывает любую корректировку в рамках аудита | P1 | Component | `correction-detail-view.component.test.tsx` | Planned |
| Доступ к карточке корректировки | Пользователь без доступа не может открыть чужую карточку | P1 | Component | `correction-detail-view.component.test.tsx` | Planned |
| Доступ к карточке корректировки | Запрос несуществующей корректировки | P2 | Component | `correction-detail-view.component.test.tsx` | Planned |
| Блок «Шапка корректировки» | Шапка отображается всем ролям одинаково | P2 | Component | `correction-header.component.test.tsx` | Planned |
| Комплектность пакета и загрузка версии файла | Филиал загружает первую версию файла в пустой слот | P0 | Component | `package-completeness.component.test.tsx` | Planned |
| Комплектность пакета и загрузка версии файла | Филиал загружает исправленную версию по открытому замечанию | P0 | Component | `package-completeness.component.test.tsx` | Planned |
| Комплектность пакета и загрузка версии файла | Загрузка недоступна после финального согласования | P1 | Component | `package-completeness.component.test.tsx` | Planned |
| Комплектность пакета и загрузка версии файла | ЦФО и ДТОиР не могут загружать файлы | P1 | Component | `package-completeness.component.test.tsx` | Planned |
| Направление корректировки на проверку | Направление недоступно при незаполненных обязательных слотах | P0 | Component | `package-completeness.component.test.tsx` | Planned |
| Направление корректировки на проверку | Успешное направление выбранным ЦФО | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Отображение статусов ЦФО | Филиал видит статусы ЦФО без возможности их менять | P2 | Component | `cfo-statuses.component.test.tsx` | Planned |
| Согласование корректировки ЦФО | ЦФО согласовывает корректировку | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Согласование корректировки ЦФО | Повторное согласование недоступно | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Возврат корректировки с замечанием | ЦФО возвращает корректировку с замечанием к элементу | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Возврат корректировки с замечанием | ДТОиР возвращает корректировку с замечанием | P0 | Component | `remarks-list.component.test.tsx` | Planned |
| Возврат корректировки с замечанием | Второй проверяющий не может отправить решение поверх уже принятого | P1 | Manual | — | Planned (см. Manual checks) |
| Отметка замечания исправленным | Филиал отмечает замечание исправленным | P0 | Component | `remarks-list.component.test.tsx` | Planned |
| Отметка замечания исправленным | Замечание в финальном статусе нельзя отметить повторно | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Удаление замечания | Автор удаляет собственное открытое замечание | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Удаление замечания | Нельзя удалить чужое замечание | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Удаление замечания | Нельзя удалить замечание не в статусе OPEN | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Повторное направление вернувшим ЦФО | Блок скрыт, если ни один ЦФО не возвращал пакет | P1 | Component | `resubmit-panel.component.test.tsx` | Planned |
| Повторное направление вернувшим ЦФО | Кнопка неактивна, пока остались открытые замечания | P0 | Component | `resubmit-panel.component.test.tsx` | Planned |
| Повторное направление вернувшим ЦФО | Кнопка неактивна, если не выбран ни один ЦФО | P1 | Component | `resubmit-panel.component.test.tsx` | Planned |
| Повторное направление вернувшим ЦФО | Успешное повторное направление | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Направление в ДТОиР | Кнопка появляется у всех согласовавших ЦФО после последнего согласования | P0 | Component | `remarks-list.component.test.tsx` | Planned |
| Направление в ДТОиР | Кнопка недоступна, пока не все обязательные ЦФО согласовали | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Направление в ДТОиР | Направление в ДТОиР закрывает связанные замечания | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Финальное согласование ДТОиР | ДТОиР финально согласовывает корректировку | P0 | E2E | `apps/frontend/e2e/correction-detail.e2e.spec.ts` | Planned |
| Повторное направление в ДТОиР | Кнопка неактивна, пока остались открытые замечания ДТОиР | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Повторное направление в ДТОиР | Успешное повторное направление в ДТОиР | P1 | Component | `remarks-list.component.test.tsx` | Planned |
| Блок «История действий» | История доступна только для чтения всем ролям | P2 | Component | `history-log.component.test.tsx` | Planned |

## Required automated tests

### Unit
- [ ] `apps/frontend/app/(private)/corrections/[id]/lib/permissions.unit.test.ts` — все комбинации роли × статуса корректировки × `myCfoStatus` × статусов замечаний из таблицы выше
- [ ] `apps/frontend/app/(private)/corrections/[id]/lib/status-labels.unit.test.ts`

### Component
- [ ] `apps/frontend/src/components/ui/badge/badge.component.test.tsx`
- [ ] `apps/frontend/src/components/ui/table/table.component.test.tsx`
- [ ] `apps/frontend/src/components/ui/dialog/dialog.component.test.tsx`
- [ ] `.../corrections/[id]/components/correction-header.component.test.tsx`
- [ ] `.../corrections/[id]/components/package-completeness.component.test.tsx`
- [ ] `.../corrections/[id]/components/cfo-statuses.component.test.tsx`
- [ ] `.../corrections/[id]/components/remarks-list.component.test.tsx`
- [ ] `.../corrections/[id]/components/resubmit-panel.component.test.tsx`
- [ ] `.../corrections/[id]/components/history-log.component.test.tsx`
- [ ] `.../corrections/[id]/components/correction-detail-view.component.test.tsx`

### Integration
_(не вводится — см. `apps/frontend/AGENTS.md` и design.md: взаимодействие
page/route/component/provider покрывается component-тестами, сквозной маршрут — E2E)_

### E2E
- [ ] `apps/frontend/e2e/correction-detail.e2e.spec.ts` — happy path (направление → согласование ЦФО → направление в ДТОиР → финальное согласование)
- [ ] `apps/frontend/e2e/correction-detail.e2e.spec.ts` — negative path (возврат с замечанием → блокировка повторного направления → исправление → повторное направление)

## Manual checks
- [ ] Гонка состояний «второй проверяющий поверх уже принятого решения» — воспроизвести открытием одной корректировки в двух сессиях ЦФО и отправкой конфликтующих решений; ожидаемый результат — 403/409 у второго запроса. Обоснование ручной проверки: два параллельных браузерных контекста с гонкой сетевых запросов делают автотест на CI нестабильным непропорционально ценности; risk P1, но сценарий уже гарантирован атомарной транзакцией бэкенда (правило 3 и 10 корневого `AGENTS.md`) — фронтенд лишь отображает ошибку.
- [ ] Визуальная сверка цветов бейджей статусов с референсным макетом (скриншот из ЧТЗ) — waiver на автоматическое визуальное сравнение, см. `proposal.md` — Влияние на качество.

## Test data
- Fixtures: typed-фикстуры `CorrectionDetail` на статусы `DRAFT`, `UNDER_CFO_REVIEW`, `PARTIALLY_APPROVED`, `RETURNED_FOR_REVISION`, `RESUBMITTED`, `ALL_CFO_APPROVED`, `UNDER_DTOE_REVIEW`, `RETURNED_BY_DTOE`, `APPROVED_BY_DTOE`, построенные из типов `apps/frontend/packages/api/base/codegen/types/`.
- API mocks: моки сгенерированных Kubb-хуков (`useGetCorrectionSuspense`, мутационные хуки) через `vi.mock`/`vi.hoisted`, по паттерну `apps/frontend/src/components/sidebar-nav/sidebar-nav.component.test.tsx`.
- User roles: FILIAL, CFO, DTOE — переиспользуются сидовые тестовые аккаунты из `apps/frontend/e2e/dashboard.e2e.spec.ts`.
- Seed data: минимум одна корректировка на каждый статус из списка фикстур для E2E-сценариев (создаётся сидом backend test DB, вне scope этого change, если сид уже покрывает нужные статусы).

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices

## Verification commands
- [ ] openspec validate correction-detail-page --strict --no-interactive
- [ ] frontend: `bun run lint` / `bun run test` / `bun run build` (из `apps/frontend`)
- [ ] backend: не требуется — бэкенд не затронут
- [ ] api: `npm run lint` (из `api/`) — подтверждение, что контракт не изменился
- [ ] E2E: `apps/frontend/e2e/correction-detail.e2e.spec.ts`
