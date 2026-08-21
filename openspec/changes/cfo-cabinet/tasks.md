## 1. API

- [x] 1.1 [api] Подтвердить, что контракт не меняется: `RemarkCreateInput.relatedSlotId`,
  `GET /corrections` (фильтры `filialId`/`status`/`cfoId`), `GET /corrections/stats/cfo`
  уже описаны в `api/src/openapi.yaml` и реализованы на бэкенде до начала этого
  change — `npm run lint` из `api/` не выполнен в этом окружении (нет `node_modules`
  в `api/`, см. `test-plan.md`, Gaps), контракт визуально сверен построчно с
  `apps/backend/src/corrections/corrections.controller.ts` и Kubb-типами.

## 2. Backend

- [x] 2.1 [backend] Обнаружен guard-баг: `cfoApprove`/`cfoReturn`
  (`corrections.service.ts`) не проверяли `myStatus.status === PENDING` — второй
  вызов (повторное согласование/возврат) проходил успешно. Добавлена проверка
  (`BadRequestException`, стиль согласован с `sendToDtoe`) до входа в транзакцию
  в обоих методах.
- [x] 2.2 [backend] Написан unit-тест `corrections.service.spec.ts` (новый файл —
  первый unit-тест `CorrectionsService` в проекте): повторный `cfoApprove` после
  `APPROVED` → `BadRequestException`, транзакция не начинается; повторный
  `cfoReturn` после `RETURNED` → аналогично; `cfoApprove` без строки статуса ЦФО
  → `ForbiddenException` (403, не 400) — не соблюдён TDD-порядок (тест написан
  вместе с исправлением, не до него, но до его прогона в этой сессии).
- [x] 2.3 [backend] Прогнать `bun run test` из `apps/backend` — выполнено внутри
  dev-контейнера (`docker compose -f infra/docker-compose.yml -f
  infra/docker-compose.dev.yml exec backend bun run test`), после исправления
  `as User` → `as unknown as User` в тестовых фикстурах (TS2352 при `bunx tsc
  --noEmit`, обнаружено только реальной компиляцией). 18/18 тестов green,
  `bunx tsc --noEmit` — 0 ошибок.

## 3. Frontend

### 3.1 Кабинет ЦФО (`/dashboard`)

- [x] 3.1.1 [frontend] Реализован `cfo-corrections-overview.tsx` (по образцу
  `filial-corrections-overview.tsx`): `useGetCorrections({ pageSize: 100 })`,
  донат по `item.myCfoStatus` (3 группы), два независимых `Select`-фильтра
  (статус ЦФО / филиал, список филиалов выводится клиентски), таблица с
  колонками ID/Филиал/Тип/Статус пакета/Статус ЦФО/Изменено/Открыть, пустое
  состояние.
- [x] 3.1.2 [frontend] `cfo-dashboard.tsx`: подписи плиток приведены к
  формулировкам ЧТЗ («Всего направлено»/«На проверке у нас»/«Мы вернули»/«Мы
  согласовали») с цветовым акцентом (`tone`), подключён `CfoCorrectionsOverview`.
- [ ] 3.1.3 [frontend] Падающий component-тест `cfo-corrections-overview.component.test.tsx`
  (пустое состояние; независимость фильтра статуса и фильтра филиала; клик по
  сегменту графика; повторный клик сбрасывает фильтр; кнопка «Открыть») — не
  написан, тот же класс пробела, что уже задокументирован для
  `FilialCorrectionsOverview` (`filial-corrections-overview/test-plan.md`, Gaps).
  Ручная HTTP-проверка выполнена вместо автотеста (см. 5.3) — покрывает данные,
  не покрывает поведение фильтров/клика по графику в браузере.

### 3.2 Кнопка «Оставить замечание к элементу» — перенос в строку пакета

_(формально относится к уже открытому change `correction-detail-page`, см.
`proposal.md`, Why — задачи здесь для прослеживаемости кода, написанного в
рамках текущей работы; статусы задач продублированы в
`correction-detail-page/tasks.md`.)_

- [x] 3.2.1 [frontend] `return-remark-dialog.tsx`: добавлены пропы `slotId`/`slotLabel`,
  `relatedSlotId` зашивается в payload при сабмите, заголовок и текст кнопки
  меняются на «Замечание к элементу: …» / «Сохранить замечание», когда переданы.
- [x] 3.2.2 [frontend] `package-completeness.tsx`: новый `LeaveRemarkCell`,
  рендерится в колонке действий рядом с `UploadSlotFileCell`, видим при
  `canReturnAsCfo(detail) || canReturnAsDtoe(detail)`, использует
  `useReturnCorrectionByCfo`/`useReturnCorrectionByDtoe` напрямую (тот же
  паттерн локальной мутации, что уже у `UploadSlotFileCell`).
