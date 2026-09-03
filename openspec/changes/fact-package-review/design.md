# Design: fact-package-review

Источники: ЧТЗ «Файлы направлений факта» (Artifact, разделы 0–11, прочитан
целиком), `openspec/changes/fact-package-review/proposal.md`,
`apps/backend/AGENTS.md` («Статусная модель корректировки», разделы
Correction/DocumentSlot/FileVersion/CorrectionCFOStatus/Remark),
`apps/backend/src/corrections/**` (реализация-образец), корневой `AGENTS.md`
(«Роли и матрица доступа», «Бизнес-правила и защита от некорректных
состояний»).

Readiness Decision: **ready** — API Shape ниже полностью специфицирован по
образцу существующего, работающего домена `corrections`; открытых вопросов,
блокирующих реализацию, не осталось (единственный открытый пункт черновика
ЧТЗ — период — закрыт допущением в `proposal.md`).

## Модель предметной области

Факт-пакет (`FactPackage`) — прямой аналог `Correction`, но:

- ключ идентичности — пара `(filialId, direction)`, уникальная (`UNIQUE
  (filial_id, direction)`); один факт-пакет на пару, без периода;
- вместо `correctionTypeId` → фиксированный enum `direction` (`DO`, `TOIR`,
  `KR_PD`, `KR_HS`) — 4 значения, статичный каталог форм в коде (не
  справочник в БД, в отличие от `PackageRequirement`), поскольку набор форм
  и деление ХС/ПД фиксированы бизнес-правилами ЧТЗ, а не настраиваются
  администратором;
- вместо `DocumentSlot` (по `PackageRequirement`) → `FactForm` (по
  фиксированному коду формы `FactFormCode`, отфильтрованному под
  `direction` при создании факт-пакета — как `DocumentSlot` создаётся по
  `PackageRequirement` типа корректировки в `create()`);
- `FileVersion` → `FactFormVersion`, тот же принцип (версии не удаляются,
  инкремент в рамках формы);
- `CorrectionCfoStatus` → `FactPackageCfoStatus`, та же механика;
- `Remark` → `FactPackageRemark`, та же механика с человекочитаемым ID
  отдельной последовательности `FCT-REM-000001` (не путать с `REM-` у
  `corrections` — разные последовательности, чтобы не смешивать аудит двух
  доменов);
- `CorrectionHistoryEntry` → `FactPackageHistoryEntry` — тот же неизменяемый
  лог.

### Статусная модель факт-пакета (`FactPackageStatus`)

Прямое отражение статусной модели `Correction` (`apps/backend/AGENTS.md`),
без переходных технических статусов `SENT_TO_DTOE`/`PARTIALLY_APPROVED` —
раздел 7 ЧТЗ описывает укрупнённую модель, здесь она детализируется до того
же набора переходов, что и `CorrectionStatus`, чтобы переиспользовать
проверенный паттерн `recomputeStatusAfterCfoAction`:

| Значение               | Соответствие ЧТЗ (раздел 7)      |
|-------------------------|------------------------------------|
| `DRAFT`                 | Черновик                           |
| `UNDER_CFO_REVIEW`       | На проверке у ЦФО                  |
| `PARTIALLY_APPROVED`     | На проверке у ЦФО (согласовали не все) |
| `RETURNED_FOR_REVISION`  | Возвращён на доработку             |
| `RESUBMITTED`            | На проверке у ЦФО (повторно)       |
| `ALL_CFO_APPROVED`       | Ожидает отправки в ДТОиР           |
| `UNDER_DTOE_REVIEW`      | На проверке ДТОиР                  |
| `RETURNED_BY_DTOE`       | Возвращён ДТОиР                    |
| `APPROVED`               | Согласовано (финал)                |

Переходы, guard-условия и инициаторы — построчная копия таблицы «Статусная
модель корректировки» из `apps/backend/AGENTS.md`, применённая к
факт-пакету/форме/`FactPackageCfoStatus`/`FactPackageRemark`. Открытый вопрос
`corrections` про инициатора «Повторно направить в ДТОиР» здесь не
воспроизводится: `resubmitToDtoe` инициирует Филиал (симметрично `resubmit`
на уровне ЦФО) — решение зафиксировано явно для нового домена, а не оставлено
открытым.

### Каталог форм (`FactFormCode`, статичный, в коде)

```
ACT_WORK            Акт выполнения работ            — ХС, ПД
ACT_SERVICE         Акт выполнения услуги            — только ПД
KS2                 Форма КС-2                        — только ПД
KS3                 Форма КС-3                        — только ПД
ACT_MATERIALS       Акт вовлечённости материалов      — ХС, ПД
INVOICE             Счёт на оплату                    — ХС, ПД
PAYMENT_REQUEST     Заявка на платёж                  — ХС, ПД
```

