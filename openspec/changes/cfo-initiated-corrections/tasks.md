## 1. API

- [ ] 1.1 [api] Обновить `api/src/openapi.yaml` и связанные `api/src/paths/**`/
      `components/schemas/**` по `design.md` → API Shape: расширить роли
      `POST /corrections` на `CFO`; добавить пути
      `corrections-human-id-send-as-cfo.yaml`, `-filial-approve.yaml`,
      `-filial-return.yaml`, `-cancel-filial-decision.yaml`,
      `-resubmit-to-filials.yaml`; расширить `CorrectionStatus` (5 новых
      значений), `Correction`/`CorrectionDetail` (`initiatorKind`,
      `initiatorFilial`, `initiatorCfo`, `targetKind`, `filialStatuses`,
      `myFilialStatus`, `isFilialReviewer`, `availableFilials`); добавить
      схему `correction-filial-status.yaml`. Выполнить `npm run lint` из
      `api/`, при необходимости `npm run bundle`.
- [ ] 1.2 [api] Зафиксировать контракт как source of truth после зелёного
      lint; если Backend или Frontend в ходе реализации потребуют правки
      контракта — добавить следующую задачу `1.x`, не редактировать `1.1`
      постфактум.

## 2. Backend

### 2.1 Модель данных

- [x] 2.1.1 [backend] `entities/correction.entity.ts`: добавить `InitiatorKind`,
      `TargetKind`, поля `initiatorKind`, `initiatorFilialId`,
      `initiatorCfoId`/`initiatorCfo`, `targetKind`; сделать `filialId`/`filial`
      nullable; добавить relation `filialStatuses`; добавить 5 новых значений
      `CorrectionStatus`. Подтверждено при работе над `revise-package-requirements`:
      backend компилируется (`tsc --noEmit` чисто), контейнер стабильно
      стартует (`synchronize` применил схему), `bun run test` 40/40 green.
      Nullable-числовые колонки (`filialId`/`initiatorFilialId`/
      `initiatorCfoId`) потребовали явного `type: 'int'` — без него TypeORM
      падал на `Object` type.
- [x] 2.1.2 [backend] Новая `entities/correction-filial-status.entity.ts`
      (зеркало `correction-cfo-status.entity.ts`). Подтверждено — компилируется
      и синхронизируется с БД (таблица `correction_filial_statuses` создана).
- [x] 2.1.3 [backend] `entities/remark.entity.ts`: добавить `filialId`/`filial`,
      обновить `issuerLabel`. Подтверждено компиляцией и тестами.
- [x] 2.1.4 [backend] `corrections.module.ts`: зарегистрировать
      `CorrectionFilialStatus` в `TypeOrmModule.forFeature([...])`.
      *(Выполнено попутно при работе над `revise-package-requirements` —
      отсутствие регистрации ронялo backend-контейнер в цикл рестарта при
      перезапуске: `Entity metadata for Correction#filialStatuses was not
      found`. Заодно зарегистрирована в `database/seed.ts`, и добавлен явный
      `type: 'int'` для `Correction.filialId`/`initiatorFilialId`/
      `initiatorCfoId` — без него TypeORM видел design:type как `Object` для
      nullable-числовых колонок и падал на `synchronize`. Подтверждено:
      backend-контейнер стабильно стартует, `bun run test` — 40/40 green.)*
- [ ] 2.1.5 [backend] `database/seed.ts`: добавить 18-ю строку `cfos` —
      `{ code: 'ДТОиР', slug: 'dtoe' }`; исключить её из цикла создания
      `FilialCfoLink`; добавить минимум одну демо-корректировку с
      `initiatorKind = CFO` (см. `design.md` → Тестовая стратегия).
- [ ] 2.1.6 [backend] `bun run seed` локально — убедиться, что сид
      проходит без ошибок на пустой БД.

### 2.2 Сервис — создание и направление (TDD)

