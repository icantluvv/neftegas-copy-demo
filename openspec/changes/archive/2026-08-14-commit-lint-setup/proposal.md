# commit-lint-setup

> Ретроспективный change: настройка уже выполнена и проверена локально; артефакты
> фиксируют её как командный процесс.

## Why

История коммитов не была защищена от невалидных сообщений: конфиг `lefthook.yml`
ссылался на commitlint, но ни пакет, ни конфиг, ни git-хуки фактически не были
установлены — любой коммит проходил без проверки. Команде нужны единый формат
Conventional Commits, обязательная привязка коммита к OpenSpec-change (трейлер
`Change`) и запрет AI-атрибуции в сообщениях.

## What Changes

- Установлены devDependencies в `apps/frontend`: `@commitlint/cli`,
  `@commitlint/config-conventional`, `lefthook`.
- Создан `apps/frontend/commitlint.config.mjs`: базовые правила
  `@commitlint/config-conventional` плюс кастомное правило `optional-trailers`:
  - трейлер `Change: <имя-чейнджа>` ОБЯЗАТЕЛЕН, ровно один, с непустым значением;
  - трейлер `Refs` опционален, строго вида `KT-<цифры>`, не более одного;
  - трейлеры допускаются только в footer после пустой строки.
- Git-хуки активированы через Lefthook: хук `commit-msg` запускает commitlint и
  существующую проверку `no-ai-attribution` (блокирует `Co-Authored-By: Claude`,
  «Generated with Claude» и т.п.).
- В `apps/frontend/package.json` добавлен скрипт `prepare` — хуки ставятся
  автоматически при `bun install`.
- Из `lefthook.yml` удалён нерабочий job `commitizen` (`bun cz --hook`):
  commitizen не установлен, после активации хуков он блокировал бы каждый коммит
  с frontend-файлами.
- Документация: в `AGENTS.md` обновлены пункты «Формат коммита» и «Трейлеры
  коммита»; в `docs/local-deploy.md` описан хук и пример команды коммита.

## Capabilities

### New Capabilities

Нет.

### Modified Capabilities

Нет. Это краткое техническое изменение процесса разработки: продуктовые
capabilities, API-контракт и наблюдаемое поведение приложения не меняются,
поэтому delta specs не создаются (`skip_specs: true`).

## Impact

- Затронутые файлы: `AGENTS.md`, `docs/local-deploy.md`, `lefthook.yml`,
  `apps/frontend/package.json`, `apps/frontend/bun.lock`,
  `apps/frontend/commitlint.config.mjs`.
- Backend и API-контракт не затрагиваются — изменение касается только процесса
  коммитов; инструменты размещены в frontend-контуре, т.к. там уже живёт
  bun-инфраструктура и на неё ссылался `lefthook.yml`.
- Влияние на команду: коммит без `Change`-трейлера или вне Conventional Commits
  локально отклоняется; хук устанавливается каждому разработчику после
  `bun install` в `apps/frontend`. Серверной (CI) проверки пока нет.

## Влияние на качество

- Уровень риска: P3 (инструментарий процесса; продуктовый код не меняется).
- Затронутые маршруты: нет.
- Затронутые frontend-компоненты и backend-модули: нет (только конфигурация).
- Затронутые API: нет.
- TDD-порядок: не применим для конфигурации хуков; проверка — прогон commitlint
  на наборе валидных/невалидных сообщений (выполнена).
- Обязательные уровни проверки: Static (ручной прогон commitlint по сценариям).
- Ручные проверки: см. `test-plan.md` — матрица сообщений выполнена локально.
- План отката: удалить `commit-msg`-джобы из `lefthook.yml`, скрипт `prepare` и
  devDependencies; выполнить `lefthook uninstall` (или удалить `.git/hooks/*`).
