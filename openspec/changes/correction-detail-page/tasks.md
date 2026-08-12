## 1. API

- [ ] 1.1 [api] Подтвердить, что `api/src/openapi.yaml` уже полностью описывает
      карточку корректировки (`CorrectionDetail`, все use-case эндпоинты из
      `design.md` — API Shape) без необходимости изменений; сверить со
      `apps/backend/src/corrections/corrections.controller.ts` и
      `corrections.service.ts`. Выполнить `npm run lint` из `api/`. Если типы в
      `apps/frontend/packages/api/base/codegen/` расходятся с текущим
      `openapi.yaml`, перегенерировать Kubb-клиент штатной командой (без ручного
      редактирования `codegen/`).

## 2. Backend

_(нет задач)_

## 3. Frontend

### 3.1 UI-примитивы

- [ ] 3.1.1 [frontend] Failing component-тест для `apps/frontend/src/components/ui/badge/badge.component.test.tsx` (варианты цвета по статусу) → реализовать `badge.tsx` (+`index.ts`) → green.
- [ ] 3.1.2 [frontend] Failing component-тест для `apps/frontend/src/components/ui/table/table.component.test.tsx` → реализовать `table.tsx` (+`index.ts`) → green.
- [ ] 3.1.3 [frontend] Failing component-тест для `apps/frontend/src/components/ui/dialog/dialog.component.test.tsx` (открытие/закрытие, форма внутри) → реализовать `dialog.tsx` (+`index.ts`) → green.

### 3.2 Guard-логика и маппинг статусов

- [ ] 3.2.1 [frontend] Failing unit-тест `apps/frontend/app/(private)/corrections/[id]/lib/permissions.unit.test.ts`, покрывающий guard-условия из `specs/correction-detail-page/spec.md` (видимость и активность каждой кнопки/блока по роли, статусу корректировки, `myCfoStatus`, `returnedCfos`, статусам замечаний) → реализовать `permissions.ts` → green.
- [ ] 3.2.2 [frontend] Failing unit-тест `apps/frontend/app/(private)/corrections/[id]/lib/status-labels.unit.test.ts` (текст и цвет бейджа для каждого статуса корректировки/ЦФО/замечания) → реализовать `status-labels.ts` → green.

### 3.3 Данные и мутации

- [ ] 3.3.1 [frontend] Подключить `apps/frontend/app/(private)/corrections/[id]/page.tsx`: `getMe()`, ролевой доступ через существующий `(private)/layout.tsx`, `prefetchQuery(getCorrectionSuspenseQueryOptions({ humanId: params.id }))` из `apps/frontend/packages/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense.ts`, `dehydrate` + `HydrationBoundary` по паттерну `docs/adr/frontend-data-fetching.md`.
- [ ] 3.3.2 [frontend] Реализовать `apps/frontend/app/(private)/corrections/[id]/components/correction-detail-view.tsx` (`"use client"`), читающий `useGetCorrectionSuspense({ humanId })` и компонующий блоки.
- [ ] 3.3.3 [frontend] Обвязать существующие Kubb-мутационные хуки (`useReturnCorrectionByCfo`, `useApproveCorrectionByCfo`, `useSendCorrectionToDtoe`, `useResubmitCorrection`, `useResubmitToDtoe`, `useSendCorrection`, `useDtoeApprove`, `useDtoeReturn`, upload-файла в слот, fix/delete замечания) единой инвалидацией/`setQueryData` по `getCorrectionSuspenseQueryKey({ humanId })` в `.../lib/use-correction-mutations.ts`.

### 3.4 Блок «Шапка корректировки»

- [ ] 3.4.1 [frontend] Failing component-тест `correction-header.component.test.tsx` (Scenario: «Шапка отображается всем ролям одинаково») → реализовать `correction-header.tsx` → green.

### 3.5 Блок «Комплектность пакета»