`direction → formCodes`:

- `DO`, `TOIR`, `KR_PD` → все 7 кодов;
- `KR_HS` → `ACT_WORK`, `ACT_MATERIALS`, `INVOICE`, `PAYMENT_REQUEST`.

Маппинг — константа `DIRECTION_FORM_CODES` в
`apps/backend/src/fact-packages/fact-form-catalog.ts`, используется и для
создания форм при автосоздании факт-пакета, и для проверки укомплектованности
перед `submit`.

### Автосоздание факт-пакета (get-or-create)

В отличие от `corrections` (явный `POST /corrections`), у факт-пакета нет
отдельного шага создания в UI ЧТЗ (раздел 1: «Экран открывается сразу на
направлении по умолчанию»). Соответствует допущению «один долгоживущий пакет
на пару Филиал×Направление»: `GET /fact-packages?direction=&filialId=` и
`GET /fact-packages/{humanId}` не создают пакет; отдельный эндпоинт
`GET /fact-packages/by-direction/{direction}` (роль FILIAL, неявно filialId =
свой) — get-or-create: если пакета для `(user.filialId, direction)` не
существует, создаёт его в транзакции в статусе `DRAFT` вместе со всеми
формами каталога направления (без версий), возвращает `FactPackageDetail`.
Идемпотентно повторным вызовам (уникальный индекс `(filial_id, direction)`
защищает от гонки на БД).

## Backend

Новый домен `apps/backend/src/fact-packages/`, параллельный `corrections`,
не изменяет `corrections` и его таблицы. Структура — по образцу
`apps/backend/src/corrections/`:

```
fact-packages/
  entities/
    fact-package.entity.ts            (FactPackage, FactPackageStatus)
    fact-form.entity.ts               (FactForm)
    fact-form-version.entity.ts       (FactFormVersion)
    fact-package-cfo-status.entity.ts (FactPackageCfoStatus, переиспользует CfoStatusValue из corrections? — нет, отдельный enum в этом файле, чтобы домены оставались независимыми модулями)
    fact-package-remark.entity.ts     (FactPackageRemark, RemarkStatus — отдельный enum)
    fact-package-history-entry.entity.ts
  dto/
    cfo-selection.dto.ts
    remark-create.dto.ts
    final-decision.dto.ts
    find-fact-packages-query.dto.ts
  fact-form-catalog.ts        (Direction, FactFormCode, DIRECTION_FORM_CODES, FORM_LABELS)
  fact-packages.mapper.ts
  fact-packages.service.ts
  fact-packages.controller.ts
  files.controller.ts          (fact-версии — скачивание, отдельный путь /fact-files/{id}/download)
  fact-packages.module.ts
  fact-packages.service.spec.ts
  fact-packages.mapper.spec.ts
```

Переиспользуется: `FilialCfoLink`/`Cfo`/`Filial` (домен `org`), `User`/`Role`
(домен `users`), `Notification` (домен `notifications`), `RolesGuard`/
`@Roles` (домен `common`), файловое хранение — тот же паттерн
`fs.mkdir`+`fs.writeFile` под `UPLOADS_DIR`, поддиректория
`fact-packages/<year>/<month>` вместо `corrections/...` (без общего
файлового сервиса — в `corrections` его тоже нет, хранение инлайн в
сервисе; здесь дублируется тот же инлайн-паттерн, а не абстрагируется в общий
сервис, чтобы не расширять объём этого change рефакторингом `corrections`).

`FactPackagesService` — методы, зеркалящие `CorrectionsService`:
`findAll`, `getOrCreateByDirection`, `findOne`, `uploadFormVersion`,
`downloadFormVersion`, `submit` (= `send`), `cfoApprove`, `leaveRemark`,
`cfoReturn` (внутренний вызов из `leaveRemark`, как в `corrections` —
`leaveRemark` сразу переводит статус, отдельного `cfoReturn`-эндпоинта в API
ЧТЗ нет, поведение сворачивается в один запрос — см. `## API Shape`),
`resubmit` (переиспользует `submit` с уже существующими `FactPackageCfoStatus`
— повторное направление проверяет «все замечания вернувших ЦФО исправлены»
перед вызовом), `markRemarkFixed`, `deleteRemark`, `sendToDtoe`,
`finalDecision` (объединяет `dtoeApprove`/`dtoeReturn` в один эндпоинт с телом
`{decision: 'APPROVE'|'RETURN'}`, как предложено в ЧТЗ разделом 9 одним
эндпоинтом `POST .../final-decision`, в отличие от `corrections`, где это два
эндпоинта — для факт-пакета объединяем по буквальному тексту ЧТЗ).

Все операции, меняющие статус — в `dataSource.transaction`, той же
структуры, что `corrections.service.ts` (`this.log(...)`, `this.notifyUsers`,
`recomputeStatusAfterCfoAction` — адаптированный `recomputeFactPackageStatus`).

