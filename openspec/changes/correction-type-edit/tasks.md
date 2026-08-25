## 1. API

- [x] 1.1 [api] Добавить схему `CorrectionTypeChangeInput`
      (`api/src/components/schemas/correction.yaml`) и путь
      `POST /corrections/{humanId}/change-type`
      (`api/src/paths/corrections-human-id-change-type.yaml`), 403/400/404
      responses по образцу `corrections-human-id.yaml` (DELETE). Зарегистрировать
      в `api/src/openapi.yaml`. `redocly lint` — валиден, новых ошибок сверх
      44 pre-existing warnings по контракту не добавлено.
- [x] 1.2 [api] Перегенерировать Kubb-клиент фронтенда
      (`bun run generate` из `apps/frontend/packages/api`) — новые
      `useChangeCorrectionType` и сопутствующие типы/zod/моки.

## 2. Backend

- [x] 2.1 [backend] `dto/update-correction-type.dto.ts` — `{ correctionTypeId: number }`.
- [x] 2.2 [backend] `CorrectionsService.updateCorrectionType(user, humanId, dto)`:
      guard роль FILIAL + владение + статус `DRAFT`; 404 при отсутствии
      нового типа; no-op при том же типе; в транзакции — удалить типозависимые
      слоты (`requirementId != null`), создать новые по составу требований
      нового типа (алгоритм идентичен `create()`), обновить
      `correctionTypeId`, запись в историю; вне транзакции — удалить с диска
      файлы удалённых слотов (по паттерну `deleteCorrection()`).
- [x] 2.3 [backend] `CorrectionsController`: `POST :humanId/change-type`,
      `@Roles(Role.FILIAL)`.
- [x] 2.4 [backend] `npx tsc --noEmit` — чисто. `bun run lint` — 0 ошибок,
      1 pre-existing warning в `main.ts`, не связанный с этой задачей.
- [ ] 2.5 [backend] Написать `corrections.service.spec.ts` тесты по
      сценариям из `specs/correction-type-edit/spec.md` (требуется тестовая
      фикстура с двумя `CorrectionType` — на момент реализации не написаны).

## 3. Frontend

- [x] 3.1 [frontend] `apps/frontend/app/(private)/corrections/[humanId]/edit/page.tsx`
      — RSC: `getCorrection({ humanId })`, guard `isFilialOwner && status ===
      "DRAFT"` → `AccessDeniedScreen`, 403/404 обработаны по паттерну
      `corrections/[humanId]/page.tsx`.
- [x] 3.2 [frontend] `.../edit/components/edit-correction-type-form.tsx` —
      `Select` по паттерну `create-correction-form.tsx`, предзаполнен текущим
      типом, кнопка «Сохранить» неактивна при невыбранном/неизменённом типе,
      кнопка «Отмена» → карточка корректировки, редирект по успеху мутации.
- [x] 3.3 [frontend] `.../components/correction-header.tsx` — условная
      ссылка «Изменить тип» → `/corrections/{humanId}/edit`, видна при
      `isFilialOwner && status === "DRAFT"`.
- [x] 3.4 [frontend] `npx tsc --noEmit` — чисто. `bun run lint` — без новых
      ошибок в изменённых/новых файлах.
- [ ] 3.5 [frontend] Failing component-тест
      `edit-correction-type-form.component.test.tsx` (disabled-состояния,
      вызов мутации, редирект) → green — не написан.
- [ ] 3.6 [frontend] Failing E2E-сценарий смены типа
      (`apps/frontend/e2e/correction-type-edit.e2e.spec.ts`) → green — не написан.

## 4. Верификация и завершение

- [x] 4.1 [root] Ручная проверка через `curl` под демо-аккаунтом
      `filial.donbassgaz@demo.local`: создание черновика → смена на тот же
      тип (no-op, `200`, данные не изменились) → смена на несуществующий тип
      (`404`) → смена типа у корректировки не в `DRAFT` (`400`, проверено на
      `COR-000001` в статусе `UNDER_DTOE_REVIEW`) → удаление тестового
      черновика. SSR-страница `/corrections/{humanId}/edit`: `200` с формой
      для владельца-черновика, «Доступ запрещён» для не-`DRAFT`; ссылка
      «Изменить тип» видна на карточке `DRAFT`-корректировки автора и не
      видна на направленной.
- [ ] 4.2 [root] Ручная или автоматизированная проверка реконсиляции слотов
      между двумя РАЗНЫМИ типами — заблокировано отсутствием второго
      активного `CorrectionType` в демо-сиде (`apps/backend/src/database/seed.ts`).
- [ ] 4.3 [openspec] Написать недостающие тесты (2.5, 3.5, 3.6) либо
      оформить явный waiver в `test-plan.md`, затем
      `openspec validate correction-type-edit --strict --no-interactive`.
