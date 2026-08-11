# AGENTS.md

Инструкции для AI-агентов уровня монорепозитория Дэшборд Нефтегаз. Здесь — карта
проекта и кросс-контурные правила. Правила реализации конкретного контура — в его
собственном `AGENTS.md` (см. ниже).

## Что это

Дэшборд Нефтегаз — сервис для ведения отчетности.

## Карта репозитория

| Контур | Каталог | Стек и назначение | Правила контура |
|---|---|---|---|
| Backend | `apps/backend/` | Node.js, NestJS 11, TypeORM, PostgreSQL, Jest | `apps/backend/AGENTS.md` |
| Frontend | `apps/frontend/` | Next.js 16.2 App Router, React 19.2, TypeScript 6, Bun 1.3, Tailwind 4 (`tw:`), TanStack Query/Form, Kubb | `apps/frontend/AGENTS.md` |
| API-контракт | `api/` | OpenAPI 3.0.2, Redocly; `api/src/openapi.yaml` — source of truth HTTP API | — |
| Инфраструктура | `infra/`, корневой `Makefile`, `docker-compose.yml` | Docker Compose, локальное окружение и production-конфигурация | — |
| OpenSpec | `openspec/` | Изменения процесса разработки и живая документация поведения | `openspec/config.yaml` |

Основные продуктовые домены: вход по email/паролю, дашборд статистики, отправка
заявок и файлов. Backend организован как домены в `apps/backend/src/<domain>/`.

## Кросс-контурные правила

- **Contract-first.** `api/src/openapi.yaml` и связанные `api/src/**` — единственный
  источник истины HTTP API. Backend, Kubb-codegen фронта и интеграция следуют
  последней успешно проверенной версии контракта. Порядок единого FE/BE-изменения —
  в `docs/DEVELOPMENT_PROCESS.md`.
- **Единый change на фичу.** Одна продуктовая задача — один OpenSpec-change без
  префиксов `be-`/`fe-`; API, Backend и Frontend живут в одном change. Легаси
  `be-*`/`fe-*` changes не переименовывать.
- **Трейлеры коммита.** Когда правка относится к тикету, добавляй трейлер `Refs`
  (тикет); когда к OpenSpec-change — трейлер `Change` (имя change). Оба
  необязательны: мелкие правки бывают без тикета, многие правки — без change.
  Если добавляешь трейлеры — после заголовка пустая строка, затем трейлеры. Пример:

  ```
  Refs: KT-68007863
  Change: stage-dates-not-null
  ```
- **Язык.** Инструкции, документация, UI-тексты, тестовые описания и комментарии —
  русский. Код и идентификаторы — английский. Служебные маркеры OpenSpec, RFC 2119
  и Gherkin — английский (их парсит CLI).
- **Правила контура.** Границы модулей, генерируемый код (codegen, миграции) и
  прочая специфика реализации — по правилам соответствующего контура из его
  `AGENTS.md`; в корневом не дублируются.

## Источники истины

- `docs/DEVELOPMENT_PROCESS.md` — процесс единого FE/BE change и contract-first.
- `api/src/openapi.yaml`, `api/src/**` — публичный HTTP-контракт.
- `apps/backend/AGENTS.md` — backend.
- `apps/frontend/AGENTS.md`, `docs/adr/` — frontend.
- `openspec/config.yaml` — процессные правила OpenSpec-артефактов.

## Окружение

Backend-команды (npm — NestJS, TypeORM, Jest) выполняются из `apps/backend`.
Frontend-команды — из `apps/frontend` (Bun). API-команды (`npm run lint`,
`npm run bundle`) — из `api/`.