- [x] 3.2.3 [frontend] `remarks-list.tsx`: `RemarksActionBar` избавлен от
  глобальных `ReturnRemarkDialog` для CFO/DTOE (кнопки переехали в строку
  пакета) — остались только «Согласовать»/«Направить в ДТОиР»/«Согласовать
  (ДТОиР)».
- [x] 3.2.4 [frontend] Обновлены тесты: `package-completeness.component.test.tsx`
  (видимость кнопки по роли/статусу, `relatedSlotId` в payload мутации),
  `remarks-list.component.test.tsx` (убраны неиспользуемые моки
  `useReturnCorrectionByCfo`/`useReturnCorrectionByDtoe`).
- [x] 3.2.5 [frontend] Прогнать `bun run test`/`bunx tsc --noEmit`/`bun run lint`
  из `apps/frontend` — выполнено внутри dev-контейнера (после установки
  Chromium: `bunx playwright install --with-deps chromium`, отсутствовал в
  образе). `tsc` — 0 ошибок; `lint` — 0 ошибок/предупреждений в изменённых
  файлах (152 ошибки/варнинга — преэкзистентный долг в `packages/api/base/codegen/**`
  и тестовых моках, не в scope этого change); `test` — 27/27 файлов, 126/126
  тестов green, включая новые сценарии в `package-completeness.component.test.tsx`
  (видимость кнопки, `relatedSlotId` в payload) и обновлённый
  `remarks-list.component.test.tsx`.

## 3.3 Разделение «оставить замечание» / «финализировать возврат» (по запросу пользователя после ручной проверки)

_(формально относится к `correction-detail-page`, см. `proposal.md`, Why —
пользователь протестировал первую версию 3.2 вживую и явно попросил разрешить
несколько замечаний за один заход, прежде чем возврат зафиксируется.)_

- [x] 3.3.1 [api] Новый путь `POST /corrections/{humanId}/remarks` (`leaveRemark`,
  `api/src/paths/corrections-human-id-remarks.yaml`), зарегистрирован в
  `openapi.yaml`. `requestBody` убран из `corrections-human-id-cfo-return.yaml`/
  `corrections-human-id-dtoe-return.yaml` — эндпоинты больше не принимают тело.
  `npx @redocly/cli lint api/src/openapi.yaml` — валиден, без новых ошибок.
- [x] 3.3.2 [backend] `corrections.service.ts`: новый `leaveRemark` (создаёт
  `Remark(OPEN)`, не меняет статусы); `cfoReturn`/`dtoeReturn` переписаны —
  без параметра `dto`, требуют ≥1 `OPEN`-замечания текущего проверяющего
  (`400` иначе), уведомление филиала со списком всех замечаний одним
  сообщением. `dtoeReturn` дополнительно получил guard
  `correction.status === UNDER_DTOE_REVIEW` (раньше отсутствовал — та же
  категория пробела, что и в `cfoApprove`/`cfoReturn`, см. `proposal.md` Why).
- [x] 3.3.3 [backend] `corrections.controller.ts`: новый маршрут
  `POST :humanId/remarks` (`@Roles(CFO, DTOE)`), `cfoReturn`/`dtoeReturn`
  обработчики — без `@Body()`.
- [x] 3.3.4 [backend] `corrections.service.spec.ts` расширен: guard'ы
  `leaveRemark` (CFO не PENDING, DTOE не UNDER_DTOE_REVIEW, роль FILIAL);
  `cfoReturn` без замечаний → 400; `cfoReturn` игнорирует чужие замечания при
  проверке наличия своих. 23/23 теста green (было 18).
- [x] 3.3.5 [frontend] Kubb-регенерация (`bun run generate` в
  `apps/frontend/packages/api`, внутри dev-контейнера — `api/` пришлось
  скопировать в контейнер отдельно, т.к. bind-mount `docker-compose.dev.yml`
  монтирует только `apps/frontend`) — новые `useLeaveRemark`,
  `useReturnCorrectionByCfo`/`useReturnCorrectionByDtoe` без `data` в аргументах.
- [x] 3.3.6 [frontend] `permissions.ts`: `canReturnAsCfo`/`canReturnAsDtoe`
  переименованы в `canLeaveRemarkAsCfo`/`canLeaveRemarkAsDtoe` (логика не
  изменилась); новые `canFinalizeReturnAsCfo`/`canFinalizeReturnAsDtoe`
  (требуют `detail.remarks` с `OPEN`-замечанием текущего проверяющего).
- [x] 3.3.7 [frontend] `package-completeness.tsx`: `LeaveRemarkCell` вызывает
  `useLeaveRemark` вместо `useReturnCorrectionByCfo`/`Dtoe`, гейт —
  `canLeaveRemarkAsCfo`/`Dtoe` (кнопка больше не пропадает после первого
  замечания).
