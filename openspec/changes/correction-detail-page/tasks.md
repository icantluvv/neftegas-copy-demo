## 1. API

- [x] 1.1 [api] Подтвердить, что `api/src/openapi.yaml` уже полностью описывает
      карточку корректировки (`CorrectionDetail`, все use-case эндпоинты из
      `design.md` — API Shape) без необходимости изменений; сверить со
      `apps/backend/src/corrections/corrections.controller.ts` и
      `corrections.service.ts`. Выполнить `npm run lint` из `api/`. Если типы в
      `apps/frontend/packages/api/base/codegen/` расходятся с текущим
      `openapi.yaml`, перегенерировать Kubb-клиент штатной командой (без ручного
      редактирования `codegen/`).

      Найдено и исправлено три расхождения аддитивно (без breaking changes),
      все три — relation уже загружалась бэкендом, не хватало маппинга в DTO:
      1. `DocumentSlot`: добавлены `isRequired`, `responsibleCfo` (нужны для
         колонок «Обязателен»/«Проверяет ЦФО»). Commit `231a518`.
      2. `CorrectionCfoStatus`: добавлены `cfo`, `decidedBy` (нужны для
         названия ЦФО и «кто решил» с ФИО/должностью).
      3. `CorrectionHistoryEntry`: добавлен `user`; `UserSummary` дополнен
         `role`/`position` (нужны для колонки «Пользователь» истории).
         Commit `be9799f`.
      `npm run lint` (api), `npx tsc --noEmit` (backend и frontend) — зелёные.

## 2. Backend

- [x] 2.1 [backend] Обнаружен и исправлен пробел в Requirement «Возврат
  корректировки с замечанием» / Scenario «Второй проверяющий не может
  отправить решение поверх уже принятого» (`specs/correction-detail-page/spec.md`):
  `cfoReturn` (`corrections.service.ts`) не проверял `myStatus.status ===
  PENDING` — guard добавлен в рамках `cfo-cabinet` (см. этот change
  `tasks.md`/`design.md`).
- [x] 2.2 [backend] Тот же пробел обнаружен в `cfoApprove` (Requirement
  «Согласование корректировки ЦФО») — guard добавлен в рамках
  `correction-review-safeguards` (см. этот change `tasks.md`, 2.2,
  `corrections.service.spec.ts`).

## 3. Frontend

### 3.1 UI-примитивы

- [x] 3.1.1 [frontend] Failing component-тест для `apps/frontend/src/components/ui/badge/badge.component.test.tsx` (варианты цвета по статусу) → реализовать `badge.tsx` (+`index.ts`) → green.
- [x] 3.1.2 [frontend] Failing component-тест для `apps/frontend/src/components/ui/table/table.component.test.tsx` → реализовать `table.tsx` (+`index.ts`) → green. Дополнительно: `apps/frontend/src/components/ui/data-table/` — обёртка над Table на TanStack Table (`@tanstack/react-table` v8), переиспользуется всеми табличными блоками карточки.
- [x] 3.1.3 [frontend] Failing component-тест для `apps/frontend/src/components/ui/dialog/dialog.component.test.tsx` (открытие/закрытие, форма внутри) → реализовать `dialog.tsx` (+`index.ts`) → green.

### 3.2 Guard-логика и маппинг статусов

- [x] 3.2.1 [frontend] Failing unit-тест `apps/frontend/app/(private)/corrections/[humanId]/lib/permissions.unit.test.ts`, покрывающий guard-условия из `specs/correction-detail-page/spec.md` → реализовать `permissions.ts` → green (25 тестов). Каталог `[id]` переименован в `[humanId]` — конфликт имени динамического сегмента с маршрутом `/corrections/[humanId]`, уже созданным параллельной фичей уведомлений.
- [x] 3.2.2 [frontend] Failing unit-тест `.../lib/status-labels.unit.test.ts` (текст и цвет бейджа для каждого статуса корректировки/ЦФО/замечания) → реализовать `status-labels.ts` → green.

### 3.3 Данные и мутации

- [x] 3.3.1 [frontend] `apps/frontend/app/(private)/corrections/[humanId]/page.tsx`: `getMe()` (роль + `currentUserId`), `fetchQuery(getCorrectionSuspenseQueryOptions({ humanId }))` с try/catch на 403/404, `dehydrate` + `HydrationBoundary` по паттерну `docs/adr/frontend-data-fetching.md`.
- [x] 3.3.2 [frontend] `.../components/correction-detail-view.tsx` (`"use client"`), читает `useGetCorrectionSuspense({ humanId })` и компонует все блоки.
- [x] 3.3.3 [frontend] Каждый блок-мутатор инвалидирует `getCorrectionSuspenseQueryKey({ humanId })` в своём `onSuccess` (без отдельного файла `use-correction-mutations.ts` — оставлено локально по месту использования: `package-completeness.tsx`, `send-for-review-form.tsx`, `remarks-list/`, `resubmit-panel.tsx`).

      Повторяющийся вызов вынесен в хук `.../lib/use-invalidate-correction.ts`;
      на него переведён блок «Замечания» (см. 3.7.5), остальные блоки-мутаторы
      пока оставлены как есть.

### 3.4 Блок «Шапка корректировки»

- [x] 3.4.1 [frontend] Failing component-тест `correction-header.component.test.tsx` → реализовать `correction-header.tsx` → green.

### 3.5 Блок «Комплектность пакета»

