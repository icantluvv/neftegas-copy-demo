# Test Plan

## Risk level
P1

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Скачивание файла версии ограничено ролями ЦФО и ДТОиР | ЦФО с доступом к корректировке скачивает файл | P0 | Unit | `corrections.service.spec.ts` | Done — подтверждено и `curl` |
| Скачивание файла версии ограничено ролями ЦФО и ДТОиР | ДТОиР скачивает файл | P0 | Unit | `corrections.service.spec.ts` | Done |
| Скачивание файла версии ограничено ролями ЦФО и ДТОиР | ЦФО без доступа к этой корректировке получает отказ | P1 | Unit | `corrections.service.spec.ts` | Done |
| Скачивание файла версии ограничено ролями ЦФО и ДТОиР | Филиал-владелец получает отказ, несмотря на доступ к корректировке | P0 | Unit | `corrections.service.spec.ts` | Done — подтверждено `curl` (было 200, стало 403) |
| Ссылка на открытие/скачивание файла в карточке корректировки | ЦФО/ДТОиР видит ссылку на название элемента и на текущую версию | P1 | Component | `package-completeness.component.test.tsx` | **Not covered** — план в `tasks.md`, 3.7 |
| Ссылка на открытие/скачивание файла в карточке корректировки | Филиал не видит ссылку ни на название элемента, ни на версию | P1 | Component | `package-completeness.component.test.tsx` | **Not covered** — поведение подтверждено ручной SSR-проверкой (`curl` + grep HTML под сессией Филиала: 0 вхождений ссылки) |
| ЦФО может отменить собственное решение по корректировке | Отмена согласования (`APPROVED`) возвращает статус ЦФО в `PENDING` и пересчитывает статус корректировки | P0 | Unit + Manual | `corrections.service.spec.ts` | Done — unit (guard) + подтверждено `curl` (`ALL_CFO_APPROVED`/`APPROVED` → `UNDER_CFO_REVIEW`/`PENDING`) |
| ЦФО может отменить собственное решение по корректировке | Отмена возврата (`RETURNED`) возвращает статус ЦФО в `PENDING` | P1 | Unit | `corrections.service.spec.ts` | Done — guard-тест |
| ЦФО может отменить собственное решение по корректировке | Замечания, оставленные этим ЦФО, не меняются при отмене | P1 | Manual | — | Done — подтверждено `curl` (замечание `REM-000003` осталось `CLOSED` после отмены `APPROVED`) |
| ЦФО может отменить собственное решение по корректировке | Отмена недоступна, пока решение не принято (`PENDING`) | P1 | Unit | `corrections.service.spec.ts` | Done |
| ЦФО может отменить собственное решение по корректировке | Отмена недоступна после передачи корректировки в ДТОиР | P0 | Unit | `corrections.service.spec.ts` | Done — подтверждено `curl` через повторный `cfo-approve`/`cfo-cancel` цикл до статуса передачи |
| ЦФО может отменить собственное решение по корректировке | Другая роль (Филиал) не может вызвать действие | P0 | Unit + Manual | `corrections.service.spec.ts` | Done — unit + `curl` (403) |
| ЦФО может отменить собственное решение по корректировке | Кнопка «Отменить решение» видна только ЦФО и только когда есть что отменять | P1 | Component | `remarks-list.component.test.tsx` | **Not covered** — план в `tasks.md`, 3.7 |
| Филиал может удалить собственную корректировку в статусе «Черновик» | Удаление `DRAFT` своего филиала успешно (`204`), запись реально удалена | P0 | Unit + Manual | `corrections.service.spec.ts` | Done — unit (транзакция вызвана, `delete(id)`) + `curl` (204, повторный `GET` → 404) |
| Филиал может удалить собственную корректировку в статусе «Черновик» | Физические версии файлов удаляются с диска вместе с записью | P2 | Unit | `corrections.service.spec.ts` | Done — `fs.unlink` вызывается для каждой версии (замокан, вызов подтверждён) |
| Филиал может удалить собственную корректировку в статусе «Черновик» | Удаление недоступно для любого статуса, кроме `DRAFT` | P0 | Unit + Manual | `corrections.service.spec.ts` | Done — unit (400, транзакция не начинается) + `curl` (400 на `ALL_CFO_APPROVED`) |
| Филиал может удалить собственную корректировку в статусе «Черновик» | Филиал не может удалить корректировку другого филиала | P0 | Unit + Manual | `corrections.service.spec.ts` | Done — unit (403) + `curl` (403) |
| Филиал может удалить собственную корректировку в статусе «Черновик» | Другая роль (ЦФО) не может вызвать удаление | P0 | Unit + Manual | `corrections.service.spec.ts` | Done — unit (403) + `curl` (403) |
| Филиал может удалить собственную корректировку в статусе «Черновик» | Крестик удаления виден только в строке со статусом «Черновик» | P1 | Component | `filial-corrections-overview.component.test.tsx` | **Not covered** — план в `tasks.md`, 3.7 |

