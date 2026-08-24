## 1. API

- [x] 1.1 [api] Подтверждено: `api/src/**` не содержит значения «СОРиСОФ» ни
      в путях, ни в схемах (`grep -rn "СОРиСОФ" api/`) — изменений контракта
      не требуется. `npm run lint` из `api/` не запускался, т.к. `api/src/**`
      не менялся этим change (нечего линтить заново).

## 2. Backend

- [x] 2.1 [backend] `apps/backend/src/database/seed.ts`, строка 90:
      `{ code: 'СОРиСОФ', slug: 'sorisof' }` → `{ code: 'СОВОФ', slug: 'sovof'
      }`.
- [x] 2.2 [backend] Выполнено на локальном dev-стеке этой сессии
      (`infra-db-1`): `UPDATE cfos SET code = 'СОВОФ', name = 'СОВОФ' WHERE
      code = 'СОРиСОФ';` + `UPDATE users SET username =
      'cfo.sovof@demo.local' WHERE username = 'cfo.sorisof@demo.local';`
      (пользователь подтвердил переименование логина, см. `design.md` →
      Открыто). Проверено `SELECT` — обе строки обновлены. На других средах
      (staging/иные локальные копии) этот SQL нужно применить отдельно, если
      появятся.
- [ ] 2.3 [backend] На чистой БД (`docker compose ... down -v` + up + `bun
      run seed`, либо новая тестовая БД) убедиться, что сид проходит без
      ошибок и создаёт строку `cfos` со значением «СОВОФ» — `SELECT code FROM
      cfos WHERE code IN ('СОРиСОФ', 'СОВОФ');` должен вернуть ровно одну
      строку со значением «СОВОФ».
- [x] 2.4 [root] `apps/backend/AGENTS.md`, строка 59: заменить «СОРиСОФ» на
      «СОВОФ» в перечислении 17 значений `CFO.code`.

## 3. Frontend

_(нет задач — значение ЦФО отображается динамически из API, frontend-код не
содержит захардкоженного «СОРиСОФ», см. `proposal.md` → Impact.)_

## 4. Финализация

- [x] 4.1 [openspec] Обновить `test-plan.md` (статусы строк ручной проверки —
      п.2–4, 6 закрыты; п.1 «чистая БД» и п.5 «визуальная проверка в
      браузере» остаются, см. 2.3 и waiver в `test-plan.md`).
- [x] 4.2 [root] Подтверждено пользователем: логин демо-пользователя ЦФО
      переименован (`cfo.sovof@demo.local`), см. 2.2. Решение зафиксировано в
      `design.md` → Открыто и `test-plan.md` → Журнал уточнений.
- [ ] 4.3 [openspec] `openspec validate rename-cfo-sorisof-to-sovof --strict
      --no-interactive`, если CLI доступен в окружении выполнения.
- [ ] 4.4 [openspec] Архивировать change (`/openspec-archive-change
      rename-cfo-sorisof-to-sovof`) после выполнения 2.x/4.2 и ручной
      верификации из `test-plan.md`.
