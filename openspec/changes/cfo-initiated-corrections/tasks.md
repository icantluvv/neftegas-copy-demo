## 1. API

- [ ] 1.1 [api] `api/src/components/schemas/correction.yaml`: `filialId` →
      nullable, добавить `cfoId` (nullable integer). `correction-detail.yaml`:
      добавить `isCfoOwner` (boolean, required), `filial` — nullable.
      `api/src/paths/corrections.yaml` — `description` создания: «Доступно
      ролям FILIAL и CFO». `corrections-human-id-send-to-dtoe.yaml` —
      `description` — ветка владельца-ЦФО. `npm run lint` из `api/`, при
      необходимости `npm run bundle`.

## 2. Backend

### 2.1 Модель данных

- [ ] 2.1.1 [backend] `entities/correction.entity.ts`: удалить
      `InitiatorKind`/`TargetKind`/`initiatorFilialId`/`initiatorCfo`/
      `initiatorCfoId`/`targetKind`/`filialStatuses` (неиспользованный
      скаффолдинг первой версии change); добавить `cfo`/`cfoId` (nullable,
      `type: 'int'`, зеркало `filialId`).
- [ ] 2.1.2 [backend] Удалить `entities/correction-filial-status.entity.ts`;
      убрать регистрацию из `corrections.module.ts`.
- [ ] 2.1.3 [backend] Откатить `entities/remark.entity.ts` — убрать
      `filialId`/`filial`, `issuerLabel` — убрать ветку `filial`.
- [ ] 2.1.4 [backend] `database/seed.ts`: добавить демо-корректировку с
      `cfoId` заполненным (статус `DRAFT` или `UNDER_DTOE_REVIEW`).
- [ ] 2.1.5 [backend] `bun run seed` локально — сид проходит без ошибок на
      пустой БД; ручная проверка на уже засеянной dev-БД (см. известный
      нюанс — `seed.ts` пропускается, если есть хоть один пользователь;
      демо-корректировку добавить вручную через `psql`, если требуется
      увидеть её в уже поднятом окружении).

### 2.2 Сервис (TDD)

- [ ] 2.2.1 [backend] Failing unit-тест `corrections.service.spec.ts`: «ЦФО с
      `cfoId` создаёт корректировку» / «ЦФО без `cfoId` получает 403» →
      реализовать расширение guard в `create()` → green.
- [ ] 2.2.2 [backend] Failing unit-тест: `sendToDtoe` для владельца-ЦФО из
      `DRAFT`/`RETURNED_BY_DTOE` → статус `UNDER_DTOE_REVIEW`, уведомление
      `dtoeUsers()` → реализовать ветку `isCfoOwner` в `sendToDtoe()` →
      green.
- [ ] 2.2.3 [backend] Failing unit-тест: `sendToDtoe` владельцем при
      неукомплектованном пакете → `400` → реализовать переиспользование
      `checkPackageComplete()` → green.
- [ ] 2.2.4 [backend] Failing unit-тест: `checkAccess`/`findAll` — ЦФО-
      владелец видит и получает доступ к своей корректировке без
      `CorrectionCfoStatus` → реализовать → green.
- [ ] 2.2.5 [backend] Failing unit-тест: `toDetailDto` возвращает
      `isCfoOwner` → реализовать → green.
- [ ] 2.2.6 [backend] Failing unit-тест: `deleteCorrection` — автор-ЦФО
      удаляет собственный черновик → реализовать расширение guard → green.
- [ ] 2.2.7 [backend] `corrections.controller.ts`: расширить `@Roles` на
      `POST /corrections` до `(Role.FILIAL, Role.CFO)`.

### 2.3 Верификация backend

- [ ] 2.3.1 [backend] `bun run lint` — без ошибок в изменённых файлах.
- [ ] 2.3.2 [backend] `bun run test` — все unit зелёные.
- [ ] 2.3.3 [backend] `bunx tsc --noEmit` чисто (e2e-раннер в этом окружении
      не запускается — известный баг Bun/Jest); ручной `bun -e` HTTP
      smoke-test в `infra-backend-1`: ЦФО создаёт → направляет в ДТОиР →
      ДТОиР согласовывает.

## 3. Frontend

### 3.1 Кодоген

- [ ] 3.1.1 [frontend] Перегенерировать `apps/frontend/packages/api/base/codegen/**`
      из обновлённого `openapi.yaml` — обновлённые типы `Correction`,
      `CorrectionDetail` (`cfoId`, `isCfoOwner`).

### 3.2 Создание корректировки ролью CFO

- [ ] 3.2.1 [frontend] `apps/frontend/app/(private)/corrections/create/page.tsx`:
      гвард `!["FILIAL", "CFO"].includes(user.role)`.
- [ ] 3.2.2 [frontend] `apps/frontend/app/(private)/constants.ts`: пункт
      «Создать корректировку» — `roles: ["FILIAL", "CFO"]`.
- [ ] 3.2.3 [frontend] `dashboard/components/cfo-corrections-overview.tsx`:
      кнопка «+ Создать корректировку» (по образцу
      `filial-corrections-overview.tsx`).

### 3.3 Карточка корректировки — отправка владельцем

- [ ] 3.3.1 [frontend] Failing unit-тест `permissions.unit.test.ts`:
      `canSendToDtoeAsOwner` → реализовать в `permissions.ts` → green.
      Расширить `canUploadSlotFile` на `isCfoOwner`.
- [ ] 3.3.2 [frontend] Failing component-тест: панель отправки для
      `isCfoOwner` показывает кнопку «Направить в ДТОиР» без выбора ЦФО →
      реализовать ветку в submit-панели → green.

### 3.4 Верификация frontend

- [ ] 3.4.1 [frontend] `bun run typecheck` — чисто.
- [ ] 3.4.2 [frontend] `bun run lint` — без новых ошибок.
- [ ] 3.4.3 [frontend] `bun run test` (unit + component) — зелёные.
- [ ] 3.4.4 [frontend] Ручная проверка в браузере под `cfo.angnks@demo.local`:
      создать корректировку → загрузить файлы → направить в ДТОиР → под
      `dtoe@demo.local` согласовать.

## 4. Финализация

- [ ] 4.1 [openspec] Обновить `test-plan.md`.
- [ ] 4.2 [openspec] `openspec validate cfo-initiated-corrections --strict
      --no-interactive` (если/когда CLI доступен в окружении).
- [ ] 4.3 [openspec] Архивировать change после завершения секций 1–3 и
      обязательных проверок.
