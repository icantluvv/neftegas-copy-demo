<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/frontend/AGENTS.md

Инструкции для AI-агентов уровня frontend-контура Дэшборд Нефтегаз. Кросс-контурные
правила — в корневом `AGENTS.md`.

## Стек

Next.js 16.2 (App Router), React 19.2, TypeScript 6, Bun 1.3, Tailwind 4 (`tw:`),
TanStack Query/Form, Kubb (codegen HTTP-клиента из `api/src/openapi.yaml`).

## UI-элементы и состояния

Каждый интерактивный элемент (кнопка, действие, ссылка), значимый для бизнес-логики,
описывается по фиксированной схеме — четыре пункта:

- **Что это** — название элемента и краткое назначение.
- **Кто видит** — какая роль(и) видит элемент в принципе (см. глоссарий и матрицу
  доступа в корневом `AGENTS.md`); элемент, недоступный роли по правам, не
  показывается вовсе — это другое состояние, не «неактивна».
- **Когда активен** — при каком состоянии данных (статус корректировки/замечания,
  заполненность слотов и т.п.) элемент интерактивен.
- **Что происходит при взаимодействии** — какой запрос/переход/побочный эффект
  вызывает клик.

Терминология состояний:

- **«Активна»** — элемент интерактивен (доступен для клика/ввода).
- **«Неактивна»** — элемент задизейблен (visible, но не кликабелен), а не скрыт.
  Скрытие — это отдельное состояние, определяемое пунктом «Кто видит» / правами
  роли, и в тексте описывается отдельно, не через «неактивна».

Все guard-условия, ограничивающие «когда активен», дублируют бэкенд-проверки (см.
«Бизнес-правила и защита от некорректных состояний» и «Статусная модель
корректировки» в `apps/backend/AGENTS.md`) — фронт обязан их отражать в UI, но
никогда не является единственной защитой: реальная проверка — на бэкенде.
