## API

- [x] 1.1 [api] Добавить схемы `direction.yaml`, `fact-form-code.yaml`,
      `fact-package-status.yaml`, `fact-cfo-status-value.yaml`,
      `fact-remark-status.yaml`, `fact-package.yaml`,
      `fact-package-detail.yaml`, `fact-form.yaml`, `fact-form-version.yaml`,
      `fact-package-cfo-status.yaml`, `fact-package-remark.yaml`,
      `fact-package-history-entry.yaml`, `fact-final-decision.yaml` в
      `api/src/components/schemas/`; добавить пути `api/src/paths/fact-*.yaml`
      и `fact-files-id-download.yaml`; зарегистрировать всё в
      `api/src/openapi.yaml` (`tags`, `paths`, `components.schemas`) по
      `design.md` (`## API Shape`). Прогнать `npm run lint` и `npm run
      bundle` из `api/`.

## Backend

- [x] 2.1 [backend] Написать падающие unit-тесты `fact-packages.mapper.spec.ts`
      (маппинг Entity → DTO) по образцу `corrections.mapper.spec.ts`.
- [x] 2.2 [backend] Создать entities `FactPackage`, `FactForm`,
      `FactFormVersion`, `FactPackageCfoStatus`, `FactPackageRemark`,
      `FactPackageHistoryEntry` (`apps/backend/src/fact-packages/entities/`)
      и каталог форм `fact-form-catalog.ts` (`Direction`, `FactFormCode`,
      `DIRECTION_FORM_CODES`); сгенерировать/подготовить TypeORM-миграцию.
- [x] 2.3 [backend] Реализовать `fact-packages.mapper.ts` до green по 2.1.
- [x] 2.4 [backend] Написать падающие unit-тесты
      `fact-packages.service.spec.ts`: доступ по ролям (видимость списка/
      карточки), get-or-create по направлению, upload версии (в т.ч. отказ
      после `APPROVED` и для чужого `formCode`), `submit` (полнота пакета,
      привязка ЦФО к филиалу, повторная отправка блокируется неисправленными
      замечаниями, история согласовавших ЦФО не сбрасывается), `cfoApprove`
      (guard по статусу `PENDING`), `leaveRemark` (guard по ролям/статусам
      ЦФО и ДТОиР), `markRemarkFixed`/`deleteRemark` (владение, статус
      `OPEN`), `sendToDtoe` (все обязательные ЦФО `APPROVED`, доступно любому
      согласовавшему), `finalDecision` (только DTOE, `RETURN` требует
      открытого замечания, `APPROVE` — финал и неизменяемость).
- [x] 2.5 [backend] Реализовать `FactPackagesService` до green по 2.4,
      транзакционно для всех операций, меняющих статус (по образцу
      `corrections.service.ts`).
- [x] 2.6 [backend] Реализовать `FactPackagesController` (+ `FactFilesController`
      для скачивания) с `@Roles`/`RolesGuard`, DTO-валидацией
      (`class-validator`), `FactPackagesModule`, подключить модуль в
      `AppModule`.
- [x] 2.7 [backend] Написать e2e-тест `test/fact-packages.e2e-spec.ts`: happy
      path (get-or-create → загрузка всех форм направления → submit
      нескольким ЦФО → cfoApprove всеми → sendToDtoe → finalDecision
      APPROVE) и negative path (submit без всех форм отклоняется; чужой
      филиал не видит карточку; замечание не тем ЦФО отклоняется; submit
      после возврата блокируется неисправленным замечанием, после фикса
      проходит).
- [x] 2.8 [backend] Прогнать `bun run test`, `bun run test:e2e`, `bun run lint`
      из `apps/backend`; зафиксировать результат в `test-plan.md`.

## Frontend

- [x] 3.1 [frontend] Сгенерировать Kubb-клиент из обновлённого
      `api/src/openapi.yaml` (не редактировать
      `apps/frontend/packages/api/*/codegen/` вручную).
- [x] 3.2 [frontend] Написать падающий component-тест вкладок направлений
      (`direction-tabs.component.test.tsx`): 4 вкладки, `?direction=` в URL,
      фильтрация каталога для «КР ХС».
- [x] 3.3 [frontend] Реализовать `components/direction-tabs/` до green по 3.2.
- [x] 3.4 [frontend] Написать падающий component-тест таблицы форм
      (`forms-table.component.test.tsx`): состав форм по направлению, кнопка
      «Загрузить версию» видимая только Филиалу и активная только не в
      финальном статусе.