- [ ] 2.2.1 [backend] Failing unit-тест `corrections.service.spec.ts`:
      «ЦФО с `cfoId` создаёт корректировку» / «ЦФО без `cfoId` получает 403»
      → реализовать расширение guard в `create()` → green.
- [ ] 2.2.2 [backend] Failing unit-тест: `sendAsCfo` с `target: FILIAL`
      создаёт `CorrectionFilialStatus` для каждого филиала, статус →
      `UNDER_FILIAL_REVIEW` → реализовать `sendAsCfo()` (ветка FILIAL),
      `dto/send-as-cfo.dto.ts` → green.
- [ ] 2.2.3 [backend] Failing unit-тест: `sendAsCfo` с `target: DTOE` →
      статус → `UNDER_DTOE_REVIEW`, уведомление `dtoeUsers()` → реализовать
      ветку DTOE → green.
- [ ] 2.2.4 [backend] Failing unit-тест: `sendAsCfo` при неукомплектованном
      пакете → `400` → реализовать переиспользование `checkPackageComplete()`
      → green.
- [ ] 2.2.5 [backend] Failing unit-тест: не-автор вызывает `sendAsCfo` → `403`
      → реализовать guard по `initiatorCfoId` → green.
- [ ] 2.2.6 [backend] `corrections.controller.ts`: `POST
      /corrections/{humanId}/send-as-cfo`, `@Roles(Role.CFO)`; расширить
      `@Roles` на `POST /corrections` до `(Role.FILIAL, Role.CFO)`.

### 2.3 Сервис — действия филиала-проверяющего (TDD)

- [ ] 2.3.1 [backend] Failing unit-тест: `filialApprove` переводит строку
      `CorrectionFilialStatus` в `APPROVED`, пересчитывает статус
      корректировки (`PARTIALLY_APPROVED_BY_FILIALS`/`ALL_FILIALS_APPROVED`)
      → реализовать `filialApprove()` + `recomputeStatusAfterFilialAction()`
      → green.
- [ ] 2.3.2 [backend] Failing unit-тест: повторный `filialApprove` → `400`
      → guard `status === PENDING` → green.
- [ ] 2.3.3 [backend] Failing unit-тест: `leaveRemark` от роли `FILIAL`
      создаёт замечание с `filialId`, требует `PENDING` → реализовать третью
      ветку `leaveRemark()` → green.
- [ ] 2.3.4 [backend] Failing unit-тест: `filialReturn` без открытых
      замечаний → `400`; с замечанием → статус строки `RETURNED`, статус
      корректировки `RETURNED_FOR_REVISION_BY_FILIAL`, уведомление автору-ЦФО
      → реализовать `filialReturn()` → green.
- [ ] 2.3.5 [backend] Failing unit-тест: `cancelFilialDecision` — из
      `APPROVED`/`RETURNED` в `PENDING`; `400` если ещё `PENDING` или
      корректировка уже в ДТОиР → реализовать `cancelFilialDecision()` →
      green.
- [ ] 2.3.6 [backend] Failing unit-тест: `resubmitToFilials` — только если
      все замечания вернувшего филиала `FIXED_BY_FILIAL`, статус строки →
      `PENDING`, статус корректировки → `RESUBMITTED_TO_FILIALS`, решения
      других филиалов не сбрасываются → реализовать `resubmitToFilials()` →
      green.
- [ ] 2.3.7 [backend] `corrections.controller.ts`: `POST
      /corrections/{humanId}/filial-approve`, `.../filial-return`,
      `.../cancel-filial-decision`, `.../resubmit-to-filials`, все
      `@Roles(Role.FILIAL)` (кроме `resubmit-to-filials` — переиспользует
      guard автора-ЦФО внутри сервиса; ролевой decorator — `Role.CFO`).

### 2.4 Видимость, доступ, статистика

- [ ] 2.4.1 [backend] Failing unit-тест: `findAll()` для роли `CFO` включает
      корректировки, где `initiatorCfoId = user.cfoId`, даже без
      `CorrectionCfoStatus` → реализовать `OR c.initiatorCfoId = :cfoId` →
      green.
