# bun-migration — tasks

> Ретроспективный change: работа выполнена; чекбоксы отмечены по факту
> проверенной реализации.

## API

- [x] 1.1 [api] Подтвердить отсутствие изменений API-контракта (change касается
  только пакетного менеджера/рантайма backend) и выполнить `npm run lint` из
  `api/` — контракт валиден, изменений нет.

## Backend

- [x] 2.1 [backend] Перевести скрипты `start:prod` и `seed` в
  `apps/backend/package.json` на `bun`.
- [x] 2.2 [infra] Удалить `apps/backend/package-lock.json`, зафиксировать
  `apps/backend/bun.lock`.
- [x] 2.3 [infra] Перевести `apps/backend/Dockerfile` на `oven/bun:1-alpine`
  во всех трёх стадиях (`dev`, `build`, `runtime`); `npm ci`/`npm install` →
  `bun install`; dev CMD прогоняет `bun run seed` перед `bun run start:dev`.
- [x] 2.4 [root] Обновить документацию: `apps/backend/README.md`,
  `apps/backend/AGENTS.md`, корневой `AGENTS.md` — команды `npm` → `bun`.
- [x] 2.5 [backend] Прогнать `bun run test`, `bun run test:e2e`,
  `bun run lint` под Bun.

## Frontend

_(нет задач)_ — frontend-контур уже был на Bun, не затрагивается.