- [x] 3.5.1 [frontend] Failing component-тест `package-completeness.component.test.tsx` (загрузка версии, недоступность после `APPROVED_BY_DTOE`, скрытие для ЦФО/ДТОиР) → реализовать `package-completeness.tsx` (`DataTable` + `useUploadFileVersion`) → green.
- [x] 3.5.2 [frontend] Failing component-тест `send-for-review-form.component.test.tsx` (выбор ЦФО из `availableCfos`, disabled при незаполненных обязательных слотах) → реализовать `send-for-review-form.tsx` (react-hook-form, по паттерну `login-form.tsx` — не TanStack Form, в проекте использован react-hook-form) → green.

### 3.6 Блок «Статусы ЦФО»

- [x] 3.6.1 [frontend] Failing component-тест `cfo-statuses.component.test.tsx` (read-only рендер, отсутствие управляющих элементов) → реализовать `cfo-statuses.tsx` → green.

### 3.7 Блок «Замечания»

- [x] 3.7.1 [frontend] Failing component-тест на согласование ЦФО (`myCfoStatus.status === 'PENDING'`) → реализовать действие «Согласовать» в `remarks-list.tsx` → green.
- [x] 3.7.2 [frontend] Failing component-тест `return-remark-dialog.component.test.tsx` на форму возврата с замечанием (ЦФО и ДТОиР), `RemarkCreateInput` → реализовать `return-remark-dialog.tsx` (dialog + react-hook-form) → green.
- [x] 3.7.3 [frontend] Failing component-тест `remarks-list.component.test.tsx`: «Отметить исправленным»/«Удалить» guard-условия → реализовать `remarks-list.tsx` → green (7 тестов).
- [x] 3.7.4 [frontend] Failing component-тест на финальное согласование/возврат ДТОиР и направление в ДТОиР → реализовать в `remarks-list.tsx` (`RemarksActionBar`) → green.
- [x] 3.7.5 [frontend] Рефакторинг без изменения поведения: `remarks-list.tsx` (187 строк, три компонента в одном файле) разнесён в каталог `remarks-list/` — `remarks-list.tsx`, `remarks-columns.tsx`, `remark-actions-cell.tsx`, `remarks-action-bar.tsx`, `index.ts`. Тест `remarks-list.component.test.tsx` перенесён в тот же каталог без правок — 9/9 зелёные, что и подтверждает сохранение поведения. Импорт в `correction-detail-view.tsx` не менялся.

### 3.8 Блок «Повторное направление»

- [x] 3.8.1 [frontend] Failing component-тест `resubmit-panel.component.test.tsx` → реализовать `resubmit-panel.tsx` → green.
- [x] 3.8.2 [frontend] Failing component-тест на повторное направление в ДТОиР → реализовать в `resubmit-panel.tsx` → green.

### 3.9 Блок «История действий»

- [x] 3.9.1 [frontend] Failing component-тест `history-log.component.test.tsx` → реализовать `history-log.tsx` (`DataTable`) → green.

### 3.10 Сквозные E2E

- [ ] 3.10.1 [frontend] Failing E2E `apps/frontend/e2e/correction-detail.e2e.spec.ts` (happy path: Филиал направляет → ЦФО согласовывает → направляет в ДТОиР → ДТОиР согласовывает) по паттерну `apps/frontend/e2e/dashboard.e2e.spec.ts` → добавить недостающие сидовые данные при необходимости → green.
- [ ] 3.10.2 [frontend] Failing E2E: negative path «ЦФО возвращает с замечанием → повторное направление недоступно, пока замечание открыто → Филиал отмечает исправленным → повторно направляет» → green.

### 3.11 Верификация

- [x] 3.11.1 [frontend] `npx tsc --noEmit -p tsconfig.json` — чисто (нет отдельного скрипта `typecheck` в `package.json`).
- [x] 3.11.2 [frontend] `bun run lint` — без ошибок в коде фичи (устранены `no-explicit-any` в `DataTable`/column defs); часть pre-existing ошибок/варнингов в сгенерированном `packages/api/base/codegen/**` и несвязанных файлах вне scope этой фичи.
- [x] 3.11.3 [frontend] `bun run test` (unit + component) — 145/145 зелёные (28 файлов).

      Раньше здесь фиксировался pre-existing красный тест. К моменту 3.7.5 сюита
      падала целиком: все пять тестов с `vi.mock("@/packages/api/base/codegen",
      importOriginal)` рушились с `[vitest] There was an error when mocking a
      module`, а unhandled rejection обрывал прогон до сводки. Две причины,
      обе в `apps/frontend/vitest.config.ts`, обе исправлены:
      1. Переменные окружения брались только из `process.env` и локального
         `.env`. Файла `.env` (и `.env.example`) для фронта в репозитории нет,
         поэтому `src/env/client.ts` падал на импорте с `Invalid environment
         variables`, а вместе с ним — любой тест, тянущий codegen-клиент.
         Добавлен фолбэк `testEnvironmentFallback`; реальные `process.env` и
         `.env` сохраняют приоритет.
      2. Алиас `@/` резолвился только через `tsconfigPaths`, которого не видит
         мокер vitest: `importOriginal()` внутри `vi.mock` падал с
         `Cannot resolve "@/packages/api/base/codegen"`. Добавлен явный
         `resolve.alias` для `@/`.
- [x] 3.11.4 [frontend] `bun run build` — успешно, `/corrections/[humanId]` в дереве маршрутов.
- [ ] 3.11.5 [frontend] Прогнать `apps/frontend/e2e/correction-detail.e2e.spec.ts` — блокируется 3.10.
- [ ] 3.11.6 [openspec] Обновить `test-plan.md` (статусы строк покрытия) и выполнить `openspec validate correction-detail-page --strict --no-interactive`