- [ ] 2.4.2 [backend] Failing unit-тест: `findAll()` для роли `FILIAL`
      включает ЦФО-инициированные корректировки, где есть
      `CorrectionFilialStatus` с его `filialId` → реализовать доп. условие
      → green.
- [ ] 2.4.3 [backend] Failing unit-тест: `checkAccess()` — ЦФО-автор и
      филиал-проверяющий получают доступ к `GET /corrections/{humanId}` →
      реализовать расширение → green.
- [ ] 2.4.4 [backend] Failing unit-тест: `getStats()` учитывает новые 5
      статусов в подсчёте «на проверке»/«возвращено» → реализовать → green.
- [ ] 2.4.5 [backend] Failing unit-тест: `toDetailDto()` возвращает
      `filialStatuses`, `myFilialStatus`, `isFilialReviewer`,
      `availableFilials`, `initiatorKind`/`initiatorFilial`/`initiatorCfo`/
      `targetKind` → реализовать → green.
- [ ] 2.4.6 [backend] Failing unit-тест: уведомления/лог для
      ЦФО-инициированной корректировки не падают на `correction.filial ===
      null` (`send`/`resubmit`/`cfoReturn`/`dtoeApprove`/`dtoeReturn`/
      `resubmitToDtoe`/`recomputeStatusAfterCfoAction`) → реализовать
      `initiatorLabel()`/`initiatorUsers()` helper и заменить прямые
      обращения к `correction.filial.code` → green.

      *(Промежуточный шаг сделан при работе над `revise-package-requirements`,
      чтобы вернуть backend к компилируемому состоянию: на всех 15
      затронутых обращениях к `correction.filial`/`correction.filialId`
      расставлены non-null assertions (`!`) — компилируется и работает
      корректно для текущего единственного реального пути (`initiatorKind`
      всегда `FILIAL`, т.к. `create()` для роли `CFO` ещё не реализован).
      Это НЕ отменяет эту задачу — `!` лишь временная заглушка типов, при
      реализации `sendAsCfo`/`create()` для CFO эти же 15 мест упадут в
      рантайме на `null`, если их не заменить на `initiatorLabel()`/
      `initiatorUsers()` до включения ветки CFO.)*
- [ ] 2.4.7 [backend] `deleteCorrection()`: failing тест — автор-ЦФО удаляет
      собственный черновик → реализовать расширение guard → green.

### 2.5 Верификация backend

- [ ] 2.5.1 [backend] `npm run lint` (или `bun run lint`, см. `package.json`)
      — без ошибок в изменённых файлах.
- [ ] 2.5.2 [backend] `bun run test` — все unit зелёные, включая новые
      describe-блоки.
- [ ] 2.5.3 [backend] `bun run test:e2e` — минимум один сквозной сценарий
      ЦФО→Филиал(ы) и один ЦФО→ДТОиР напрямую.

## 3. Frontend

### 3.1 Кодоген

- [ ] 3.1.1 [frontend] Перегенерировать `apps/frontend/packages/api/base/codegen/**`
      из обновлённого `openapi.yaml` штатной командой (без ручного
      редактирования `codegen/`) — новые хуки `useSendCorrectionAsCfo`,
      `useApproveCorrectionByFilial`, `useReturnCorrectionByFilial`,
      `useCancelFilialDecision`, `useResubmitToFilials`, обновлённые типы
      `CorrectionStatus2`, `CorrectionDetail`, новый тип
      `CorrectionFilialStatus`.

### 3.2 Создание корректировки ролью CFO

- [ ] 3.2.1 [frontend] Failing component-тест
      `create-correction-form.component.test.tsx`: для роли `CFO` после
      комплектации пакета отображается выбор направления (Филиалы/ДТОиР) →
      реализовать в `create-correction-form.tsx` → green.
- [ ] 3.2.2 [frontend] Failing component-тест: выбор «Филиалы» требует
      непустой мультиселект, отправляет `useSendCorrectionAsCfo({ target:
      FILIAL, filialIds })` → реализовать → green.
