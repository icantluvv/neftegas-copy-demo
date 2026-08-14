# commit-lint-setup — tasks

> Ретроспективный change: работа выполнена; чекбоксы отмечены по факту
> проверенной реализации.

## API

- [x] 1.1 [api] Подтвердить отсутствие изменений API-контракта (change касается
  только git-хуков и документации) и выполнить `npm run lint` из `api/` —
  контракт валиден, изменений нет.

## Backend

_(нет задач)_ — backend-контур не затрагивается.

## Frontend

- [x] 3.1 [frontend] Установить devDependencies в `apps/frontend`:
  `@commitlint/cli`, `@commitlint/config-conventional`, `lefthook`
  (`apps/frontend/package.json`, `apps/frontend/bun.lock`).
- [x] 3.2 [frontend] Создать `apps/frontend/commitlint.config.mjs`:
  `extends: ['@commitlint/config-conventional']` + plugin с правилом
  `optional-trailers` (обязательный `Change`, опциональный `Refs: KT-<цифры>`,
  только в footer после пустой строки).
- [x] 3.3 [frontend] Добавить `prepare`-скрипт в `apps/frontend/package.json`
  для автоустановки git-хуков при `bun install`.
- [x] 3.4 [infra] Актуализировать `lefthook.yml`: удалить нерабочий job
  `commitizen` (`bun cz --hook`); убедиться, что `commit-msg` содержит джобы
  `commitlint` и `no-ai-attribution`.
- [x] 3.5 [infra] Установить git-хуки (`lefthook install`), удалить устаревшую
  заглушку `.git/hooks/prepare-commit-msg`.
- [x] 3.6 [root] Обновить документацию: `AGENTS.md` (пункты «Формат коммита»,
  «Трейлеры коммита», «Ветки (trunk-based)»), `docs/local-deploy.md`
  (описание хука `commit-msg` и пример команды коммита).
- [x] 3.7 [infra] Прогнать ручную матрицу commitlint по валидным/невалидным
  сообщениям и зафиксировать результаты в `test-plan.md`.
- [x] 3.8 [openspec] Поддерживать `test-plan.md` change в актуальном состоянии.
- [x] 3.9 [openspec] Финальная верификация:
  `openspec validate commit-lint-setup --strict --no-interactive`.
