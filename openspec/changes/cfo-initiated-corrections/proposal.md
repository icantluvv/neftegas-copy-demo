## Why

Сейчас единственный инициатор корректировки — Филиал: он создаёт `Correction`,
направляет её выбранным ЦФО, после согласования всех ЦФО — направляет в ДТОиР.
ЦФО и ДТОиР выступают только проверяющими, никогда — инициаторами.

Бизнес-запрос: ЦФО тоже должен уметь создавать корректировку и направлять её
либо одному/нескольким Филиалам (которые тогда согласовывают/возвращают её так
же, как сейчас это делает ЦФО по отношению к филиалу), либо сразу в ДТОиР —
минуя цикл согласования, тем же финальным статусом ДТОиР, что и сегодня.

Отдельно поднят вопрос «ДТОиР числится как ЦФО». Разведка показала, что это не
так: ДТОиР — самостоятельное значение `Role`, не строка в таблице `cfos`, без
`cfoId` у пользователя ДТОиР (`apps/backend/src/database/seed.ts`). Решение,
принятое с пользователем: завести ДТОиР 18-й строкой в `cfos`, чтобы он
фигурировал в общих списках/пикере точек назначения наравне с обычными ЦФО, но
финальное решение по корректировке по-прежнему принимается существующими
`dtoeApprove`/`dtoeReturn` (не через per-CFO цикл `CorrectionCfoStatus`) — так
не переписывается уже работающая и уже архивированная (`session-based-auth`,
`sidebar-nav-and-role-dashboard`) финальная логика ДТОиР.

Также зафиксировано отставание кабинета ДТОиР от кабинета ЦФО: `DtoeDashboard`
(`apps/frontend/app/(private)/dashboard/components/dtoe-dashboard.tsx`) сейчас
только 6 плиток статистики, без донат-графика, фильтров и таблицы направленных
корректировок — при том что `CfoDashboard`+`CfoCorrectionsOverview` уже
получили это в рамках `cfo-cabinet`. Кабинет ДТОиР технически уже существует
отдельно от кабинета ЦФО (свой `kind: "dtoe"` в
`apps/frontend/app/(private)/dashboard/constants.ts`), но не имеет паритета
функциональности.

## What Changes

- **Backend, модель данных**: `Correction` получает поля `initiatorKind`
  (`FILIAL`/`CFO`), `initiatorFilialId`, `initiatorCfoId`, `targetKind`
  (`FILIAL`/`DTOE`); `filialId` становится nullable (сохраняет смысл «филиал-
  владелец» только для `initiatorKind = FILIAL`). Новая сущность
  `CorrectionFilialStatus` — зеркало `CorrectionCfoStatus`, независимый статус
  проверки каждого филиала в маршруте корректировки, инициированной ЦФО.
  `Remark` получает `filialId` — третий источник замечания (ЦФО / Филиал-
  проверяющий / ДТОиР, когда оба пусты).
- **Backend, сид**: 18-я строка в справочнике `cfos` — «ДТОиР» — не линкуется
  через `FilialCfoLink` (не участвует в обычном цикле филиал→ЦФО), нужна
  только как запись-цель в пикере направления ЦФО-инициатора.
- **Backend, создание**: `POST /corrections` доступен ролям `FILIAL` и `CFO`
  (было — только `FILIAL`); `initiatorKind` определяется ролью автора.
- **Backend, направление ЦФО-инициатором**: новый `POST
  /corrections/{humanId}/send-as-cfo` (роль `CFO`, только автор корректировки)
  с телом `{ target: FILIAL | DTOE, filialIds?: number[] }`. Ветка `FILIAL` —
  создаёт `CorrectionFilialStatus` для каждого филиала, статус корректировки →
  `UNDER_FILIAL_REVIEW`. Ветка `DTOE` — статус → `UNDER_DTOE_REVIEW` напрямую
  (тот же финальный цикл ДТОиР, что и сегодня).
- **Backend, действия филиала-проверяющего** — зеркало действий ЦФО: новые
  `POST /corrections/{humanId}/filial-approve`, `.../filial-return`,
  `.../cancel-filial-decision`, `.../resubmit-to-filials`; `leaveRemark`
  расширяется веткой `Role.FILIAL`.
- **Backend, видимость и доступ**: `findAll`/`checkAccess`/`getStats`/
  `toDetailDto` расширяются, чтобы ЦФО видел созданные им корректировки, а
  Филиал — корректировки, где он назначен проверяющим ЦФО-инициатором,
  отдельно от собственных.
