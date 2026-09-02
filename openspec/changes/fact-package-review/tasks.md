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

- [ ] 2.1 [backend] Написать падающие unit-тесты `fact-packages.mapper.spec.ts`
      (маппинг Entity → DTO) по образцу `corrections.mapper.spec.ts`.
- [ ] 2.2 [backend] Создать entities `FactPackage`, `FactForm`,
      `FactFormVersion`, `FactPackageCfoStatus`, `FactPackageRemark`,
      `FactPackageHistoryEntry` (`apps/backend/src/fact-packages/entities/`)
      и каталог форм `fact-form-catalog.ts` (`Direction`, `FactFormCode`,
      `DIRECTION_FORM_CODES`); сгенерировать/подготовить TypeORM-миграцию.
- [ ] 2.3 [backend] Реализовать `fact-packages.mapper.ts` до green по 2.1.
- [ ] 2.4 [backend] Написать падающие unit-тесты
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
- [ ] 2.5 [backend] Реализовать `FactPackagesService` до green по 2.4,
      транзакционно для всех операций, меняющих статус (по образцу
      `corrections.service.ts`).
- [ ] 2.6 [backend] Реализовать `FactPackagesController` (+ `FactFilesController`
      для скачивания) с `@Roles`/`RolesGuard`, DTO-валидацией
      (`class-validator`), `FactPackagesModule`, подключить модуль в
      `AppModule`.
- [ ] 2.7 [backend] Написать e2e-тест `test/fact-packages.e2e-spec.ts`: happy
      path (get-or-create → загрузка всех форм направления → submit
      нескольким ЦФО → cfoApprove всеми → sendToDtoe → finalDecision
      APPROVE) и negative path (submit без всех форм отклоняется; чужой
      филиал не видит карточку; замечание не тем ЦФО отклоняется; submit
      после возврата блокируется неисправленным замечанием, после фикса
      проходит).
- [ ] 2.8 [backend] Прогнать `bun run test`, `bun run test:e2e`, `bun run lint`
      из `apps/backend`; зафиксировать результат в `test-plan.md`.

## Frontend

- [ ] 3.1 [frontend] Сгенерировать Kubb-клиент из обновлённого
      `api/src/openapi.yaml` (не редактировать
      `apps/frontend/packages/api/*/codegen/` вручную).
- [ ] 3.2 [frontend] Написать падающий component-тест вкладок направлений
      (`direction-tabs.component.test.tsx`): 4 вкладки, `?direction=` в URL,
      фильтрация каталога для «КР ХС».
- [ ] 3.3 [frontend] Реализовать `components/direction-tabs/` до green по 3.2.
- [ ] 3.4 [frontend] Написать падающий component-тест таблицы форм
      (`forms-table.component.test.tsx`): состав форм по направлению, кнопка
      «Загрузить версию» видимая только Филиалу и активная только не в
      финальном статусе.
- [ ] 3.5 [frontend] Реализовать `components/forms-table/` до green по 3.4.
- [ ] 3.6 [frontend] Написать падающий component-тест модалки загрузки
      (`upload-version-modal.component.test.tsx`): кнопка «Загрузить»
      неактивна без выбранного файла, активна после выбора.
- [ ] 3.7 [frontend] Реализовать `components/upload-version-modal/` до green
      по 3.6.
- [ ] 3.8 [frontend] Написать падающий component-тест панели отправки
      (`submit-panel.component.test.tsx`): активность кнопки только при
      полном пакете, чекбоксы ЦФО только из доступных филиалу.
- [ ] 3.9 [frontend] Реализовать `components/submit-panel/` до green по 3.8.
- [ ] 3.10 [frontend] Написать падающий component-тест списка замечаний
      (`remarks-list.component.test.tsx`): кнопка «Исправлено» только у
      Филиала-владельца, «Удалить» только у автора и только в статусе
      «Открыто», форма «Оставить замечание»/«Согласовать» для ЦФО/ДТОиР по
      правам.
- [ ] 3.11 [frontend] Реализовать `components/remarks-list/`,
      `components/cfo-statuses/`, `components/final-decision-panel/` до green
      по 3.10.
- [ ] 3.12 [frontend] Собрать `app/(private)/fact/files/page.tsx` из
      компонентов (замена `SectionPlaceholder`), подключить TanStack Query
      хуки (`lib/use-fact-package.ts`), задокументировать интерактивные
      элементы по схеме «Что это / Кто видит / Когда активен / Что
      происходит» (JSDoc рядом с каждым).
- [ ] 3.13 [frontend] Прогнать `bun run typecheck`, `bun run lint`, `bun run
      test` из `apps/frontend`; зафиксировать результат в `test-plan.md`.

## Финальная проверка

- [ ] 4.1 [openspec] `openspec validate fact-package-review --strict
      --no-interactive`; убедиться, что `git status --short` не содержит
      посторонних правок (например, от автоформатирования несвязанных
      файлов).
