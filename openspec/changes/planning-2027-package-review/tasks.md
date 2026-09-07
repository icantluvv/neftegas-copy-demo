## API

- [ ] 1.1 [api] Добавить схемы `plan-status.yaml`, `plan-type.yaml`,
      `plan.yaml`, `plan-detail.yaml`, `plan-cfo-status.yaml`,
      `plan-history-entry.yaml`, `plan-remark.yaml`, `plan-stats.yaml` в
      `api/src/components/schemas/`; добавить пути `api/src/paths/plans*.yaml`,
      `org-plan-types*.yaml`, `plan-files-id-download.yaml`; зарегистрировать
      всё в `api/src/openapi.yaml` (`tags`, `paths`, `components.schemas`) по
      `design.md` (`## API Shape`). Прогнать `npm run lint` и `npm run
      bundle` из `api/`.

## Backend

- [ ] 2.1 [backend] Написать падающие unit-тесты `planning.mapper.spec.ts`
      (маппинг Entity → DTO) по образцу `corrections.mapper.spec.ts`.
- [ ] 2.2 [backend] Создать entities `Plan`, `PlanType`,
      `PlanPackageRequirement`, `PlanDocumentSlot`, `PlanFileVersion`,
      `PlanCfoStatus`, `PlanRemark`, `PlanHistoryEntry`
      (`apps/backend/src/planning/entities/`); добавить nullable `planId` в
      `notifications/entities/notification.entity.ts`.
- [ ] 2.3 [backend] Реализовать `planning.mapper.ts` до green по 2.1.
- [ ] 2.4 [backend] Написать падающие unit-тесты `planning.service.spec.ts`:
      доступ по ролям (видимость списка/карточки), создание по типу,
      комплектация пакета, `send`/`resubmit` (привязка ЦФО к филиалу через
      FilialCfoLink, полнота пакета, история согласовавших ЦФО не
      сбрасывается), `cfoApprove`/`cfoReturn`/`cfoCancel` (guard по статусу
      `PENDING`, требование открытого замечания для возврата), `leaveRemark`
      (guard по ролям/статусам ЦФО и ДТОиР), `markRemarkFixed`/`reopenRemark`/
      `deleteRemark` (владение, статус `OPEN`), `sendToDtoe` (все обязательные
      ЦФО `APPROVED`, доступно любому согласовавшему), `dtoeApprove`/
      `dtoeReturn` (только DTOE, `RETURN` требует открытого замечания,
      `APPROVE` — финал и неизменяемость).
- [ ] 2.5 [backend] Реализовать `PlanningService` до green по 2.4,
      транзакционно для всех операций, меняющих статус (по образцу
      `corrections.service.ts`).
- [ ] 2.6 [backend] Реализовать `PlanningController` (+ файловый
      `files.controller.ts` для скачивания) с `@Roles`/`RolesGuard`,
      DTO-валидацией (`class-validator`), `PlanningModule`, подключить модуль
      в `AppModule`.
- [ ] 2.7 [backend] Написать e2e-тест `test/planning.e2e-spec.ts`: happy path
      (создание → загрузка всех обязательных слотов → send нескольким ЦФО →
      cfoApprove всеми → sendToDtoe → dtoeApprove) и negative path (send с
      неполным пакетом отклоняется; чужой филиал не видит карточку; замечание
      не тем ЦФО отклоняется; resubmit после возврата блокируется
      неисправленным замечанием, после фикса проходит). Использовать
      `.expect(201)` для POST-действий без `@HttpCode`.
- [ ] 2.8 [backend] Добавить демо `PlanType`+`PlanPackageRequirement` в
      `apps/backend/src/database/seed.ts`.
- [ ] 2.9 [backend] Прогнать `bun run test`, `bun run test:e2e` (либо
      фолбэк из `design.md`), `bun run lint` из `apps/backend`; зафиксировать
      результат в `test-plan.md`.

## Frontend

- [ ] 3.1 [frontend] Сгенерировать Kubb-клиент из обновлённого
      `api/src/openapi.yaml` (не редактировать
      `apps/frontend/packages/api/*/codegen/` вручную).
- [ ] 3.2 [frontend] Написать падающий component-тест формы создания плана
      (`create-plan-form.component.test.tsx`): выбор типа плана, вызов
      `POST /plans`, переход на карточку созданного плана.
- [ ] 3.3 [frontend] Реализовать `planning/create/page.tsx` +
      `create/components/create-plan-form.tsx` до green по 3.2.
- [ ] 3.4 [frontend] Написать падающий component-тест слотов пакета
      (`package-completeness.component.test.tsx`): состав слотов по типу
      плана, кнопка «Загрузить версию» видимая только Филиалу-владельцу и
      активная только не в финальном статусе.
- [ ] 3.5 [frontend] Реализовать `[humanId]/components/package-completeness.tsx`
      до green по 3.4.
- [ ] 3.6 [frontend] Написать падающий component-тест панели отправки
      (`send-for-review-form.component.test.tsx`): активность кнопки только
      при полном пакете, чекбоксы ЦФО только из `availablePlanCfos`.
- [ ] 3.7 [frontend] Реализовать `send-for-review-form.tsx`,
      `resubmit-panel.tsx` до green по 3.6.
- [ ] 3.8 [frontend] Написать падающий component-тест списка замечаний
      (`remarks-list.component.test.tsx`): «Исправлено» только у
      Филиала-владельца, «Удалить»/«Открыть заново» только у автора и по
      статусу, форма «Оставить замечание»/«Согласовать»/«Вернуть» для ЦФО/ДТОиР
      по правам.
- [ ] 3.9 [frontend] Реализовать `remarks-list/*`, `cfo-statuses.tsx`,
      `return-remark-dialog.tsx`, `history-log.tsx` до green по 3.8.
- [ ] 3.10 [frontend] Собрать `plan-detail-view.tsx` + `[humanId]/page.tsx`,
      `not-found-screen.tsx`, `plan-detail-skeleton.tsx`,
      `lib/permissions.ts`, `lib/use-invalidate-plan.ts` из компонентов выше;
      подключить TanStack Query хуки.
- [ ] 3.11 [frontend] Написать падающий component-тест рабочего стола
      (`planning-dashboard.component.test.tsx` или по аналогии с
      `filial-corrections-overview`/`cfo-corrections-overview`/
      `dtoe-dashboard`): карточки статистики и список планов по роли.
- [ ] 3.12 [frontend] Реализовать `planning/page.tsx` (замена
      `SectionPlaceholder`) до green по 3.11, по образцу
      `dashboard/components/filial-dashboard.tsx`/`cfo-dashboard.tsx`/
      `dtoe-dashboard.tsx`.
- [ ] 3.13 [frontend] Реализовать `[humanId]/edit/page.tsx` +
      `edit-plan-type-form.tsx` (смена типа плана пока `DRAFT`).
- [ ] 3.14 [frontend] Прогнать `bun run typecheck`, `bun run lint`, `bun run
      test` из `apps/frontend`; зафиксировать результат в `test-plan.md`.

## Финальная проверка

- [ ] 4.1 [openspec] `git status --short` проверен на посторонние правки;
      `openspec validate planning-2027-package-review --strict
      --no-interactive` (или ручная проверка, если CLI недоступен в
      окружении).
