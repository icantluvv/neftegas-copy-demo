## 1. API

- [ ] 1.1 [api] Дождаться слияния `feat/planning-2027-api-contract` в `dev`
      (базовые `plan.yaml`/`plan-detail.yaml`/`plans*.yaml` должны
      существовать) — если очередь этого change подошла раньше, воссоздать
      недостающие файлы напрямую (см. `design.md` → «Зависимость»).
- [ ] 1.2 [api] `plan.yaml`: `Plan.filialId` → nullable, добавить `cfoId`
      (nullable integer). `plan-detail.yaml`: добавить `isCfoOwner`
      (boolean, required), `filial` — nullable. `plans.yaml` (`POST`) —
      `description` — «Доступно ролям FILIAL и CFO».
      `plans-human-id-send-to-dtoe.yaml` — `description` — ветка
      владельца-ЦФО. `npm run lint` из `api/`, при необходимости `npm run
      bundle`.

## 2. Backend

- [ ] 2.1 [backend] `entities/plan.entity.ts`: `filialId` → nullable,
      добавить `cfo`/`cfoId` (nullable, `type: 'int'`).
- [ ] 2.2 [backend] `database/seed.ts`: демо-план с `cfoId` заполненным.
- [ ] 2.3 [backend] Failing unit-тест `planning.service.spec.ts`: «ЦФО с
      `cfoId` создаёт план» / «ЦФО без `cfoId` получает 403» → реализовать
      расширение guard в `create()` → green.
- [ ] 2.4 [backend] Failing unit-тест: `sendToDtoe` для владельца-ЦФО из
      `DRAFT`/`RETURNED_BY_DTOE` → статус `UNDER_DTOE_REVIEW` → реализовать
      ветку `isCfoOwner` → green.
- [ ] 2.5 [backend] Failing unit-тест: `sendToDtoe` владельцем при
      неукомплектованном пакете → `400` → green.
- [ ] 2.6 [backend] Failing unit-тест: `checkAccess`/`findAll` — ЦФО-владелец
      видит и получает доступ к своему плану без `PlanCfoStatus` → green.
- [ ] 2.7 [backend] Failing unit-тест: `toDetailDto` возвращает `isCfoOwner`
      → green.
- [ ] 2.8 [backend] Failing unit-тест: `deletePlan` — автор-ЦФО удаляет
      собственный черновик → green.
- [ ] 2.9 [backend] `planning.controller.ts`: расширить `@Roles` на `POST
      /plans` до `(Role.FILIAL, Role.CFO)`.
- [ ] 2.10 [backend] `bun run lint`, `bun run test`, `bunx tsc --noEmit`
      чисто; ручной `bun -e` HTTP smoke-test в `infra-backend-1`.

## 3. Frontend

_(Начинать только после мержа `feat/planning-2027-frontend-create-detail` и
`feat/planning-2027-frontend-dashboard` в `dev` — см. `proposal.md`.)_

- [ ] 3.1 [frontend] Перегенерировать Kubb-клиент (обновлённые `Plan`,
      `PlanDetail`).
- [ ] 3.2 [frontend] `planning/create/page.tsx` — гвард
      `!["FILIAL", "CFO"].includes(user.role)`.
- [ ] 3.3 [frontend] `constants.ts` — пункт «Создать план» — `roles:
      ["FILIAL", "CFO"]`.
- [ ] 3.4 [frontend] Кабинет ЦФО модуля плана — кнопка «+ Создать план».
- [ ] 3.5 [frontend] Failing unit-тест `permissions.unit.test.ts`:
      `canSendToDtoeAsOwner` → реализовать → green.
- [ ] 3.6 [frontend] Failing component-тест: submit-панель для `isCfoOwner`
      → реализовать → green.
- [ ] 3.7 [frontend] `bun run typecheck`, `bun run lint`, `bun run test` —
      чисто/зелёные.
- [ ] 3.8 [frontend] Ручная проверка в браузере под
      `cfo.angnks@demo.local`/`dtoe@demo.local`.

## 4. Финализация

- [ ] 4.1 [openspec] Обновить `test-plan.md`.
- [ ] 4.2 [openspec] `openspec validate cfo-owned-plans --strict
      --no-interactive` (если/когда CLI доступен).
- [ ] 4.3 [openspec] Архивировать change после завершения секций 1–3 и
      обязательных проверок.
