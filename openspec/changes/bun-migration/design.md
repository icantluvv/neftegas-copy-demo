# bun-migration — design

> Ретроспективный документ: решения уже реализованы; здесь зафиксирована их
> мотивация. Мотивация change — см. `proposal.md — Why`.

## Context

- Backend был единственным контуром монорепы на npm (`package-lock.json`,
  `npm ci`, `ts-node` для `src/database/seed.ts`); frontend уже на Bun 1.3
  (`apps/frontend/AGENTS.md`).
- Dockerfile backend использовал `node:24-alpine` в трёх стадиях (`dev`,
  `build`, `runtime`) с `npm ci`/`npm install` на каждом старте dev-контейнера.

## Goals / Non-Goals

**Goals:**

- Единый пакетный менеджер и рантайм (Bun) для backend и frontend.
- Убрать `ts-node` как отдельную зависимость для сидинга — Bun исполняет
  TypeScript напрямую.
- Dev-контейнер сам накатывает сид при каждом старте (идемпотентно), не
  требуя ручного `docker exec`.

**Non-Goals:**

- Замена NestJS CLI (`nest start`) или сборки (`nest build`) — они остаются
  Node-инструментами, просто исполняются через Bun-рантайм/зависимости.
- Изменение бизнес-логики `src/database/seed.ts` — правки этого файла в этот
  change не входят.
- Миграция CI-пайплайнов (вне репозитория, если есть) — не описывается здесь.

## Decisions

1. **`oven/bun:1-alpine` вместо `node:24-alpine`** во всех трёх стадиях
   Dockerfile: Bun включает совместимый Node.js-рантайм, дополнительный образ
   с Node не нужен.
2. **`bun install --frozen-lockfile` вместо `npm ci`**: прямой аналог для
   воспроизводимой установки по lock-файлу в CI/Docker-сборке.
3. **`bun run seed` вместо `ts-node src/database/seed.ts`**: Bun исполняет
   `.ts` без отдельного транспайлера; скрипт идемпотентен (пропускает себя,
   если в БД уже есть пользователи), поэтому безопасен на каждом старте
   dev-контейнера.
4. **Runtime-стадия ставит все зависимости (включая dev)**, а не только
   production: `bun run seed` в runtime-образе исполняет `.ts`-файл напрямую и
   требует typescript/типов из devDependencies. Альтернатива — вынести seed в
   отдельный multi-stage образ — отклонена как избыточная для внутреннего
   инструмента с редкими деплоями (см. комментарий в Dockerfile).
5. **`package-lock.json` удалён, `bun.lock` — новый lock-файл.** Оставлять оба
   лока рискует рассинхронизацией версий зависимостей.

## Backend

Единственный затронутый контур. Изменения: `package.json` (скрипты
`start:prod`, `seed`), `Dockerfile` (базовый образ, install/run-команды),
`bun.lock` (новый), `package-lock.json` (удалён), `README.md`, `AGENTS.md`.
`src/database/seed.ts` не менялся — только способ его запуска.

## Frontend

Не затрагивается: frontend уже был на Bun.

## Files / Owners

| Контур | Файлы | Владелец |
|---|---|---|
| API | не затрагивается | — |
| Backend | `apps/backend/package.json`, `apps/backend/bun.lock`, `apps/backend/Dockerfile`, `apps/backend/README.md`, `apps/backend/AGENTS.md` | Panteleev Sergey |
| Root docs | `AGENTS.md` | Panteleev Sergey |

Readiness Decision: **ready** (API-задач нет, реализация выполнена).

## Risks / Trade-offs

- [Runtime-образ включает devDependencies из-за прямого запуска `.ts` в
  `seed`] → осознанный компромисс для внутреннего инструмента с редкими
  деплоями; задокументирован в Dockerfile-комментарии и в этом design.md.
- [Dev-контейнер гоняет `bun run seed` на каждом старте] → безопасно только
  пока скрипт идемпотентен; при изменении его поведения нужно пересмотреть
  этот шаг CMD.
- [Расхождение версий Bun между окружениями] → зафиксировано тегом
  `oven/bun:1-alpine` (major-версия), обновление — отдельной правкой.

## Migration Plan

Уже применено. Откат: вернуть `node:24-alpine`, `npm ci`/`npm install`,
`package-lock.json` и скрипты `node`/`ts-node` в Dockerfile и
`package.json`; удалить `apps/backend/bun.lock`.

## Тестовая стратегия

- Риск: P3 — смена пакетного менеджера/рантайма, бизнес-логика не меняется.
- Уровень проверки: Backend Unit/Feature (`bun run test`, `bun run test:e2e`),
  Static (`bun run lint`), Manual (сборка Docker-образа по всем трём стадиям).
- Verification gates: `openspec validate bun-migration --strict`,
  `bun run test`, `bun run test:e2e`, `bun run lint`, `docker build` (dev и
  runtime стадии).