- **API-контракт**: 5 новых путей, новые схемы `CorrectionFilialStatus`,
  расширение `CorrectionStatus` (5 новых значений), `Correction`/
  `CorrectionDetail` (`initiatorKind`, `initiatorFilial`, `initiatorCfo`,
  `targetKind`, `filialStatuses`, `myFilialStatus`, `isFilialReviewer`,
  `availableFilials`).
- **Frontend, создание**: форма создания корректировки (`corrections/create`)
  для роли `CFO` получает выбор направления после комплектации пакета —
  «Направить филиалам» (мультиселект) / «Направить в ДТОиР». Пункт меню
  «Создать корректировку» становится виден роли `CFO`.
- **Frontend, карточка корректировки**: блок действий филиала-проверяющего —
  зеркало блока действий ЦФО (`RemarksActionBar`) — «Согласовать» / «Оставить
  замечание» / «Вернуть на доработку» / «Отменить решение», видимые при
  `myFilialStatus.status === PENDING`.
- **Frontend, кабинет ДТОиР**: `DtoeDashboard` доводится до паритета с
  `CfoDashboard` — донат-график, фильтры, таблица «На проверке у ДТОиР» (по
  образцу `CfoCorrectionsOverview`).
- **Frontend, дашборд филиала**: `FilialCorrectionsOverview` получает раздел
  «На согласовании (от ЦФО)» — корректировки, инициированные ЦФО, где текущий
  филиал выступает проверяющим, отдельно от собственных корректировок филиала.
- **Дизайн**: конкретные макеты/визуальные решения для новых экранов (пикер
  направления, блок действий филиала-проверяющего, обновлённый кабинет ДТОиР)
  на момент создания этого change не переданы — см. `design.md`, раздел
  «Дизайн (UI)». Все дизайн-решения, которые пользователь передаст позже,
  фиксируются в этом разделе по мере поступления, до начала/по ходу
  frontend-реализации.

## Capabilities

### New Capabilities

- `cfo-initiated-corrections`: ЦФО создаёт корректировку и направляет её
  Филиалу(ам) на согласование либо напрямую в ДТОиР; Филиал выступает
  проверяющим по симметричному циклу согласования (согласовать / вернуть с
  замечанием / отменить решение); ДТОиР представлен строкой в справочнике ЦФО
  для целей пикера направления, финальное решение ДТОиР — без изменений.

### Modified Capabilities

_(нет — `role-scoped-sections` (единый `/dashboard` с рендерингом по роли) не
меняется по контракту, расширяется только содержимое `DtoeDashboard` и
`FilialCorrectionsOverview`, что не требует MODIFIED Requirements к уже
заархивированному baseline; сами эти виджеты не описаны как отдельная
capability в `openspec/specs/`.)_

## Impact

- **Backend**: `apps/backend/src/corrections/entities/correction.entity.ts`
  (`InitiatorKind`, `TargetKind`, новые поля, 5 новых статусов), новая
  `entities/correction-filial-status.entity.ts`, `entities/remark.entity.ts`
  (`filialId`), `corrections.module.ts` (регистрация новой сущности),
  `corrections.service.ts` (`create`, новый `sendAsCfo`, новые
  `filialApprove`/`filialReturn`/`cancelFilialDecision`/`resubmitToFilials`,
  расширение `leaveRemark`/`findAll`/`checkAccess`/`getStats`/`toDetailDto`),
  `corrections.controller.ts` (5 новых эндпоинтов, расширение guard на
  `POST /corrections`), `database/seed.ts` (18-я строка `cfos`).
- **API-контракт**: `api/src/openapi.yaml`, новые
  `api/src/paths/corrections-human-id-send-as-cfo.yaml`,
  `-filial-approve.yaml`, `-filial-return.yaml`,
  `-cancel-filial-decision.yaml`, `-resubmit-to-filials.yaml`; схемы
  `components/schemas/correction.yaml`, `correction-detail.yaml`, новая
  `correction-filial-status.yaml`.
