# Test Plan: fact-package-review

Риск: **P0**. TDD-порядок: failing test → минимальная реализация → green →
refactor → verification, для каждой строки покрытия ниже.

## Покрытие сценариев

| Requirement / Scenario | Backend тест | Frontend тест | Статус |
|---|---|---|---|
| Каталог форм направления КР ХС сокращён | `fact-form-catalog` (unit, в `fact-packages.mapper.spec.ts` или отдельный `fact-form-catalog.spec.ts`) | `direction-tabs.component.test.tsx` | [ ] |
| Каталог форм ДО/ТОиР/КР ПД полный | как выше | `direction-tabs.component.test.tsx` | [ ] |
| Факт-пакет — один пакет на Филиал×Направление, повторная отправка не создаёт новый | `fact-packages.service.spec.ts` (submit после RETURNED_FOR_REVISION) | — | [ ] |
| Первое обращение создаёт факт-пакет автоматически | `fact-packages.service.spec.ts` (`getOrCreateByDirection`) + `fact-packages.e2e-spec.ts` | — | [ ] |
| Направление доступно при неполном пакете (полная комплектация не требуется) | `fact-packages.e2e-spec.ts` | `fact-submit-panel.component.test.tsx` (кнопка активна) | [x] |
| Направление ЦФО, не связанному с филиалом, отклоняется | `fact-packages.service.spec.ts` | `submit-panel.component.test.tsx` (список ЦФО ограничен) | [ ] |
| Успешное направление нескольким ЦФО | `fact-packages.service.spec.ts` + e2e happy path | `submit-panel.component.test.tsx` | [ ] |
| ЦФО не может оставить замечание после решения | `fact-packages.service.spec.ts` | `remarks-list.component.test.tsx` | [ ] |
| Замечание ЦФО переводит пакет в доработку | `fact-packages.service.spec.ts` | — | [ ] |
| ДТОиР не может оставить замечание вне своей проверки | `fact-packages.service.spec.ts` | — | [ ] |
| Филиал отмечает замечание исправленным | `fact-packages.service.spec.ts` | `remarks-list.component.test.tsx` | [ ] |
| Чужой автор не может удалить замечание | `fact-packages.service.spec.ts` | `remarks-list.component.test.tsx` (кнопка скрыта) | [ ] |
| Автор не может удалить закрытое замечание | `fact-packages.service.spec.ts` | `remarks-list.component.test.tsx` (кнопка неактивна/скрыта) | [ ] |
| Повторная отправка блокируется неисправленными замечаниями | `fact-packages.service.spec.ts` + e2e negative path | `submit-panel.component.test.tsx` | [ ] |
| Статус согласовавшего ранее ЦФО не сбрасывается | `fact-packages.service.spec.ts` | `cfo-statuses` (если покрывается) | [ ] |
| Направление в ДТОиР недоступно до согласования всех ЦФО | `fact-packages.service.spec.ts` | `cfo-statuses.component.test.tsx` | [ ] |
| Любой согласовавший ЦФО может направить в ДТОиР | `fact-packages.service.spec.ts` + e2e happy path | `cfo-statuses.component.test.tsx` | [ ] |
| Согласованный факт-пакет становится неизменяемым | `fact-packages.service.spec.ts` + e2e happy path | `forms-table.component.test.tsx` (кнопка неактивна) | [ ] |
| Возврат ДТОиР требует хотя бы одного замечания | `fact-packages.service.spec.ts` | `final-decision-panel.component.test.tsx` | [ ] |
| Филиал не видит чужой факт-пакет | `fact-packages.service.spec.ts` + e2e negative path | — (защита на бэкенде, фронт не рендерит недоступный маршрут) | [ ] |
| ДТОиР видит факт-пакеты всех филиалов | `fact-packages.service.spec.ts` | — | [ ] |
| История версий формы сохраняет все загрузки | `fact-packages.service.spec.ts` | `forms-table.component.test.tsx` (счётчик версий/история) | [ ] |

## Тестовые данные

Backend: фикстуры/factory-объекты по образцу `corrections.service.spec.ts`
(мок-репозитории или тестовая БД — по существующему подходу файла).
E2e: seed данные — 4 филиала, 17 ЦФО, `FilialCfoLink` (переиспользуются
существующие сиды `bun run seed`), тестовые пользователи ролей
FILIAL/CFO/DTOE.

Frontend: typed fixtures на основе Kubb-сгенерированных типов
`FactPackageDetail`/`FactForm`/`FactPackageRemark`; моки
`vi.mock('@/packages/api/base/codegen', ...)`, `nextNavigationMock` — по
образцу `apps/frontend/app/(private)/corrections/[humanId]/components/**`.

## Verification gates

- [ ] `openspec validate fact-package-review --strict --no-interactive`
- [ ] API: `npm run lint` из `api/` (+ `npm run bundle` при необходимости)
- [ ] Backend: `bun run test`, `bun run test:e2e`, `bun run lint` из `apps/backend`
- [ ] Frontend: `bun run typecheck`, `bun run lint`, `bun run test` из `apps/frontend`
- [ ] `git status --short` не содержит посторонних правок вне объёма change

## Manual / Waiver

Не заведено — все P0-сценарии выше должны быть покрыты автотестами. Если по
факту реализации какой-то сценарий останется без автотеста, здесь фиксируется
явный waiver с обоснованием перед архивированием change.