## Required automated tests

### Unit
- [x] Backend: `corrections.service.spec.ts` — `downloadFileVersion` (роль CFO/DTOE — success, ЦФО без доступа — 403, Филиал-владелец — 403), `cancelCfoDecision` (PENDING — 400 «нечего отменять», статус после ДТОиР — 400, нет строки статуса ЦФО — 403, роль FILIAL — 403, guard проходит и транзакция вызывается для APPROVED/RETURNED вне статусов ДТОиР), `deleteCorrection` (статус не DRAFT — 400, чужой филиал — 403, роль CFO — 403, успешное удаление своего DRAFT — транзакция + `delete(id)`). 13/13 новых green (полный файл — 21/21, весь backend — 36/36, было 26 на входе в этот change).

### Component
- [ ] `PackageCompleteness` — ссылки скачивания (название элемента + версия) видны только `isReviewer`, ведут на URL текущей версии соответствующего слота. Не написан (см. `tasks.md`, 3.7); поведение подтверждено ручной SSR-HTML-проверкой (`curl` + grep) под сессиями ЦФО и Филиала.
- [ ] `RemarksList` — кнопка «Отменить решение» видна только при `canCancelCfoDecision`, клик вызывает `useCancelCfoDecision` с `{ humanId }`. Не написан; поведение подтверждено ручной HTTP-проверкой (`curl`).
- [ ] `FilialCorrectionsOverview` — крестик удаления виден только у строки со статусом «Черновик», клик вызывает `useDeleteCorrection` и после успеха строка пропадает из таблицы (инвалидация query). Не написан; поведение данных подтверждено ручной HTTP-проверкой (`curl`), поведение таблицы в браузере (реакция на инвалидацию) — нет.

### Integration
_(не вводится — см. `apps/frontend/AGENTS.md`)_

### E2E
- [ ] Happy path (карточка): `/corrections/{humanId}` под ролью CFO → клик по названию элемента пакета в «Комплектность пакета» → файл открывается в новой вкладке → в общей панели действий клик «Согласовать» → появляется кнопка «Отменить решение» → клик → статус ЦФО возвращается к «На проверке», кнопка «Согласовать» снова доступна.
- [ ] Happy path (дашборд): `/dashboard` под ролью FILIAL → «Создать корректировку» → черновик появляется в таблице «Мои корректировки» с крестиком → клик по крестику → строка пропадает из таблицы без перезагрузки страницы.

### Backend
- [x] `corrections.service.spec.ts` (см. Unit выше).
- [ ] e2e (`*.e2e-spec.ts`): `GET /files/{id}/download` под Филиалом-владельцем → `403`; `POST /corrections/{humanId}/cfo-cancel` дважды подряд → второй запрос `400`; `DELETE /corrections/{humanId}` на `DRAFT` → `204`, повторный `GET` того же `humanId` → `404`; `DELETE` на направленной корректировке → `400`. Эквивалент проверен вручную через `curl` (см. Manual checks), формальный e2e-тест не написан — тот же пробел, что уже задокументирован в `cfo-cabinet/test-plan.md`.

## Manual checks
- [x] Ручная HTTP-проверка через `curl` под демо-аккаунтами
  `filial.donbassgaz@demo.local`, `filial.luganskgaz@demo.local` и
  `cfo.angnks@demo.local` против поднятого `docker compose` dev-стека
  (детали — `tasks.md`, 4.3): скачивание файла версии для ДТОиР (200), для
  ЦФО без доступа к конкретной корректировке (403), для Филиала-владельца
  (403, было 200 до этого change); отмена решения ЦФО — цикл `cfo-approve` →
  `cfo-cancel` → проверка статуса корректировки и ЦФО → повторный
  `cfo-cancel` (400) → восстановление через повторный `cfo-approve`; вызов
  `cfo-cancel` под ролью Филиал (403); удаление — создание `DRAFT` → `DELETE`
  → `204` → повторный `GET` → `404`; `DELETE` направленной корректировки её
  же владельцем → `400`; `DELETE` чужого `DRAFT` (другой филиал) → `403`;
  `DELETE` под ролью CFO → `403`.
