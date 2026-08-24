## 1. API

- [x] 1.1 [api] Новый путь `POST /corrections/{humanId}/cfo-cancel`
  (`api/src/paths/corrections-human-id-cfo-cancel.yaml`), зарегистрирован в
  `openapi.yaml`. Описание `GET /files/{id}/download`
  (`api/src/paths/files-id-download.yaml`) дополнено — доступ ограничен
  ролями CFO/DTOE. `npx @redocly/cli@2.37.0 lint` из `api/` — валиден, без
  новых ошибок (43 преэкзистентных `operation-4xx-response` warning'а, те же,
  что и в `cfo-cabinet`).
- [x] 1.2 [api] `delete:` для `DELETE /corrections/{humanId}` добавлен в уже
  существующий `api/src/paths/corrections-human-id.yaml` (тот же path, что
  и `get:`) — новой записи в `openapi.yaml` не требуется, path уже
  зарегистрирован. `npx @redocly/cli@2.37.0 lint` — повторно подтверждён
  валидным после правки, без новых ошибок.

## 2. Backend

- [x] 2.1 [backend] `corrections.service.ts`: `downloadFileVersion` —
  добавлена проверка `user.role === CFO || DTOE` после `checkAccess`, до
  чтения файла с диска.
- [x] 2.2 [backend] `corrections.service.ts`: `cfoApprove` — добавлена
  проверка `myStatus.status === PENDING` (`BadRequestException`), пробел
  обнаружен при разведке этого change (см. `proposal.md`, Why) — тот же
  класс, что уже закрыт для `cfoReturn` в `cfo-cabinet`.
- [x] 2.3 [backend] `corrections.service.ts`: новый метод `cancelCfoDecision`
  (после `cfoReturn`) — guard роли/наличия статуса (`403`), guard `status !==
  PENDING` (`400`, «нечего отменять»), guard `correction.status` не в
  `[UNDER_DTOE_REVIEW, RETURNED_BY_DTOE, APPROVED_BY_DTOE]` (`400`, «уже
  передана в ДТОиР»); в транзакции — откат `CorrectionCfoStatus` в `PENDING`,
  запись в историю, `recomputeStatusAfterCfoAction`.
- [x] 2.4 [backend] `corrections.controller.ts`: новый маршрут
  `POST :humanId/cfo-cancel` (`@Roles(Role.CFO)`).