- [x] 3.5 [frontend] Реализовать `components/forms-table/` до green по 3.4.
- [x] 3.6 [frontend] Написать падающий component-тест модалки загрузки
      (`upload-version-modal.component.test.tsx`): кнопка «Загрузить»
      неактивна без выбранного файла, активна после выбора.
- [x] 3.7 [frontend] Реализовать `components/upload-version-modal/` до green
      по 3.6.
- [x] 3.8 [frontend] Написать падающий component-тест панели отправки
      (`submit-panel.component.test.tsx`): активность кнопки только при
      полном пакете, чекбоксы ЦФО только из доступных филиалу.
- [x] 3.9 [frontend] Реализовать `components/submit-panel/` до green по 3.8.
- [x] 3.10 [frontend] Написать падающий component-тест списка замечаний
      (`remarks-list.component.test.tsx`): кнопка «Исправлено» только у
      Филиала-владельца, «Удалить» только у автора и только в статусе
      «Открыто», форма «Оставить замечание»/«Согласовать» для ЦФО/ДТОиР по
      правам.
- [x] 3.11 [frontend] Реализовать `components/remarks-list/`,
      `components/cfo-statuses/`, `components/final-decision-panel/` до green
      по 3.10.
- [x] 3.12 [frontend] Собрать `app/(private)/fact/files/page.tsx` из
      компонентов (замена `SectionPlaceholder`), подключить TanStack Query
      хуки. По итогам код-ревью (MR #4) JSDoc-документация интерактивных
      элементов по схеме «Что это / Кто видит / Когда активен / Что
      происходит» убрана из этих файлов — ревьюер потребовал не оставлять
      комментарии в коде; сама схема из `apps/frontend/AGENTS.md` не
      отменяется как общее правило проекта, отступление точечное для этого MR.
- [x] 3.13 [frontend] Прогнать `bun run typecheck`, `bun run lint`, `bun run
      test` из `apps/frontend`; зафиксировать результат в `test-plan.md`.

## Дополнение: экран «Файлы», создание заново, факт-пакет ЦФО

- [x] 5.1 [frontend] Убрал бейдж статуса с карточек направлений на экране
      «Файлы» — карточки стали точкой входа для создания нового пакета, весь
      статус смотрят на «Рабочем столе» (по запросу пользователя).
- [x] 5.2 [api][backend][frontend] Заменил `getOrCreateByDirection` (один
      факт-пакет навсегда на пару «Филиал × Направление») на `POST
      /fact-packages` — каждый вызов создаёт новый факт-пакет, по аналогии с
      «Создать корректировку». Снял `@Unique(['filialId','direction'])` с
      `FactPackage` (TypeORM `synchronize`, миграция не нужна).
- [x] 5.3 [frontend] Экран «Файлы» у ЦФО переведён с плоской таблицы на 4
      карточки направлений (как у филиала); карточка открывает список
      пакетов этого направления, направленных ЦФО на проверку.
- [x] 5.4 [api][backend][frontend] ЦФО может создавать собственный
      факт-пакет по направлению (`cfoId` вместо `filialId`, `filialId`/`cfoId`
      сделаны nullable) — без проверки ЦФО, направляется сразу в ДТОиР.
      Backend: `create`/`uploadFormVersion`/`submit`/`fixRemark`/`checkAccess`/
      `findAll` расширены на владение ЦФО; `toDetailDto`/`toFactPackageListItemDto`
      возвращают nullable `filial`/`cfo` и `isCfoOwner`. Frontend:
      `CfoFactFiles` получил кнопку «Создать свой пакет»; `permissions.ts`,
      `FactSubmitPanel`, `FactPackageHeader`, таблицы списков — null-safe для
      `filial`/`cfo`.
- [x] 5.5 [backend] Юнит-тесты на новые guard'ы (`create`/`uploadFormVersion`/
      `submit` для владения ЦФО), e2e-сценарий полного цикла факт-пакета ЦФО
      (создание → загрузка формы → направление в ДТОиР → согласование).
      e2e не запущен в этом окружении (известный баг Bun 1.4.0/Jest, падает на
      импорте ещё до пользовательского кода, см. `test-plan.md`) —
      скомпилирован (`tsc --noEmit`) и проверен вручную по аналогии с
      существующими сценариями.

## Финальная проверка

- [x] 4.1 [openspec] `git status --short` проверен на посторонние правки
      (найдено и отменено автопереформатирование `corrections.service.spec.ts`
      от `eslint --fix`). `openspec validate` не прогнан — CLI недоступен в
      этом окружении (ни локально, ни в контейнерах); контракт и спеки
      проверены вручную.