- [ ] 3.5.1 [frontend] Failing component-тест `package-completeness.component.test.tsx`, покрывающий сценарии загрузки первой версии, версии по замечанию, недоступности после `APPROVED_BY_DTOE`, скрытия кнопки для ЦФО/ДТОиР → реализовать `package-completeness.tsx` (таблица слотов + `useUploadSlotFile`) → green.
- [ ] 3.5.2 [frontend] Failing component-тест на форму «Направить» (выбор ЦФО из `availableCfos`, disabled при незаполненных обязательных слотах) → реализовать форму направления (TanStack Form) → green.

### 3.6 Блок «Статусы ЦФО»

- [ ] 3.6.1 [frontend] Failing component-тест `cfo-statuses.component.test.tsx` (read-only рендер, отсутствие управляющих элементов) → реализовать `cfo-statuses.tsx` → green.

### 3.7 Блок «Замечания»

- [ ] 3.7.1 [frontend] Failing component-тест на согласование ЦФО (кнопка активна только при `myCfoStatus.status === 'PENDING'`) → реализовать действие «Согласовать» → green.
- [ ] 3.7.2 [frontend] Failing component-тест на форму возврата с замечанием (ЦФО и ДТОиР), создание `Remark` через `RemarkCreateInput` → реализовать диалог возврата (`dialog` + TanStack Form) → green.
- [ ] 3.7.3 [frontend] Failing component-тест `remarks-list.component.test.tsx`: «Отметить исправленным» доступна филиалу для своих `OPEN`-замечаний, недоступна для `CLOSED`; удаление доступно только автору и только в `OPEN` → реализовать `remarks-list.tsx` → green.
- [ ] 3.7.4 [frontend] Failing component-тест на финальное согласование/возврат ДТОиР → реализовать соответствующие действия → green.

### 3.8 Блок «Повторное направление»

- [ ] 3.8.1 [frontend] Failing component-тест `resubmit-panel.component.test.tsx`: блок скрыт при пустом `returnedCfos`, кнопка неактивна без выбранного ЦФО, кнопка неактивна при открытых замечаниях выбранного ЦФО, успешное повторное направление не сбрасывает статус ранее согласовавших ЦФО → реализовать `resubmit-panel.tsx` → green.
- [ ] 3.8.2 [frontend] Failing component-тест на повторное направление в ДТОиР (`RETURNED_BY_DTOE`, кнопка активна только когда все замечания ДТОиР `FIXED_BY_FILIAL`) → реализовать действие → green.

### 3.9 Блок «История действий»

- [ ] 3.9.1 [frontend] Failing component-тест `history-log.component.test.tsx` (read-only, хронологический порядок, отсутствие элементов редактирования/удаления) → реализовать `history-log.tsx` → green.

### 3.10 Сквозные E2E

- [ ] 3.10.1 [frontend] Failing E2E `apps/frontend/e2e/correction-detail.e2e.spec.ts` (happy path: Филиал направляет → ЦФО согласовывает → направляет в ДТОиР → ДТОиР согласовывает) по паттерну `apps/frontend/e2e/dashboard.e2e.spec.ts` → добавить недостающие сидовые данные при необходимости → green.
- [ ] 3.10.2 [frontend] Failing E2E: negative path «ЦФО возвращает с замечанием → повторное направление недоступно, пока замечание открыто → Филиал отмечает исправленным → повторно направляет» → green.

### 3.11 Верификация

- [ ] 3.11.1 [frontend] `bun run typecheck`
- [ ] 3.11.2 [frontend] `bun run lint`
- [ ] 3.11.3 [frontend] `bun run test` (unit + component)
- [ ] 3.11.4 [frontend] `bun run build`
- [ ] 3.11.5 [frontend] Прогнать `apps/frontend/e2e/correction-detail.e2e.spec.ts`
- [ ] 3.11.6 [openspec] Обновить `test-plan.md` (статусы строк покрытия) и выполнить `openspec validate correction-detail-page --strict --no-interactive`