- [x] 2.5 [backend] `corrections.service.spec.ts` расширен (написано вместе с
  guard'ами, TDD соблюдён): `downloadFileVersion` — ДТОиР успешно (200), ЦФО
  без доступа к этой корректировке (403), Филиал-владелец, несмотря на доступ
  к корректировке (403); `cancelCfoDecision` — статус уже `PENDING` (400),
  корректировка уже в ДТОиР (400), нет строки статуса ЦФО (403, не 400),
  роль FILIAL (403), guard проходит и транзакция вызывается для `APPROVED`
  и для `RETURNED` вне статусов ДТОиР.
- [x] 2.6 [backend] `corrections.service.ts`: новый метод `deleteCorrection`
  (после `create`) — guard роли/владения филиалом (`403`), guard `status !==
  DRAFT` (`400`); в транзакции — `manager.getRepository(Correction).delete(id)`
  (каскад БД удаляет слоты/версии/статусы ЦФО/замечания/историю/уведомления);
  после транзакции — `fs.unlink` для каждой физической версии файла
  (best-effort, ошибки не блокируют).
- [x] 2.7 [backend] `corrections.controller.ts`: новый маршрут
  `DELETE :humanId` (`@Roles(Role.FILIAL)`, `@HttpCode(204)`), размещён сразу
  после `GET :humanId`.
- [x] 2.8 [backend] `corrections.service.spec.ts` расширен: `deleteCorrection`
  — статус не `DRAFT` (400, транзакция не начинается), корректировка чужого
  филиала (403), роль CFO (403), успешное удаление `DRAFT` своего филиала
  (транзакция вызвана 1 раз, `delete` вызван с правильным id). `buildCorrection`
  дополнен полями `filialId`/`slots` для этих тестов.
- [x] 2.9 [backend] Прогнать `bun run test` из `apps/backend` — выполнено
  внутри dev-контейнера (`docker restart infra-backend-1` перед прогоном —
  `nest start --watch` не подхватывал правки файлов через bind-mount, тот же
  известный класс проблемы, что уже задокументирован в `cfo-cabinet/tasks.md`,
  3.3.10). 36/36 тестов green во всём backend (было 26 на входе в этот
  change, +13 в `corrections.service.spec.ts`: 3 `downloadFileVersion`, 6
  `cancelCfoDecision`, 4 `deleteCorrection`; файл — 21/21). `bunx tsc
  --noEmit` — 0 ошибок.

## 3. Frontend

- [x] 3.1 [frontend] `package-completeness.tsx`: `CurrentVersionCell`
  получила проп `canDownload` и рендерит ссылку «Открыть / скачать» на
  `${NEXT_PUBLIC_BACK_URL}/files/{id}/download`, видна только при
  `canDownload`. Новый `SlotLabelCell` делает название элемента (колонка
  «Элемент») тоже кликабельной ссылкой на ту же версию файла, когда
  `canDownload` и есть `currentVersion` — иначе рендерит обычный текст. Обе
  ячейки получают `canDownload={isReviewer}` (`detail.isCfoReviewer ||
  detail.isDtoe`) из родительского компонента.
- [x] 3.2 [frontend] `lib/permissions.ts`: новая `canCancelCfoDecision(detail)`
  — `true`, только если `detail.isCfoReviewer`, `detail.myCfoStatus.status`
  ∈ `{APPROVED, RETURNED}`, и `detail.status` НЕ в
  `[UNDER_DTOE_REVIEW, RETURNED_BY_DTOE, APPROVED_BY_DTOE]`.
- [x] 3.3 [frontend] Kubb-клиент для `cancelCfoDecision` — `bun`/kubb
  недоступны в рабочем окружении этой сессии (та же проблема, что и в
  `cfo-cabinet`); файлы `types/correctionsController/CancelCfoDecision.ts`,
  `zod/correctionsController/cancelCfoDecisionSchema.ts`,
  `clients/correctionsController/cancelCfoDecision.ts`,
  `hooks/correctionsController/useCancelCfoDecision.ts`,
  `mocks/correctionsController/createCancelCfoDecision.ts` созданы вручную
  по образцу уже сгенерированных `*ReturnCorrectionByCfo*` (тот же формат
  вывода Kubb) и зарегистрированы в барреле `packages/api/base/codegen/index.ts`.
  Уже существующие сгенерированные файлы не редактировались.
- [x] 3.4 [frontend] `remarks-list.tsx`: `RemarksActionBar` получила кнопку
  «Отменить решение» (`variant="outline"`, вызывает
  `useCancelCfoDecision({ humanId })`), видна при `canCancelCfoDecision(detail)`.
- [x] 3.5 [frontend] Kubb-клиент для `deleteCorrection` — та же ручная
  генерация по образцу (см. 3.3), на этот раз по шаблону уже существующего
  `deleteRemark` (тоже `DELETE`, `204`, `unknown`-схема ответа): `types/`,
  `zod/`, `clients/`, `hooks/useDeleteCorrection.ts`,
  `mocks/createDeleteCorrection.ts`, зарегистрированы в барреле.
- [x] 3.6 [frontend] `filial-corrections-overview.tsx`: новая
  `DeleteDraftCorrectionCell` (крестик-иконка, без диалога подтверждения —
  тот же UX, что уже принят для «Удалить» замечания в `remarks-list.tsx`),
  вызывает `useDeleteCorrection`, инвалидирует
  `getCorrectionsQueryKey({ pageSize: 100 })` при успехе (тот же ключ, что у
  `useGetCorrections` в этом компоненте). В колонке `actions` рендерится
  рядом с «Открыть» только когда `row.original.status === "DRAFT"`.
- [ ] 3.7 [frontend] Component-тесты: `package-completeness.component.test.tsx`
  (видимость ссылок скачивания по `isReviewer`, ссылка на название элемента и
  на версию ведут на один и тот же `id`), `remarks-list.component.test.tsx`
  (видимость кнопки «Отменить решение» по статусу ЦФО/корректировки, клик
  вызывает мутацию с `{ humanId }`),
  `filial-corrections-overview.component.test.tsx` (крестик виден только у
  строки `DRAFT`, клик вызывает `deleteCorrection` и убирает строку из
  таблицы) — НЕ написаны в этой сессии, см. `test-plan.md`, Gaps.
- [ ] 3.8 [frontend] Прогнать `bun run test`/`bunx tsc --noEmit`/`bun run lint`
  из `apps/frontend` — `tsc --noEmit` выполнен (0 ошибок, см. 4.2); `bun run
  test` (component/Playwright) не выполнен — dev-образ фронтенда на
  Alpine/musl, `chrome-headless-shell` не запускается
  (`libglib-2.0.so.0: cannot open shared object file`), `bunx playwright
  install --with-deps` в Alpine не работает штатно (нет `apt`). Тот же класс
  ограничения окружения, что и в `cfo-cabinet` (там не хватало самого
  Chromium — в этой сессии Chromium доустановлен, но не запускается из-за
  отсутствия системных библиотек под Alpine). Требует либо перевода
  dev-образа фронтенда на Debian-based, либо ручной установки зависимостей
  Chromium под musl — отдельная задача, вне scope этого change (см. Open
  Questions в `design.md` — не добавлено туда намеренно, это техническая
  инфраструктурная проблема, а не открытый продуктовый вопрос).

## 4. Верификация и завершение

- [ ] 4.1 [openspec] `openspec validate correction-review-safeguards --strict
  --no-interactive` — не выполнено: CLI `openspec` недоступен ни на хосте,
  ни в контейнерах (`npx openspec` не резолвится, тот же результат, что и в
  `cfo-cabinet/tasks.md`, 5.1).
- [x] 4.2 [root] Backend `bunx tsc --noEmit` (0 ошибок) + `bun run test`
  (36/36) — внутри dev-контейнера. Frontend `bunx tsc --noEmit` (0 ошибок) —
  внутри dev-контейнера.
- [x] 4.3 [root] Ручная HTTP-проверка через `curl` под демо-аккаунтами
  (`filial.donbassgaz@demo.local`, `filial.luganskgaz@demo.local`,
  `cfo.angnks@demo.local`) против поднятого `docker compose` dev-стека:
  - `GET /files/{id}/download`: ДТОиР → 200 (содержимое отдано); ЦФО, не
    привязанный к этой корректировке → 403; Филиал-владелец файла → 403
    (было 200 до этого change).
  - `POST /corrections/{humanId}/cfo-cancel` на COR-000001 (был в статусе
    `ALL_CFO_APPROVED`, ЦФО АНГНКС — `APPROVED`): вызов → `200`, статус
    корректировки → `UNDER_CFO_REVIEW`, `myCfoStatus.status` → `PENDING`,
    `decidedById`/`decidedAt` → `null`; замечание `REM-000003`, закрытое
    при согласовании, осталось `CLOSED` (подтверждает Decision «отмена не
    трогает замечания»); запись в историю добавлена. Повторный вызов сразу
    после → `400` («Решение по этой корректировке ещё не принято — отменять
    нечего»). Вызов от `filial.donbassgaz@demo.local` → `403` (роль).
    Демо-данные восстановлены повторным `POST /cfo-approve` после проверки.
  - `DELETE /corrections/{humanId}`: `filial.donbassgaz@demo.local` создаёт
    `DRAFT` (`POST /corrections`) → `DELETE` того же `humanId` → `204` →
    повторный `GET` → `404` (запись реально удалена). `DELETE` направленной
    COR-000001 (`ALL_CFO_APPROVED`) её же владельцем → `400`. Отдельный
    `DRAFT`, созданный `filial.luganskgaz@demo.local` → `DELETE` от
    `filial.donbassgaz@demo.local` (чужой филиал) → `403`; `DELETE` от
    `cfo.angnks@demo.local` (роль CFO) → `403`; `DELETE` от владельца
    (`filial.luganskgaz@demo.local`) → `204` (самоочистка тестовых данных).
  - Визуальная проверка в браузере (клик по ссылке/кнопке/крестику) не
    выполнена — см. 3.8.
- [ ] 4.4 [frontend] Написать недостающие тесты 3.7 либо оформить явный
  waiver — единственный оставшийся пробел P1 перед архивацией (наряду с
  доступностью Playwright в dev-образе, см. 3.8); данные и API-поведение
  проверены вручную (4.3), поведение ссылок/кнопок/крестика в браузере —
  нет.
