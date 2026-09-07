# Test Plan: planning-2027-package-review

Риск: **P0**. TDD-порядок: failing test → минимальная реализация → green →
refactor → verification, для каждой строки покрытия ниже.

## Покрытие сценариев

| Requirement / Scenario | Backend тест | Frontend тест | Статус |
|---|---|---|---|
| Создание плана формирует слоты по типу | `planning.service.spec.ts` (`create`) | `create-plan-form.component.test.tsx` | [ ] |
| Только Филиал может создать план | `planning.service.spec.ts` | — (кнопка скрыта не-Филиалу) | [ ] |
| Направление блокируется неполным пакетом | `planning.service.spec.ts` (`send`) + e2e negative | `send-for-review-form.component.test.tsx` (кнопка неактивна) | [ ] |
| Направление ЦФО, не связанному с филиалом, отклоняется | `planning.service.spec.ts` | `send-for-review-form.component.test.tsx` (список ЦФО ограничен) | [ ] |
| Успешное направление нескольким ЦФО | `planning.service.spec.ts` + e2e happy path | `send-for-review-form.component.test.tsx` | [ ] |
| ЦФО не может оставить замечание после решения | `planning.service.spec.ts` | `remarks-list.component.test.tsx` | [ ] |
| ДТОиР не может оставить замечание вне своей проверки | `planning.service.spec.ts` | — | [ ] |
| Возврат ЦФО переводит план в доработку | `planning.service.spec.ts` | `cfo-statuses.component.test.tsx` | [ ] |
| Возврат без открытого замечания отклоняется | `planning.service.spec.ts` | `return-remark-dialog.component.test.tsx` | [ ] |
| Филиал отмечает замечание исправленным | `planning.service.spec.ts` | `remarks-list.component.test.tsx` | [ ] |
| Чужой автор не может удалить замечание | `planning.service.spec.ts` | `remarks-list.component.test.tsx` (кнопка скрыта) | [ ] |
| Автор не может удалить закрытое замечание | `planning.service.spec.ts` | `remarks-list.component.test.tsx` (кнопка неактивна/скрыта) | [ ] |
| Статус согласовавшего ранее ЦФО не сбрасывается | `planning.service.spec.ts` | `cfo-statuses.component.test.tsx` | [ ] |
| Повторная отправка недоступна вне «Возвращён на доработку» | `planning.service.spec.ts` | `send-for-review-form.component.test.tsx` | [ ] |
| Направление в ДТОиР недоступно до согласования всех ЦФО | `planning.service.spec.ts` | `cfo-statuses.component.test.tsx` | [ ] |
| Любой согласовавший ЦФО может направить в ДТОиР | `planning.service.spec.ts` + e2e happy path | `cfo-statuses.component.test.tsx` | [ ] |
| Согласованный план становится неизменяемым | `planning.service.spec.ts` + e2e happy path | `package-completeness.component.test.tsx` (кнопка неактивна) | [ ] |
| Возврат ДТОиР требует хотя бы одного замечания | `planning.service.spec.ts` | `return-remark-dialog.component.test.tsx` | [ ] |
| Филиал повторно направляет план в ДТОиР | `planning.service.spec.ts` | `send-for-review-form.component.test.tsx` | [ ] |
| Филиал не видит чужой план | `planning.service.spec.ts` + e2e negative | — (защита на бэкенде, фронт не рендерит недоступный маршрут) | [ ] |
| ДТОиР видит планы всех филиалов | `planning.service.spec.ts` | `planning-dashboard.component.test.tsx` | [ ] |
| История версий слота сохраняет все загрузки | `planning.service.spec.ts` | `package-completeness.component.test.tsx` (счётчик версий/история) | [ ] |
| Удаление плана не затрагивает корректировки | `planning.service.spec.ts` (проверка отсутствия FK/побочных эффектов) | — | [ ] |

## Тестовые данные

Backend: фикстуры/factory-объекты по образцу `corrections.service.spec.ts`
(мок-репозитории или тестовая БД — по существующему подходу файла).
E2e: seed данные — 4 филиала, 17 ЦФО, `FilialCfoLink` (переиспользуются
существующие сиды `bun run seed`), демо `PlanType`, тестовые пользователи
ролей FILIAL/CFO/DTOE.

Frontend: typed fixtures на основе Kubb-сгенерированных типов
`PlanDetail`/`PlanDocumentSlot`/`PlanRemark`; моки
`vi.mock('@/packages/api/base/codegen', ...)`, `nextNavigationMock` — по
образцу `apps/frontend/app/(private)/corrections/[humanId]/components/**`.

## Verification gates

- [ ] `openspec validate planning-2027-package-review --strict --no-interactive`
- [ ] API: `npm run lint` из `api/` (+ `npm run bundle` при необходимости)
- [ ] Backend: `bun run test`, `bun run test:e2e`, `bun run lint` из `apps/backend`
- [ ] Frontend: `bun run typecheck`, `bun run lint`, `bun run test` из `apps/frontend`
- [ ] `git status --short` не содержит посторонних правок вне объёма change

## Manual / Waiver

Не заведено — все P0-сценарии выше должны быть покрыты автотестами. Если по
факту реализации какой-то сценарий останется без автотеста, здесь фиксируется
явный waiver с обоснованием перед архивированием change.
