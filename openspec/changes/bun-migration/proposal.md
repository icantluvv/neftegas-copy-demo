# bun-migration

> Ретроспективный change: работа выполнена и проверена локально; артефакты
> фиксируют её как командный процесс.

## Why

Backend использовал npm (`package-lock.json`, `npm ci`, `ts-node` для сидинга) —
отдельный от frontend пакетный менеджер и рантайм в одной монорепе. Frontend уже
работает на Bun (`apps/frontend/AGENTS.md`), и Bun умеет запускать TypeScript
напрямую без `ts-node`. Единый инструмент упрощает Dockerfile, CI и онбординг.

## What Changes

- `apps/backend/package.json`: скрипты `start:prod` и `seed` переведены на
  `bun` вместо `node`/`ts-node`.
- `apps/backend/package-lock.json` удалён, добавлен `apps/backend/bun.lock`.
- `apps/backend/Dockerfile`: базовый образ `oven/bun:1-alpine` вместо
  `node:24-alpine` во всех трёх стадиях (`dev`, `build`, `runtime`); `npm ci` →
  `bun install --frozen-lockfile`; dev-контейнер при каждом старте прогоняет
  `bun run seed` (идемпотентен) перед `bun run start:dev`.
- Документация: `apps/backend/README.md`, `apps/backend/AGENTS.md` и корневой
  `AGENTS.md` — команды и упоминания npm заменены на Bun.

## Capabilities

### New Capabilities

Нет.

### Modified Capabilities

Нет. Это краткое техническое изменение процесса разработки: продуктовые
capabilities, API-контракт и наблюдаемое поведение приложения не меняются,
поэтому delta specs не создаются (`skip_specs: true`).

## Impact

- Затронутые файлы: `apps/backend/package.json`, `apps/backend/bun.lock`
  (новый), `apps/backend/package-lock.json` (удалён), `apps/backend/Dockerfile`,
  `apps/backend/README.md`, `apps/backend/AGENTS.md`, корневой `AGENTS.md`.
- Frontend и API-контракт не затрагиваются.
- Влияние на команду: локальная и Docker-разработка backend теперь требует Bun
  вместо npm; команды из документации (`npm run ...`) заменены на `bun run ...`.

## Влияние на качество

- Уровень риска: P3 (инструментарий сборки/пакетов; бизнес-логика и API не
  меняются).
- Затронутые маршруты: нет.
- Затронутые frontend-компоненты и backend-модули: нет (только сборка/раннер).
- Затронутые API: нет.
- TDD-порядок: не применим для смены пакетного менеджера; проверка — запуск
  существующего backend test suite и сборки образа под Bun.
- Обязательные уровни проверки: Static/Manual — `bun run test`,
  `bun run test:e2e`, `bun run lint`, сборка Docker-образа.
- Ручные проверки: см. `test-plan.md`.
- План отката: вернуть `node:24-alpine` в Dockerfile, восстановить
  `package-lock.json` (`npm ci`), скрипты `start:prod`/`seed` — на
  `node`/`ts-node`, удалить `bun.lock`.
