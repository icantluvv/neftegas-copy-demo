## API

_(нет задач — контракт не меняется)_

## Backend

- [x] 2.1 [backend] Добавить `PackageRequirement` «Перечень комплекта МТР
      (ХС)» (обычный обязательный документ, без `choiceGroupKey`) в
      `apps/backend/src/database/seed.ts`; сдвинуть `order` группы выбора
- [x] 2.2 [backend] Создать слот и файл для нового требования в
      демо-корректировках со статусом `DRAFT`
- [x] 2.3 [backend] Пересидить локальную БД (`bun run seed`), проверить, что
      сидинг проходит без ошибок
- [x] 2.4 [backend] Извлечь `sortSlotsByRequirementOrder` в
      `corrections.mapper.ts` и применить в `toDetailDto`
      (`corrections.service.ts`) — явная сортировка `slots` по
      `requirement.order` вместо порядка вставки в БД
- [x] 2.5 [backend] Unit-тест `corrections.mapper.spec.ts`: сортировка при
      перемешанном порядке вставки, отсутствие мутации исходного массива

## Frontend

- [x] 3.1 [frontend] Убрать рендеринг группового заголовка в
      `package-completeness.tsx` (`SlotLabelCell` без `groupHeader`, удалена
      неиспользуемая `isFirstInGroup`) — таблица показывает элементы плоским
      списком без подписи «— выберите один вариант»

## Проверка

- [x] `bun run seed` (apps/backend) — без ошибок
- [x] `bunx tsc --noEmit`, `bun run test` (42/42), `bun run lint`
      (apps/backend)
- [x] `bunx tsc --noEmit`, `bun run lint` по изменённому
      `package-completeness.tsx` (apps/frontend)
- [x] Ручная проверка: карточка демо-корректировки в статусе «Черновик» —
      «Перечень комплекта МТР (ХС)» отдельной строкой со своим файлом; текст
      «— выберите один вариант» на странице отсутствует
