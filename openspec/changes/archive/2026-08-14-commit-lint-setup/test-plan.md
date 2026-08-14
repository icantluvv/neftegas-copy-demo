# Test Plan

## Risk level
P3 — конфигурация dev-инструментов (git-хуки, commitlint); продуктовый код,
API и наблюдаемое поведение приложения не меняются.

## Scenario coverage

Delta specs отсутствуют (`skip_specs: true` — краткое техническое изменение).
Покрытие строится по поведению хука `commit-msg` из `design.md`:

| Requirement | Scenario | Risk | Test level | Test file | Status |
|---|---|---:|---|---|---|
| Conventional Commits | Сообщение `поправил всякое` отклоняется (`type-empty`) | P3 | Manual | матрица прогонов commitlint (ниже) | done |
| Conventional Commits | `fix(notify): исправить фильтр` + `Change: some-change` проходит | P3 | Manual | матрица прогонов commitlint | done |
| Обязательный `Change` | Сообщение без трейлера `Change` отклоняется | P3 | Manual | матрица прогонов commitlint | done |
| Обязательный `Change` | Пустой `Change:` / два `Change:` отклоняются | P3 | Manual | матрица прогонов commitlint | done |
| Формат `Refs` | `Refs: KT-68007863` проходит; `Refs: ABC-123` отклоняется | P3 | Manual | матрица прогонов commitlint | done |
| Footer после пустой строки | Трейлер сразу после заголовка без пустой строки отклоняется | P3 | Manual | матрица прогонов commitlint | done |
| Запрет AI-атрибуции | `Co-Authored-By: Claude ...` блокируется джобом `no-ai-attribution` | P3 | Manual | grep-проверка джоба | done |
| Установка хуков | После `bun install` / `lefthook install` существует `.git/hooks/commit-msg` | P3 | Manual | `ls .git/hooks` | done |

## Required automated tests

### Unit
- нет — поведение наблюдается только запуском самого commitlint; отдельный
  тестовый харнес для конфига избыточен при риске P3 (waiver, см. design.md
  «Тестовая стратегия»).

### Component
- нет (frontend-компоненты не затрагиваются).

### Integration
- нет.

### E2E
- нет (пользовательские маршруты не затрагиваются).

## Manual checks
- [x] Матрица прогонов commitlint (`apps/frontend/node_modules/.bin/commitlint
  --config apps/frontend/commitlint.config.mjs --edit <файл>`): 7 сценариев из
  таблицы выше — все дали ожидаемый exit code (валидные — 0, невалидные — 1).
- [x] Джоб `no-ai-attribution`: grep из `lefthook.yml` находит строку
  `Co-Authored-By: Claude ...` в тестовом сообщении.
- [x] Хуки установлены: в `.git/hooks` присутствуют `commit-msg`, `pre-commit`,
  `pre-push`; устаревшая заглушка `prepare-commit-msg` удалена.

## Test data
- Fixtures: временные файлы сообщений коммитов в scratchpad-каталоге сессии.
- API mocks: не требуются.
- User roles: не требуются.
- Seed data: не требуется.

## Out of scope
- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices

## Verification commands
- [x] openspec validate commit-lint-setup --strict --no-interactive — valid
- [x] api: `npm run lint` — контракт валиден, изменений нет
- [x] ручная матрица прогонов commitlint (см. Manual checks)
- frontend build/test/lint не требуются: продуктовый код фронта не менялся
- backend не затрагивается
