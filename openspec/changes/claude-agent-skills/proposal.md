# claude-agent-skills

## Why

AI-агенты (Claude Code) работают в репозитории без единообразного набора
процессных и предметных practices — код-ревью, тестирование, отладка,
проектирование API, фронтенд-паттерны и т. д. каждый раз выводились заново из
контекста, без переиспользуемых инструкций. Набор agent skills — переиспользуемые
пакеты инструкций для конкретных типов задач — снижает разброс подходов между
сессиями и агентами.

## What Changes

- Добавлен каталог `.agents/skills/<skill-name>/` — 42 skill-пакета
  (инструкции + вспомогательные материалы) для агентов Claude Code: код-ревью,
  тестирование (TDD, Playwright), отладка, безопасность, производительность,
  API/интерфейс-дизайн, документация и ADR, git-workflow, frontend/React/Next.js
  паттерны, TypeScript, работа с браузером через DevTools, OpenSpec-процесс
  (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`,
  `openspec-explore`, `openspec-test-strategy`), поиск по спекам
  (`search-specs`), конвертация docx в markdown, оценка задач (`estimates*`) и
  др.
- Добавлен `skills-lock.json` — манифест 26 skills, установленных из внешних
  публичных источников (`addyosmani/agent-skills`, `mcollina/skills`,
  `vercel-labs/agent-skills`, `GoogleChrome/modern-web-guidance`) через
  skills-менеджер, с хэшем содержимого каждого skill для проверки целостности
  при обновлении. Остальные 16 skills в `.agents/skills/` — проектные, под
  контроль `skills-lock.json` не попадают (нет внешнего источника).
- Код приложения (`apps/backend`, `apps/frontend`), API-контракт (`api/`) и
  наблюдаемое поведение системы не затронуты — изменение касается только
  конфигурации инструментов для AI-агентов, работающих над репозиторием.

## Capabilities

### New Capabilities

Нет.

### Modified Capabilities

Нет. Это краткое техническое изменение (agent tooling): продуктовые
capabilities, API-контракт и наблюдаемое поведение приложения не меняются,
поэтому delta specs не создаются (`skip_specs: true`).

## Impact

- Затронутые файлы: `.agents/skills/**` (новый каталог), `skills-lock.json`
  (новый).
- Backend, Frontend и API-контракт не затрагиваются.
- Влияние на команду: инструкции для AI-агентов, работающих в репозитории;
  на процесс разработки людьми не влияет.

## Влияние на качество

- Уровень риска: P3 (agent tooling; бизнес-логика, API и UI не меняются).
- Затронутые маршруты: нет.
- Затронутые frontend-компоненты и backend-модули: нет.
- Затронутые API: нет.
- TDD-порядок: не применим — добавляются только markdown-инструкции для
  агентов, исполняемого кода продукта нет.
- Обязательные уровни проверки: Static — `openspec validate claude-agent-skills
  --strict`.
- Ручные проверки: визуальная проверка, что `.agents/skills/**` и
  `skills-lock.json` не содержат секретов/приватных данных перед коммитом.
- План отката: удалить каталог `.agents/skills/` и `skills-lock.json`.