- [x] Ручная SSR-HTML-проверка видимости ссылок на скачивание: `curl` страницы
  `/corrections/COR-000001` под сессией ЦФО (`cookies-cfo-angnks.txt`) и под
  сессией Филиала (`cookies-filial.txt`), `grep -c "files/3/download"` —
  4 вхождения (label + версия для 4 слотов) у ЦФО, 0 у Филиала.
- [ ] Визуальная проверка в браузере (клик по ссылке, клик по кнопке
  «Отменить решение», клик по крестику удаления, наблюдение изменения UI без
  перезагрузки) — не выполнена в этой сессии, см. Gaps.

## Gaps (на момент фиксации)

Backend полностью покрыт и проверен: unit-тесты (`corrections.service.spec.ts`,
36/36 green во всём backend) написаны вместе с каждым guard'ом (TDD соблюдён
для backend), `bunx tsc --noEmit` — 0 ошибок, `redocly lint` — валиден без
новых ошибок. Живая ручная HTTP-проверка через `curl` пройдена для всех
сценариев P0/P1, включая физическое подтверждение удаления (повторный `GET`
после `DELETE` → `404`).

Frontend — реализация написана и типизирована (`bunx tsc --noEmit` — 0
ошибок), поведение по данным подтверждено ручной SSR-HTML-проверкой (видимость
ссылок по роли) и HTTP-проверкой (удаление), но:
1. Component-тесты (`package-completeness.component.test.tsx`,
   `remarks-list.component.test.tsx`, `filial-corrections-overview.component.test.tsx`)
   не написаны в этой сессии.
2. Ни один тест в браузере не может быть запущен в текущем dev-окружении —
   `apps/frontend` собран на `oven/bun:1-alpine` (musl), а
   `@vitest/browser-playwright` требует `chrome-headless-shell`, чьи
   бинарники собраны под glibc (`libglib-2.0.so.0: cannot open shared object
   file`). `bunx playwright install --with-deps` не работает в Alpine (нет
   `apt-get`, только `apk`). Это отдельная инфраструктурная проблема образа
   (не специфична для этого change — `cfo-cabinet` столкнулась с похожим,
   но там просто не хватало самого бинарника Chromium, а не системных
   библиотек), решение — перевод dev-образа фронтенда на Debian-based или
   ручная установка `apk add` эквивалентов зависимостей Chromium под musl.

Оба пункта блокируют архивацию change по правилу `openspec/config.yaml`
(«для P0/P1 отсутствие покрытия блокирует завершение change») до выполнения
`tasks.md`, 3.7/3.8/4.4 либо оформления явного waiver с обоснованием.

## Test data
- Существующие backend seed-аккаунты (`apps/backend/src/database/seed.ts`):
  4 филиала × 17 ЦФО, по одному FILIAL/CFO-аккаунту на каждый, плюс
  `dtoe@demo.local`. Пароль для всех — `Password123`.
- Для ручной проверки — `cfo.angnks@demo.local` (привязан к COR-000001,
  статус `APPROVED`/`ALL_CFO_APPROVED` на момент фиксации этого test-plan),
  `filial.donbassgaz@demo.local` (владелец COR-000001) и
  `filial.luganskgaz@demo.local` (использован для кросс-филиальной проверки
  удаления чужого `DRAFT`).

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices
- Встроенный просмотрщик содержимого файла (PDF/Excel preview) — см. `design.md`, Non-Goals
- Отмена решения ДТОиР (`dtoe-cancel`) — см. `design.md`, Non-Goals
- Удаление направленной (не `DRAFT`) корректировки в любом виде (hard или soft) — см. `design.md`, Non-Goals

## Verification commands
- [ ] `openspec validate correction-review-safeguards --strict --no-interactive` — CLI недоступен ни на хосте, ни в контейнерах
- [x] api: `npx @redocly/cli@2.37.0 lint` (на хосте) — валиден, 0 новых ошибок
- [x] backend: `bunx tsc --noEmit` (в контейнере) — 0 ошибок
- [x] backend: `bun run test` (в контейнере) — 36/36 green
- [ ] backend: `eslint` — не выполнено отдельно (покрыто `tsc`, не запускалось явно)
- [ ] backend: `npm run test:e2e` — не выполнено
- [x] frontend: `bunx tsc --noEmit` (в контейнере) — 0 ошибок
- [ ] frontend: `bun run lint` — не выполнено отдельно в этой сессии
- [ ] frontend: `bun run test` — не выполнено (см. Gaps — Playwright не запускается в Alpine dev-образе)
- [ ] frontend: `bun run build` — не выполнено (dev-режим, production-сборка не проверялась)
