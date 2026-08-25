# claude-agent-skills — tasks

## API

- [x] 1.1 [api] Подтвердить отсутствие изменений API-контракта (change
  касается только agent tooling) и выполнить `npm run lint` из `api/` —
  контракт валиден, изменений нет.

## Backend

_(нет задач)_ — backend-контур не затрагивается.

## Frontend

_(нет задач)_ — frontend-контур не затрагивается.

## Agent tooling

- [x] 4.1 [root] Добавить `.agents/skills/<name>/` — 42 skill-пакета для
  Claude Code (проектные + установленные из внешних источников).
- [x] 4.2 [root] Добавить `skills-lock.json` с манифестом 26 внешних skills
  (источник, `skillPath`, `computedHash`).
- [x] 4.3 [root] Проверить добавленные файлы на отсутствие секретов/приватных
  данных перед коммитом.
- [ ] 4.4 [openspec] `openspec validate claude-agent-skills --strict
  --no-interactive`.