- **Frontend**: `apps/frontend/app/(private)/corrections/create/*`,
  `apps/frontend/app/(private)/constants.ts` (`navItems` роль `CFO`),
  `apps/frontend/app/(private)/corrections/[humanId]/lib/permissions.ts`
  (`canFilialApprove`/`canFilialReturn`/…), `.../components/remarks-list/*`
  (блок действий филиала), `apps/frontend/app/(private)/dashboard/components/dtoe-dashboard.tsx`
  (+ новый `dtoe-corrections-overview.tsx`),
  `apps/frontend/app/(private)/dashboard/components/filial-corrections-overview.tsx`
  (раздел «на согласовании от ЦФО»); Kubb-кодоген
  `apps/frontend/packages/api/base/codegen/**` — перегенерация после правки
  контракта.
- **Вне области**: ограничение списка филиалов, доступных ЦФО при
  направлении, через существующий `FilialCfoLink` (связь описывает обратное
  направление — какие ЦФО обслуживают филиал; для ЦФО→Филиал по умолчанию
  берутся все активные филиалы, см. `design.md`, открытые вопросы);
  объединённый маршрут «Филиалы → потом ДТОиР» как единое действие (это два
  отдельных вызова `send-as-cfo`); визуальный редизайн уже существующих экранов
  ЦФО/Филиала вне минимально необходимого для новых элементов.

## Влияние на качество

- **Уровень риска**: P0 — новая продуктовая capability, новая модель данных
  (`initiatorKind`, новый статус-цикл), новые права доступа (`POST
  /corrections` открывается роли `CFO`), новый API-контракт.
- **Затронутые маршруты**: `/corrections/create` (форма для роли `CFO`),
  `/corrections/[humanId]` (блок действий филиала-проверяющего),
  `/dashboard` (содержимое `DtoeDashboard`, `FilialCorrectionsOverview`).
- **Затронутые frontend-компоненты**: `CreateCorrectionForm`,
  `RemarksActionBar`/`remarks-list/*`, `DtoeDashboard`,
  `DtoeCorrectionsOverview` (новый), `FilialCorrectionsOverview`.
- **Затронутые backend-модули**: `corrections` (сущности, сервис,
  контроллер), `database` (сид).
- **Затронутые API**: `POST /corrections` (расширение прав), новые `POST
  /corrections/{humanId}/send-as-cfo`, `.../filial-approve`,
  `.../filial-return`, `.../cancel-filial-decision`,
  `.../resubmit-to-filials`; расширение `GET /corrections`, `GET
  /corrections/{humanId}`, `GET /corrections/stats/*`.
- **TDD-порядок**: failing test → минимальная реализация → green → refactor,
  по каждому Requirement `specs/cfo-initiated-corrections/spec.md` — см.
  `tasks.md` (test-first задачи расположены перед задачами реализации).
- **Обязательные уровни проверки**: Static (`tsc --noEmit`, `eslint` FE и
  BE); Backend Unit (`corrections.service.spec.ts`); Backend Feature/E2E
  (`*.e2e-spec.ts`, ключевые маршруты ЦФО→Филиал(ы) и ЦФО→ДТОиР); Frontend
  Component (`create-correction-form`, `remarks-action-bar`,
  `dtoe-corrections-overview`, `filial-corrections-overview`); Frontend E2E —
  один сквозной happy path (см. `test-plan.md`).
- **Ручные проверки**: см. `test-plan.md`, раздел Manual checks — waiver
  фиксируется там же, если автотест непропорционально дорог.
- **План отката**: изменения аддитивны на уровне контракта (новые пути, новые
  поля, новые значения enum) и обратно совместимы для существующих
  филиал-инициированных корректировок (`initiatorKind` по умолчанию `FILIAL`,
  поведение старых веток `send`/`resubmit`/`sendToDtoe`/`cfoApprove`/
  `cfoReturn`/`dtoeApprove`/`dtoeReturn` не меняется). Данные: т.к. в проекте
  нет системы миграций (`synchronize: true` в dev, см.
  `apps/backend/src/app.module.ts`), откат — revert коммитов; в средах с
  `synchronize: false` откат новых nullable-колонок и новой таблицы
  безопасен (аддитивен), откатывать нужно только код.

## Открытый процессный вопрос

Пользователь явно попросил: все уточнения и решения (включая дизайн UI),
которые будут даны позже по ходу работы над этой фичей, фиксировать в
артефактах этого change немедленно, а не пост-фактум. Это правило применяется
на всём протяжении реализации `cfo-initiated-corrections` — при получении
новых указаний в первую очередь обновляются `proposal.md`/`design.md`/
`specs/cfo-initiated-corrections/spec.md`/`tasks.md`/`test-plan.md`, и только
затем (или параллельно) вносится код.
