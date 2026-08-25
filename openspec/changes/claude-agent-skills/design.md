# claude-agent-skills — design

## Context

Репозиторий уже использует Claude Code (см. `AGENTS.md`, слэш-команды
`/openspec-*` через существующие проектные skills в `.agents/skills/`). До
этого change набор skills ограничивался проектными инструкциями
(`openspec-*`, `search-specs`, `backend-arch-check` и т. п.), без стандартного
набора инженерных practices (код-ревью, тестирование, безопасность,
производительность, frontend/TS паттерны), которые в других проектах уже
формализованы как переиспользуемые публичные skill-пакеты.

## Goals / Non-Goals

**Goals:**

- Дать агентам Claude Code единый набор проверенных инструкций для типовых
  инженерных задач (ревью, тестирование, отладка, безопасность,
  производительность, API/UI-дизайн, документация, git-workflow).
- Зафиксировать источник и версию каждого внешнего skill через
  `skills-lock.json` (хэш содержимого) — воспроизводимость и возможность
  проверить целостность/обновление.

**Non-Goals:**

- Изменение процесса разработки людьми, code review людей, CI/CD — skills
  относятся только к поведению AI-агентов.
- Замена существующих проектных skills (`openspec-*`, `search-specs`,
  `backend-arch-check`, `estimates*` и др.) — они остаются как есть, вне
  `skills-lock.json`.
- Написание нового кода продукта — change не затрагивает `apps/**` и `api/**`.

## Decisions

1. **`.agents/skills/<name>/` как единая точка размещения** — и для
   проектных skills (уже существовавших до этого change), и для skills,
   установленных из внешних источников. Единый каталог упрощает discovery для
   агента независимо от происхождения skill.
2. **`skills-lock.json` только для внешних skills.** Проектные skills
   (`openspec-*`, `search-specs`, `backend-arch-check`, `estimates*`,
   `docx-to-md`, `playwright-cli`, `playwright-best-practices`,
   `adversarial-review`, `agent-browser`, `update-specs`) не имеют внешнего
   источника и не отслеживаются в lock-файле — они версионируются как обычные
   файлы репозитория.
3. **Источники — публичные open-source репозитории** (`addyosmani/agent-skills`,
   `mcollina/skills`, `vercel-labs/agent-skills`, `GoogleChrome/modern-web-guidance`),
   каждый skill зафиксирован хэшем содержимого — при обновлении лока можно
   обнаружить дрейф контента от исходного источника.

## Backend

Не затрагивается.

## Frontend

Не затрагивается.

## Files / Owners

| Контур | Файлы | Владелец |
|---|---|---|
| API | не затрагивается | — |
| Backend | не затрагивается | — |
| Frontend | не затрагивается | — |
| Agent tooling | `.agents/skills/**`, `skills-lock.json` | Panteleev Sergey |

Readiness Decision: **ready** (API-задач нет, изменения — только
конфигурация agent tooling, не требуют согласования контракта).

## Risks / Trade-offs

- [Внешние skills из публичных репозиториев могут содержать инструкции,
  неприменимые или конфликтующие с правилами `AGENTS.md`] → `AGENTS.md`
  и правила контуров имеют приоритет над содержимым skill при конфликте;
  явное правило приоритета уже зафиксировано в
  `.agents/skills/using-superpowers`/секции User Instructions.
- [Дрейф контента внешнего skill от зафиксированного хэша при будущем
  обновлении] → `skills-lock.json` фиксирует `computedHash` на момент
  установки, что делает дрейф обнаружимым при следующем обновлении лока.

## Migration Plan

Новая функциональность, отката существующего поведения не требует. Откат —
удаление `.agents/skills/` и `skills-lock.json`.

## Тестовая стратегия

- Риск: P3 — agent tooling, продуктовый код и API не меняются.
- Уровень проверки: Static (`openspec validate claude-agent-skills --strict`),
  Manual (проверка отсутствия секретов/приватных данных в добавленных файлах).
- Verification gates: `openspec validate claude-agent-skills --strict`.
