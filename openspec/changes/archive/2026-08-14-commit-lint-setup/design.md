# commit-lint-setup — design

> Ретроспективный документ: решения уже реализованы; здесь зафиксирована их
> мотивация. Мотивация change — см. `proposal.md — Why`.

## Context

- В корне репозитория уже существовал `lefthook.yml` с описанным хуком
  `commit-msg` (commitlint + проверка `no-ai-attribution`), но ссылался он на
  несуществующие артефакты: пакет `commitlint` не был установлен, конфига
  `apps/frontend/commitlint.config.mjs` не было, git-хуки не были установлены.
- Bun-инфраструктура живёт в `apps/frontend`; корневого `package.json` нет.
- Правила формата коммита описаны в корневом `AGENTS.md` («Формат коммита»,
  «Трейлеры коммита»): Conventional Commits, обязательный трейлер `Change`,
  опциональный `Refs: KT-<цифры>`, запрет AI-атрибуции.

## Goals / Non-Goals

**Goals:**

- Локальная автоматическая проверка каждого сообщения коммита на хуке
  `commit-msg`.
- Автоустановка хуков при установке зависимостей фронта (`bun install`).
- Кастомная проверка трейлеров `Change`/`Refs` сверх стандартного
  `config-conventional`.

**Non-Goals:**

- Серверная проверка в CI (может быть добавлена отдельным change).
- Branch protection для `main` (настройка GitHub, вне репозитория).
- Настройка commitizen/интерактивного помощника составления сообщений.
- Оживление PHP-джобов (`make cs`, `make phpstan`, `make test`) в
  `lefthook.yml` — это остатки чужого шаблона, отдельная задача.

## Decisions

1. **Инструменты — в `apps/frontend`, а не в корне.** Корневого `package.json`
   нет, а `lefthook.yml` уже ссылался на
   `apps/frontend/node_modules/.bin/commitlint` и
   `apps/frontend/commitlint.config.mjs`. Альтернатива — корневой
   `package.json` только под dev-тулинг — отвергнута: добавляет третий
   node-контур ради двух пакетов.
2. **`extends: ['@commitlint/config-conventional']` сохранён** в
   `apps/frontend/commitlint.config.mjs` при добавлении кастомного правила:
   без него пропала бы сама проверка Conventional Commits (тип/скоуп/описание).
3. **Кастомное правило `optional-trailers`** (plugin в том же конфиге)
   валидирует по «сырому» сообщению (`raw`), а не по распарсенному footer:
   парсер conventional-commits ненадёжно относит строки `Refs:`/`Change:` к
   footer. Правило требует ровно один непустой `Change`, не более одного
   `Refs: KT-<цифры>`, оба — только в footer после пустой строки.
4. **Автоустановка хуков через `prepare`-скрипт** в
   `apps/frontend/package.json` (`cd ../.. && ./apps/frontend/node_modules/.bin/lefthook install`):
   Bun выполняет `prepare` при `bun install`, отдельная ручная команда не
   нужна (fallback описан в `docs/local-deploy.md`).
5. **Job `commitizen` удалён из `lefthook.yml`**: `bun cz --hook` ссылался на
   неустановленный commitizen и после активации хуков блокировал бы каждый
   коммит с frontend-файлами. Альтернатива — доустановить commitizen —
   отвергнута: интерактивный промпт мешает агентским коммитам и не входит в
   задачу.
6. **Запрет AI-атрибуции** оставлен существующим grep-джобом
   `no-ai-attribution` в `lefthook.yml` (не переносился в commitlint-plugin):
   он уже был написан и работает независимо от node-инструментов.

## Backend

Не затрагивается: изменение касается только git-хуков и документации.
`apps/backend/**` не изменялся.

## Frontend

Продуктовый код не затрагивается. Изменения только в инфраструктуре контура:
`apps/frontend/package.json` (devDependencies, `prepare`),
`apps/frontend/commitlint.config.mjs` (новый), `apps/frontend/bun.lock`.

## Files / Owners

| Контур | Файлы | Владелец |
|---|---|---|
| API | не затрагивается | — |
| Backend | не затрагивается | — |
| Frontend/инфра | `apps/frontend/package.json`, `apps/frontend/commitlint.config.mjs`, `apps/frontend/bun.lock`, `lefthook.yml`, `AGENTS.md`, `docs/local-deploy.md` | Panteleev Sergey |

Readiness Decision: **ready** (API-задач нет, реализация выполнена).

## Risks / Trade-offs

- [Хук локальный: `git commit --no-verify` или отсутствие `bun install`
  обходят проверку] → зафиксировано правилом в `AGENTS.md`; полная защита —
  отдельным change с проверкой в CI.
- [Правило по `raw` зависит от точного текста строк] → покрыто матрицей
  ручных прогонов в `test-plan.md`; при ложных срабатываниях правило
  корректируется в одном файле `apps/frontend/commitlint.config.mjs`.
- [Обязательный `Change` мешает коммитам вне какого-либо change (мелкие
  правки)] → осознанное командное решение: каждая правка привязывается к
  change; при необходимости политика смягчается правкой одного регулярного
  выражения.
- [`prepare` выполняется из `apps/frontend`, а хуки ставятся в корневой
  `.git`] → путь захардкожен относительным `cd ../..`; при переносе каталога
  скрипт нужно обновить.

## Migration Plan

Уже применено. Откат: удалить джобы `commit-msg` из `lefthook.yml`, скрипт
`prepare` и devDependencies (`@commitlint/cli`, `@commitlint/config-conventional`,
`lefthook`) из `apps/frontend/package.json`, файл
`apps/frontend/commitlint.config.mjs`; выполнить
`./apps/frontend/node_modules/.bin/lefthook uninstall` до удаления пакета.

## Тестовая стратегия

- Риск: P3 — конфигурация dev-инструментов, продуктовое поведение не меняется.
- Уровень проверки: Static/Manual — прогон commitlint по матрице сообщений
  (валидные и невалидные), см. `test-plan.md`. Unit/component/E2E-тесты не
  создаются: поведение наблюдается только запуском самого commitlint, отдельный
  тестовый харнес для конфига избыточен при данном риске.
- Verification gates: `openspec validate commit-lint-setup --strict`,
  ручная матрица прогонов commitlint, проверка установки хуков
  (`ls .git/hooks/commit-msg`).
