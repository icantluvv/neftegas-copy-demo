# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Доступ к форме смены типа | Автор открывает форму смены типа своего черновика | P1 | Manual | curl + SSR HTML check (4.1) | Done |
| Доступ к форме смены типа | Форма недоступна после направления на проверку | P1 | Manual | curl + SSR HTML check (4.1) | Done |
| Доступ к форме смены типа | Форма недоступна другой роли и чужому филиалу | P1 | Component | `edit-correction-type-form.component.test.tsx` (не написан) | Planned |
| Единственное поле формы — тип корректировки | Сохранение того же типа не выполняет действие | P2 | Manual + Component | curl no-op проверка (4.1); component-тест планируется | Manual done, Component planned |
| Реконсиляция слотов пакета при смене типа | Смена типа удаляет слоты и файлы прежнего типа | P0 | Unit | `corrections.service.spec.ts` (не написан, 2.5) | Planned — заблокировано отсутствием второго типа в сиде |
| Реконсиляция слотов пакета при смене типа | Смена на тот же тип не изменяет данные | P1 | Manual | curl no-op проверка (4.1) | Done |
| Guard-условия смены типа на бэкенде | Бэкенд отклоняет смену типа у направленной корректировки | P0 | Manual | curl проверка на COR-000001 (`400`) (4.1) | Done |

## Required automated tests

### Unit
- [ ] `apps/backend/src/corrections/corrections.service.spec.ts` — `updateCorrectionType`: guard 403/400/404, реконсиляция слотов между двумя типами, no-op при том же типе, сохранность общего слота

### Component
- [ ] `apps/frontend/app/(private)/corrections/[humanId]/edit/components/edit-correction-type-form.component.test.tsx`

### Integration
_(не вводится — см. `apps/frontend/AGENTS.md`)_

### E2E
- [ ] `apps/frontend/e2e/correction-type-edit.e2e.spec.ts` — happy path смены типа

## Manual checks
- [x] Полный цикл через `curl` под `filial.donbassgaz@demo.local`: создание черновика → смена на тот же тип (no-op) → смена на несуществующий тип (`404`) → смена типа у не-`DRAFT` корректировки (`400`) → удаление тестового черновика
- [x] SSR-страница `/corrections/{humanId}/edit`: `200` с формой для владельца-черновика; «Доступ запрещён» для не-`DRAFT`
- [x] Ссылка «Изменить тип» на карточке: видна для `DRAFT`-владельца, отсутствует для направленной корректировки
- [ ] Реконсиляция слотов между двумя РАЗНЫМИ типами — блокировано отсутствием второго активного `CorrectionType` в демо-сиде

## Test data
- Fixtures: для unit-тестов реконсиляции нужны два `CorrectionType` с разными `PackageRequirement` — на момент реализации в демо-сиде существует только один активный тип.
- API mocks: моки Kubb-хуков (`useChangeCorrectionType`, `useGetCorrectionTypes`) для component-тестов по паттерну `create-correction-form.component.test.tsx`, если он существует, либо `sidebar-nav.component.test.tsx`.
- User roles: FILIAL (владелец и не-владелец), CFO, DTOE — для проверки guard «недоступно другой роли/чужому филиалу».
- Seed data: минимум одна корректировка в статусе `DRAFT` и одна не в `DRAFT`, принадлежащие одному филиалу.

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- Подтверждающий диалог перед потерей файлов сверх текстового предупреждения — не специфицировано ЧТЗ

## Verification commands
- [ ] openspec validate correction-type-edit --strict --no-interactive
- [x] frontend: `npx tsc --noEmit` — чисто
- [x] frontend: `bun run lint` — без новых ошибок
- [ ] frontend: `bun run test` (component) — блокируется написанием 3.5
- [ ] frontend: `bun run build`
- [x] backend: `npx tsc --noEmit` — чисто
- [x] backend: `bun run lint` — без новых ошибок
- [ ] backend: `bun run test` — блокируется написанием 2.5
- [x] api: `redocly lint` — валиден
- [x] Manual: полный HTTP-цикл через curl — см. Manual checks