Guard на уровне контроллера: `@UseGuards(JwtAuthGuard, RolesGuard)` + сервисные
проверки прав (роль плюс владение) — двойная защита, как в `corrections`
(guard не проверяет владение конкретной записью, это делает сервис).

## Frontend

`apps/frontend/app/(private)/fact/files/page.tsx` заменяет
`SectionPlaceholder`. Структура — по образцу
`apps/frontend/app/(private)/corrections/[humanId]/`:

```
fact/files/
  page.tsx                       (вкладки направлений + таблица форм, роутинг ?direction=)
  components/
    direction-tabs/               (4 вкладки, ?direction= в URL без full reload)
    forms-table/                  (таблица форм текущего направления, статус пакета)
    upload-version-modal/         (модалка загрузки версии формы)
    submit-panel/                 (кнопка «Направить на проверку» + выбор ЦФО чекбоксами)
    remarks-list/                 (список замечаний формы, «Исправлено» для Филиала, «Оставить замечание»/«Согласовать» для ЦФО/ДТОиР)
    cfo-statuses/                 (панель статусов по каждому ЦФО, «Направить в ДТОиР»)
    final-decision-panel/         (для ДТОиР — согласовать/вернуть)
  lib/
    use-fact-package.ts           (TanStack Query хуки над Kubb-клиентом)
```

Kubb-клиент генерируется из обновлённого `api/src/openapi.yaml` (`bun run
codegen` либо эквивалент — см. `apps/frontend/package.json`); ручное
редактирование `apps/frontend/packages/api/*/codegen/` запрещено (правило
`openspec/config.yaml`).

Каждый интерактивный элемент документируется JSDoc-схемой «Что это / Кто
видит / Когда активен / Что происходит» — см. `apps/frontend/AGENTS.md`.

## API Shape

Базовый путь `/fact-packages`, тег `FactPackages`, авторизация — `cookieAuth`
(как у остальных путей), роли — как в матрице `proposal.md`.

- `GET /fact-packages?direction=&filialId=&status=&page=&pageSize=` — список,
  видимость ограничена ролью (см. Requirement «Видимость факт-пакетов по
  ролям»). Response: `PaginatedFactPackages`.
- `GET /fact-packages/by-direction/{direction}` — только FILIAL; get-or-create
  факт-пакета для `(user.filialId, direction)`. Response: `FactPackageDetail`.
- `GET /fact-packages/{humanId}` — карточка. Response: `FactPackageDetail`.
  403 если нет доступа, 404 если не найден.
- `POST /fact-packages/{humanId}/forms/{formCode}/versions` — `multipart/form-data`
  (`file`, опционально `note`, `remarkId`). Только FILIAL-владелец, пакет не в
  финальном статусе (`APPROVED`). Response: `FactFormVersion`. 400 если статус
  финальный или `formCode` не входит в каталог направления пакета.
- `POST /fact-packages/{humanId}/submit` — тело `CfoSelectionInput`
  (`{cfoIds: number[]}`). Обслуживает и первичное направление (`DRAFT`), и
  повторное (`RETURNED_FOR_REVISION` → бэкенд сам определяет ветку по текущему
  статусу, как `send`/`resubmit` в `corrections`, но одним эндпоинтом —
  упрощение относительно `corrections`, оправданное тем, что для факт-пакета
  UI не разводит эти два состояния кнопки «Направить на проверку» в разные
  экраны, раздел 6 ЧТЗ). Комплектация каталога направления не проверяется —
  направить можно с любым числом загруженных форм. Response:
  `FactPackageDetail`. 400 при невалидных ЦФО/неисправленных замечаниях.
- `POST /fact-packages/{humanId}/cfo/{cfoId}/approve` — только пользователь
  этого ЦФО. Response: `FactPackageDetail`. 400 если статус этого ЦФО не
  `PENDING`.
- `POST /fact-packages/{humanId}/remarks` — тело `FactPackageRemarkCreateInput`.
  ЦФО (пока `PENDING`) либо ДТОиР (пока `UNDER_DTOE_REVIEW`). Response:
  `FactPackageDetail`. 400/403 по правилам Requirement «Замечания к форме
  факт-пакета».
- `POST /fact-packages/{humanId}/remarks/{remarkId}/fix` — только
  FILIAL-владелец. Response: `FactPackageRemark`.
- `DELETE /fact-packages/{humanId}/remarks/{remarkId}` — только автор,
  замечание в статусе `OPEN`. Response: `204`.
- `POST /fact-packages/{humanId}/send-to-dtoe` — любой согласовавший ЦФО этого
  пакета, все обязательные ЦФО `APPROVED`. Response: `FactPackageDetail`.