- [ ] 3.2.3 [frontend] Failing component-тест: выбор «ДТОиР» отправляет
      `useSendCorrectionAsCfo({ target: DTOE })` без доп. полей → реализовать
      → green.
- [ ] 3.2.4 [frontend] `apps/frontend/app/(private)/constants.ts`:
      `navItems`, пункт «Создать корректировку» — `roles: ["FILIAL", "CFO"]`.

### 3.3 Действия филиала-проверяющего

- [ ] 3.3.1 [frontend] Failing unit-тест `permissions.unit.test.ts`:
      `canApproveAsFilial`/`canFinalizeReturnAsFilial`/
      `canCancelFilialDecision` по условиям `myFilialStatus` → реализовать в
      `permissions.ts` → green.
- [ ] 3.3.2 [frontend] Failing component-тест
      `remarks-action-bar.component.test.tsx`: блок действий филиала-
      проверяющего (согласовать/вернуть/отменить) видим при
      `isFilialReviewer && myFilialStatus.status === 'PENDING'` → реализовать
      в `remarks-action-bar.tsx` → green.
- [ ] 3.3.3 [frontend] Failing component-тест: форма «Оставить замечание к
      элементу» доступна филиалу-проверяющему (переиспользует существующий
      `return-remark-dialog.tsx`) → реализовать проверку роли в вызывающем
      месте → green.

### 3.4 Кабинет ДТОиР

- [ ] 3.4.1 [frontend] Failing component-тест
      `dtoe-corrections-overview.component.test.tsx`: донат-график, фильтр
      по статусу, фильтр по типу инициатора, таблица `UNDER_DTOE_REVIEW` →
      реализовать новый `dtoe-corrections-overview.tsx` (по образцу
      `cfo-corrections-overview.tsx`) → green.
- [ ] 3.4.2 [frontend] `dtoe-dashboard.tsx`: подключить
      `DtoeCorrectionsOverview` рядом с существующими 6 плитками статистики.

### 3.5 Дашборд филиала

- [ ] 3.5.1 [frontend] Failing component-тест
      `filial-corrections-overview.component.test.tsx`: раздел «На
      согласовании (от ЦФО)» показывает только `initiatorKind === 'CFO'` с
      `myFilialStatus` заполненным → реализовать в
      `filial-corrections-overview.tsx` → green.

### 3.6 Сквозной E2E

- [ ] 3.6.1 [frontend] Failing E2E `apps/frontend/e2e/cfo-initiated-correction.e2e.spec.ts`:
      happy path ЦФО создаёт → направляет филиалу → филиал согласовывает →
      ЦФО направляет в ДТОиР → ДТОиР согласовывает → green.

### 3.7 Верификация frontend

- [ ] 3.7.1 [frontend] `bun run typecheck` (`tsc --noEmit`) — чисто.
- [ ] 3.7.2 [frontend] `bun run lint` — без новых ошибок в изменённых файлах.
- [ ] 3.7.3 [frontend] `bun run test` (unit + component) — зелёные, включая
      новые файлы из 3.2–3.5.
- [ ] 3.7.4 [frontend] `bun run build` — успешно, новые маршруты/содержимое
      без ошибок сборки.
- [ ] 3.7.5 [frontend] Прогнать E2E из 3.6.1.

## 4. Финализация

- [ ] 4.1 [openspec] Обновить `test-plan.md` (статусы строк покрытия по
      каждому Requirement).
- [ ] 4.2 [openspec] `openspec validate cfo-initiated-corrections --strict
      --no-interactive` (если/когда CLI доступен в окружении).
- [ ] 4.3 [root] Ручная проверка в браузере (см. `test-plan.md` → Manual
      checks) для сценариев, не покрытых E2E.
- [ ] 4.4 [openspec] Архивировать change (`/openspec-archive-change
      cfo-initiated-corrections`) только после завершения секций 1–3,
      обязательных проверок и перехода задачи в трек «Приемка».