- [x] 3.3.8 [frontend] `remarks-list.tsx`: кнопка «Вернуть на доработку»
  возвращена в `RemarksActionBar` (действие уровня корректировки, не
  элемента), вызывает `useReturnCorrectionByCfo`/`Dtoe` без данных формы,
  гейт — `canFinalizeReturnAsCfo`/`Dtoe`.
- [x] 3.3.9 [frontend] Тесты обновлены/добавлены: `permissions.unit.test.ts`
  (+6, переименованные + `canFinalizeReturnAsCfo`/`Dtoe`, 31 всего),
  `package-completeness.component.test.tsx` (+1 — кнопка не пропадает после
  первого замечания, 8 всего), `remarks-list.component.test.tsx` (+2 — новая
  кнопка видна/скрыта, 9 всего).
- [x] 3.3.10 [root] Полная перепроверка внутри dev-контейнеров: backend
  `bunx tsc --noEmit` (0 ошибок) + `bun run test` (23/23); frontend
  `bunx tsc --noEmit` (0 ошибок) + `bun run lint` (0 в изменённых файлах) +
  `bun run test` (27/27 файлов, 135/135 тестов). Обнаружено и исправлено:
  `nest start --watch` не подхватывал изменения файлов через bind-mount
  (типичная проблема file-watcher на Windows/OneDrive) — потребовался
  `docker compose restart backend`.
- [x] 3.3.11 [root] Живая проверка через `curl` под `cfo.angnks@demo.local`:
  два замечания подряд к разным элементам (COR-000009) — статус корректировки
  и статус ЦФО остаются без изменений между вызовами (`UNDER_CFO_REVIEW`/
  `PENDING`); финализация без единого замечания → `400` («Нельзя вернуть на
  доработку без ни одного оставленного замечания»); финализация после двух
  замечаний → `RETURNED_FOR_REVISION`/`RETURNED`.

## 4. Документация

- [x] 4.1 [root] `docs/tz/cfo-cabinet.md` — ЧТЗ v1.0 «Кабинет ЦФО» сохранён как
  markdown по формату `docs/tz/filial-cabinet.md`.
- [x] 4.2 [openspec] Правки в артефактах открытого change `correction-detail-page`
  (`spec.md` — уточнение Requirement «Возврат корректировки с замечанием»;
  `tasks.md` — задачи 2.1, 3.7.5; `test-plan.md` — обновлены строки покрытия и
  Manual checks) — см. обоснование в `proposal.md`, Why.

## 5. Верификация и завершение

- [ ] 5.1 [openspec] `openspec validate cfo-cabinet --strict --no-interactive` —
  не выполнено: CLI `openspec` недоступен ни на хосте, ни в контейнерах
  (`npx openspec` не резолвится).
- [x] 5.2 [root] Обнаружилось, что уже запущенный docker-стек был примонтирован
  из другой директории (`OneDrive/Desktop/GasDashboard`, старый чекаут) — не
  из `neftegas-dev`, где велась разработка. Пересобран и перезапущен
  (`docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml
  up -d --build`) с верным bind-mount. После этого выполнено:
  backend `bunx tsc --noEmit` (0 ошибок) + `bun run test` (18/18);
  frontend `bunx tsc --noEmit -p tsconfig.json` (0 ошибок) + `bun run lint`
  (0 в изменённых файлах) + `bun run test` (27/27 файлов, 126/126 тестов,
  включая component-тесты — потребовалась доустановка Chromium в контейнере,
  см. 3.2.5). Единственное найденное и исправленное расхождение — TS2352 в
  `corrections.service.spec.ts` (см. 2.3).
- [x] 5.3 [root] Ручная HTTP-проверка под демо-аккаунтами (`filial.donbassgaz@demo.local`,
  `cfo.angnks@demo.local`) через `curl`: создана и направлена корректировка
  COR-000003 двум ЦФО (АНГНКС согласовал → `myCfoStatus=APPROVED` при общем
  статусе `PARTIALLY_APPROVED`, подтверждает разведение «статус пакета» /
  «статус ЦФО»); повторный `cfo-approve` → `400` (guard живьём); создана
  COR-000004, `cfo-return` с `relatedSlotId=14` → замечание сохранено с этой
  привязкой (проверено чтением ответа API) — подтверждает исправление из Why.
  `GET /corrections/stats/cfo` и `GET /corrections?pageSize=100` возвращают
  ожидаемую форму с `myCfoStatus` для обеих корректировок.
- [ ] 5.4 [root] Написать недостающий тест 3.1.3 (`CfoCorrectionsOverview`)
  либо оформить явный waiver — единственный оставшийся пробел P1 перед
  архивацией (P0/P1 автотесты по `openspec/config.yaml`); данные и API этого
  компонента проверены вручную (5.3), поведение фильтров/графика в браузере —
  нет.
