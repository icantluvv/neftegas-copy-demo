# Gas Dashboard: архитектура репозитория и contract-first pipeline

## Стек

| Компонент              | Технология                              |
| ---------------------- | --------------------------------------- |
| Backend                | Node.js, NestJS 11, TypeORM, PostgreSQL |
| Frontend               | Next.js 16, React 19, TypeScript        |
| API-контракт           | OpenAPI 3.0.2 (yaml)                    |
| Codegen бэк            | По контракту OpenAPI, инструмент отдельно |
| Codegen фронт          | По контракту OpenAPI, инструмент отдельно |


## Ветвление

Работа ведётся по модели **Trunk-Based Development (TBD)**.

- Основная ветка для разработки — `dev` (trunk).
- Фича-ветки создаются **от `dev`** и живут коротко (часы–день), сливаются обратно в `dev` через PR.
- В `main` попадают только релизные изменения из `dev`.
- Прямые коммиты в `dev` и `main` запрещены — только через PR с код-ревью и зелёным CI.

## Структура репозитория

```
GasDashboard/
├── api/
│   ├── redocly.yaml              # Линтер-правила и сборка спеки
│   └── src/
│       ├── openapi.yaml          # Source of truth для HTTP API
│       ├── paths/                # Эндпоинты (один файл = один path)
│       └── components/schemas/   # Переиспользуемые схемы
├── apps/
│   ├── backend/                  # Node.js, NestJS 11, TypeORM, PostgreSQL
│   │   └── AGENTS.md            # Контекст для AI-агентов
│   └── frontend/                 # Next.js 16, React 19, TypeScript
│       └── CLAUDE.md            # Контекст для AI-агентов
├── openspec/                     # Спецификации фич (spec-driven development)
│   ├── config.yaml
│   ├── changes/
│   └── specs/
├── docs/
└── infra/                        # Docker Compose, Docker
```

## Инфраструктура

Инфраструктура хранится в монорепе в `infra/`.

Для локального разворачивания Docker Compose и Makefile находятся в монорепе (`infra/` и корень).
Production-конфиги также остаются в этой монорепе, чтобы изменение контракта, приложений и конфигурации деплоя можно было ревьюить в одном PR.

## Contract-first pipeline

### Два уровня спецификаций

```
OpenSpec (процесс)         →  "ЧТО строим, ЗАЧЕМ, КАК спроектировано"
  proposal → design → specs → tasks

OpenAPI (контракт)         →  "КАК выглядит API для потребителя"
  openapi.yaml — source of truth

Codegen (автоматизация)    →  генерируемые артефакты для потребителей контракта
```

### Workflow фичи

1. **OpenSpec**: proposal.md → design.md → specs/\*.md
2. Из спеки → правка `api/src/openapi.yaml`
3. Валидация и сборка контракта через Redocly
4. **OpenSpec**: tasks.md → реализация
5. CI: lint + валидация контракта + breaking change detection

Полный процесс с разделением ответственности между BE и FE — в [docs/DEVELOPMENT_PROCESS.md](docs/DEVELOPMENT_PROCESS.md).

### Codegen

Бэкенд ориентируется на OpenAPI-контракт. Конкретный инструмент генерации выбирается отдельно backend-командой.

Фронтенд ориентируется на OpenAPI-контракт. Конкретный инструмент генерации выбирается отдельно фронтенд-командой.

Общего codegen pipeline для всех приложений пока нет.