- `POST /fact-packages/{humanId}/final-decision` — тело
  `{decision: 'APPROVE' | 'RETURN'}`, только DTOE/ADMIN, пакет
  `UNDER_DTOE_REVIEW`; `RETURN` требует ≥1 открытого замечания от ДТОиР.
  Response: `FactPackageDetail`.
- `GET /fact-files/{id}/download` — скачивание версии формы, доступ как в
  `checkAccess` (роль + владение пакетом), CFO/DTOE (как `files-id-download`
  в `corrections`; FILIAL скачивает свою же версию сразу после загрузки без
  отдельного эндпоинта — не требуется по ЧТЗ, но не исключается схемой; для
  симметрии с `corrections.files.controller` доступ также разрешён FILIAL-
  владельцу).

Схемы — `api/src/components/schemas/`:
`direction.yaml`, `fact-form-code.yaml`, `fact-package-status.yaml`,
`fact-cfo-status-value.yaml`, `fact-remark-status.yaml`,
`fact-package.yaml` (`FactPackage`, `FactPackageListItem`,
`PaginatedFactPackages`), `fact-package-detail.yaml` (`FactPackageDetail`,
`CfoSelectionInput` переиспользуется из `correction-detail.yaml` — общий
неспецифичный для домена шейп `{cfoIds: number[]}`, ссылка
`$ref: './correction-detail.yaml#/CfoSelectionInput'`), `fact-form.yaml`
(`FactForm`), `fact-form-version.yaml` (`FactFormVersion`),
`fact-package-cfo-status.yaml`, `fact-package-remark.yaml`
(`FactPackageRemark`, `FactPackageRemarkCreateInput`),
`fact-package-history-entry.yaml`, `fact-final-decision.yaml`
(`FactFinalDecisionInput`).

Обратная совместимость: только аддитивные изменения контракта — новые
схемы и пути, существующие `Correction*`/`corrections` пути не меняются.

## Files / Owners

- API: `api/src/openapi.yaml`, `api/src/paths/fact-*.yaml`,
  `api/src/components/schemas/fact-*.yaml`, `api/src/components/schemas/direction.yaml`
  — владелец: разработчик, создавший change (первая задача `1.1`).
- Backend: `apps/backend/src/fact-packages/**` — не трогает
  `apps/backend/src/corrections/**`.
- Frontend: `apps/frontend/app/(private)/fact/files/**`,
  `apps/frontend/packages/api/*/codegen/**` (генерируется, не редактируется
  вручную).

## Тестовая стратегия

Риск: **P0** (новый продуктовый flow с правами, статусами, деньгами
(счета/акты) — по аналогии с `corrections`, которая покрыта P0).

TDD-порядок по ключевым сценариям — для каждого Requirement/Scenario из
`specs/fact-package-review/spec.md`: failing test → минимальная реализация →
green → refactor.

Backend: unit/feature-тесты сервиса (`fact-packages.service.spec.ts`) на
каждый guard (роль/владение/статус), upsert-переходы статусов, negative paths
(чужой филиал, отправка без всех форм, замечание не тем ЦФО, повторный
submit без исправленных замечаний, финальное решение не-ДТОиР, попытка
загрузки после `APPROVED`). E2E (`test/fact-packages.e2e-spec.ts`) — happy
path (создание/get-or-create → загрузка всех форм направления → submit
нескольким ЦФО → согласование всеми → send-to-dtoe → final-decision APPROVE)
и один сквозной negative path (возврат ЦФО с замечанием → доработка →
повторный submit блокируется до фикса замечания → после фикса проходит).

Frontend: component-тесты (Vitest Browser Mode) на вкладки направлений
(фильтрация каталога КР ХС), таблицу форм (кнопки по ролям/статусам),
модалку загрузки, панель отправки (выбор ЦФО), список замечаний (кнопки
«Исправлено»/«Удалить» по владению и статусу). Моки — `nextNavigationMock`,
`vi.mock('@/packages/api/base/codegen', ...)`, паттерны из
`apps/frontend/app/(private)/corrections/[humanId]/components/**`.

Verification gates: `openspec validate fact-package-review --strict
--no-interactive`; API `npm run lint` (+ `npm run bundle` при необходимости)
из `api/`; Backend `bun run test`, `bun run test:e2e`, `bun run lint` из
`apps/backend`; Frontend `bun run typecheck`, `bun run lint`, `bun run test`
из `apps/frontend`.

## План отката

Change полностью аддитивен: новый бэкенд-домен, новые таблицы (собственная
миграция), новые API-пути/схемы, новый экран поверх существующей
заглушки. Откат — ревёрт коммитов change; существующий домен `corrections` и
остальной продукт не затрагиваются, откат не требует данных-миграций назад
(таблицы `fact-packages` можно оставить неиспользуемыми либо удалить
отдельной миграцией).
