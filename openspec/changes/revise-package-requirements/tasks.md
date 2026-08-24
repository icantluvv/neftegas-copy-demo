## 1. API

- [ ] 1.1 [api] Добавить `choiceGroupKey`/`groupLabel` (nullable) в схему
      `DocumentSlot` (`api/src/components/schemas/**`, см. `design.md` → API
      Shape). Выполнить `npm run lint` из `api/`.

## 2. Backend

### 2.1 Модель данных

- [x] 2.1.1 [backend] `apps/backend/src/org/entities/package-requirement.entity.ts`:
      добавить `choiceGroupKey: string | null`, `groupLabel: string`.
- [x] 2.1.2 [backend] `apps/backend/src/corrections/corrections.mapper.ts`:
      `toDocumentSlotDto()` — прокинуть новые поля из `slot.requirement`.

### 2.2 Правило комплектности (TDD)

- [x] 2.2.1 [backend] Unit-тест `corrections.service.spec.ts` (`describe
      «checkPackageComplete (группа «выбери один из альтернатив»)»`): группа
      не заполнена → `missing` содержит `groupLabel` + оба варианта через
      «/» → реализована переработка `checkPackageComplete()` → green.
      *(Реализация написана вместе с тестом в одном шаге, не строго
      test-first — как и в части других changes этой сессии, см.
      `test-plan.md`.)*
- [x] 2.2.2 [backend] Unit-тест: заполнен один из двух вариантов группы →
      `complete: true`, `missing: []` → green.
- [x] 2.2.3 [backend] Unit-тест: заполнены оба варианта группы →
      `complete: true` → green.
- [x] 2.2.4 [backend] Unit-тест: независимые (негрупповые) обязательные
      требования продолжают работать как раньше — green, регресс не
      обнаружен (полный набор 36/36 backend-тестов зелёный).

### 2.3 Сид

- [x] 2.3.1 [backend] `apps/backend/src/database/seed.ts`: заменить состав
      `requirements` типа STANDARD на 4 новых требования (см. `design.md`).
- [x] 2.3.2 [backend] Переписать `seedCorrection()` под новый состав слотов
      (`reqNote`/`reqPackage`/`reqLsr`/`reqTkp`, тексты замечаний, демо-имена
      файлов; `reqTkp` намеренно без файла в демо-данных — демонстрирует
      правило «выбери один из группы»).
- [x] 2.3.3 [backend] Выполнено на `infra-db-1`: 3 существующие строки
      `package_requirements` переименованы, добавлена 4-я, группе
      проставлены `choiceGroupKey`/`groupLabel`. Подтверждено `SELECT`.
- [x] 2.3.4 [backend] Найден и исправлен побочный баг: `DETAIL_RELATIONS`
      (`corrections.service.ts`) не грузил `correctionType.requirements` —
      добавлено `'correctionType.requirements'`. Без этого группа МТР (и
      вообще любое типизированное требование) не проверялась бы в реальном
      API-пути, несмотря на корректную логику `checkPackageComplete()`. См.
      `proposal.md` → «Побочная находка при реализации».
- [x] 2.3.5 [backend] Побочный фикс: `CorrectionFilialStatus` (сущность из
      параллельного change `cfo-initiated-corrections`) была не
      зарегистрирована ни в `corrections.module.ts`, ни в `database/seed.ts`
      — из-за этого перезапуск backend-контейнера падал в цикл рестарта
      (`Entity metadata for Correction#filialStatuses was not found`).
      Зарегистрирована в обоих местах; заодно исправлены nullable-колонки
      `Correction.filialId`/`initiatorFilialId`/`initiatorCfoId` (были без
      явного `type`, TypeORM видел `Object` вместо `int`) и
      `PackageRequirement.choiceGroupKey` (та же причина). См. отражение в
      `cfo-initiated-corrections/tasks.md`, 2.1.4.

## 3. Frontend

- [ ] 3.1.1 [frontend] Перегенерировать `apps/frontend/packages/api/base/codegen/**`
      из обновлённого `openapi.yaml`.
- [ ] 3.1.2 [frontend] Failing component-тест
      `package-completeness.component.test.tsx`: строки с одинаковым
      `choiceGroupKey` рендерятся с заголовком `groupLabel` и пометкой
      «выберите один вариант»; колонка «Обязателен» для строк группы — «Да
      (один из группы)» → реализовать в `package-completeness.tsx` (см.
      `design.md` → «Дизайн (UI)», решение по умолчанию) → green.

## 4. Финализация

- [ ] 4.1 [openspec] Обновить `test-plan.md` (статусы строк покрытия).
- [ ] 4.2 [root] Ручная проверка на `infra-db-1` после 2.3.3 (см.
      `test-plan.md` → Manual checks).
- [ ] 4.3 [openspec] `openspec validate revise-package-requirements --strict
      --no-interactive`, если CLI доступен.
- [ ] 4.4 [openspec] Архивировать change после завершения секций 1–3 и
      обязательных проверок.
