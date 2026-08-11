---
name: openspec-test-strategy
description: Поведенческая TDD-стратегия тестирования для OpenSpec/SDD в BCP. Используй при создании или обновлении OpenSpec-артефактов (`proposal.md`, `design.md`, `tasks.md`, specs, `test-plan.md`), выборе unit/component/E2E уровней для frontend, проверке правил frontend-тестов, покрытия сценариев и рисков, verification gates, Definition of Ready и Definition of Done.
---

# Тестовая стратегия OpenSpec

Цель: переводить требования OpenSpec в проверяемые поведенческие сценарии, вести разработку через TDD и задавать достаточные verification gates без лишних направлений контроля качества.

Главная цепочка:

```text
Сценарий OpenSpec
  -> уровень тестирования
    -> сначала failing test или обоснованный manual/waiver
      -> минимальная реализация
        -> green test + refactor
          -> verification gate
```

## TDD-порядок

Веди разработку по Test-Driven Development:

- сначала формулируй сценарий Given / When / Then;
- выбирай минимальный достаточный уровень тестирования;
- до production-кода добавляй падающий unit/component/E2E-тест или явно фиксируй manual/waiver в `test-plan.md`;
- реализуй минимальный код, чтобы тест стал green;
- делай refactor только после green;
- не отмечай OpenSpec task как done, если для сценария нет автоматизированного теста, обоснованной ручной проверки или waiver.

## Область применения

Оставляй:

- статические проверки;
- unit-тесты;
- component-тесты;
- E2E-тесты;
- ручное exploratory-тестирование для сложных или рискованных сценариев.

Особенности frontend проекта:

- Разрешены только три вида frontend-тестов:
    - Unit: `*.unit.test.ts` или `*.unit.test.tsx`, Vitest в node environment.
    - Component: `*.component.test.ts` или `*.component.test.tsx`, Vitest Browser Mode с `@vitest/browser-playwright` и `vitest-browser-react`.
    - E2E: `*.e2e.spec.ts`, Playwright только для критических пользовательских маршрутов.
- Не создавай отдельные интеграционные frontend-тесты: поведение page/route/component/provider проверяй component-тестом, а критический сквозной маршрут — E2E.
- При написании или ревью E2E обязательно используй skill `playwright-best-practices`; для новых E2E читай его E2E references (`core/test-suite-structure.md`, `core/locators.md`, `core/assertions-waiting.md`), применяй role/label locators, web-first assertions, auto-waiting вместо `waitForTimeout`, независимые тесты и реалистичные тестовые данные.
- Не вводи Jest, jsdom component tests, React Testing Library, jest-dom, user-event или MSW как обязательные инструменты, пока стратегия проекта явно не изменена.

Правила frontend-тестов:

- В unit/component-тестах не обращайся к реальному backend endpoint. Мокай `fetch`, API client/hook или передавай typed fixtures; глобальный `fetch` в Vitest должен падать на unhandled request.
- Для component-тестов используй только `render` из `vitest-browser-react` или общий helper `src/test/render.tsx` (`renderWithProviders`). Не используй `react-dom`, `react-dom/client`, `react-dom/test-utils` или `ReactDOM.render` для рендера компонентов в тестах.
- Для unit-тестов не рендери React-компоненты через `react-dom/render`; если проверяется UI-поведение, это component-тест с Vitest Browser Mode.
- Применяй лейблы Allure ко всем frontend-тестам: Unit-front, Component-front или E2E-front layer, Epic `Проект`, Feature по домену. Для unit/component используй setup files `src/test/setup-allure-unit.ts` и `src/test/setup-allure-component.ts`; для E2E импортируй `test`/`expect` из `apps/frontend/e2e/fixtures.ts`, а не напрямую из `@playwright/test`.
- Если новая область не попадает в существующий Feature mapping, обновляй `apps/frontend/src/test/allure-labels.ts` вместе с тестом.

Не добавляй как отдельные направления:

- отдельные интеграционные frontend-тесты;
- контрактные тесты;
- тесты визуальной регрессии;
- accessibility-тесты;
- mutation-тесты или mutation-style goals;
- pairwise-комбинации с feature flags.

## Артефакты OpenSpec

В `proposal.md` добавляй:

```md
## Влияние на качество

- Уровень риска: P0 / P1 / P2 / P3
- Затронутые маршруты:
- Затронутые компоненты:
- Затронутые API:
- TDD-порядок: failing test -> implementation -> green -> refactor
- Обязательные уровни тестирования:
    - Static
    - Unit
    - Component
    - E2E
- Ручные проверки:
- Откат:
```

В `design.md` добавляй `## Тестовая стратегия`:

- затронутые frontend/backend/API-слои;
- TDD-порядок по ключевым сценариям;
- обязательные unit/component/E2E-проверки;
- моки, typed fixtures, factories, seed data и пользовательские роли;
- соблюдение правил frontend-тестов;
- happy path, ключевой negative path и edge cases для P0/P1;
- ручные exploratory-проверки, если автоматизация непропорциональна риску.

В `tasks.md` добавляй:

- test-first задачи перед задачами реализации;
- задачи реализации после failing tests;
- сопровождение `test-plan.md`;
- команды верификации;
- правило: не отмечай задачу как выполненную, пока сценарий не покрыт автоматизацией, ручной проверкой или waiver.

## Шаблон test-plan.md

Создавай `openspec/changes/<change>/test-plan.md` для каждого change.

```md
# План тестирования

## Уровень риска

P0 / P1 / P2 / P3

## TDD workflow

- [ ] Для каждого автоматизируемого сценария сначала добавлен падающий тест
- [ ] Реализация сделана после failing test
- [ ] Тесты доведены до green
- [ ] Refactor выполнен только после green
- [ ] Manual/waiver явно зафиксирован для сценариев без автоматизации

## Покрытие сценариев

| Требование | Сценарий | Риск | Уровень тестирования | Файл теста | Статус |
| ---------- | -------- | ---: | -------------------- | ---------- | ------ |

## Обязательные автоматизированные тесты

### Unit

- [ ] ...

### Component

- [ ] ...

### E2E Playwright

- [ ] ...

## Ручные проверки

- [ ] ...

## Тестовые данные

- Fixtures:
- API mocks:
- Пользовательские роли:
- Seed data:

## Вне области

- Контрактные тесты
- Тесты визуальной регрессии
- Accessibility-тесты
- Mutation-тесты
- Матрицы комбинаций feature flags

## Команды верификации

- [ ] openspec validate <change-name> --strict --no-interactive
- [ ] frontend: bun run lint / bun run typecheck / bun run test:unit / bun run test:component / bun run build, если затронут
- [ ] api: npm run lint / npm run bundle, если контракт API изменился
- [ ] frontend E2E: bun run test:e2e или bun run test:e2e:smoke, если требуется по риску
- [ ] ручное exploratory-тестирование, если требуется по риску
```

## Покрытие рисков

| Риск | Обязательное покрытие                                                       |
| ---- | --------------------------------------------------------------------------- |
| P0   | E2E happy path + ключевой negative path + unit/component для сложной логики |
| P1   | Component + один E2E внутри пользовательского маршрута, если обосновано     |
| P2   | Unit/component                                                              |
| P3   | Статические проверки или обоснованная ручная проверка                       |

Примеры:

- P0: вход, регистрация, доступ к защищённому маршруту, оплата или checkout-like flow, критический dashboard, критическое сохранение данных.
- P1: редактирование профиля, фильтры, сортировка, пагинация, некритичные настройки, вторичные формы.
- P2/P3: мелкие состояния UI, второстепенные виджеты, изменения текста, некритичная логика отображения.

## Выбор уровня

| Форма сценария                                                                                             | Уровень   |
| ---------------------------------------------------------------------------------------------------------- | --------- |
| Чистая логика, валидаторы, мапперы, нормализаторы, права доступа                                           | Unit      |
| Поведение одного компонента, состояние формы, состояния loading/error/empty/success, действие пользователя | Component |
| Взаимодействие page/route/component/provider, поведение API-мока, ответы success/empty/error               | Component |
| Реальный браузер, auth/session/cookies, middleware, redirects, критический пользовательский маршрут        | E2E       |

Не тестируй:

- имена внутреннего состояния React;
- точную JSX-структуру без бизнес-смысла;
- CSS-классы без поведения;
- приватную реализацию хука;
- функции, которые только пробрасывают данные дальше.

## Техники проектирования тестов

Используй минимальный полезный набор:

- Given / When / Then для каждого сценария OpenSpec.
- Классы эквивалентности для групп входных данных.
- Граничные значения для лимитов.
- Тестирование переходов состояний для auth/session/multi-step flows.
- Таблицы решений для ролей и прав доступа.
- Error guessing для 500/404, сетевых ошибок, двойной отправки, устаревших данных, истёкшей сессии, медленной загрузки и кнопки Back.

## Метрики покрытия

Главная метрика:

```text
100% сценариев MUST/SHALL автоматизированы, обоснованно проверяются вручную или имеют явный waiver.
```

Для покрытия кода используй baseline с учётом риска, а не погоню за процентом строк:

- Чистая логика/валидаторы/мапперы: 90-95% lines/statements, 85-90% branches.
- Hooks/stores: 85-90% lines/statements, 80-85% branches.
- Значимые клиентские компоненты: 70-85% lines/statements, 60-75% branches.
- Страницы со сложными внешними взаимодействиями: 60-75% lines/statements, 50-70% branches.
- Репозиторий целиком после исключений: 75-85% lines/statements, 70-80% branches.

Исключай сгенерированные файлы, `.next/`, `node_modules/`, barrel exports, статическую конфигурацию, файлы только с типами, stories, которые не используются как тесты, fixtures и mock factories без логики.

## Команды верификации

Выбирай команды по затронутой области:

- OpenSpec: `openspec validate <change-name> --strict --no-interactive`; для полной проверки репозитория используй `openspec validate --all --strict --no-interactive`.
- Frontend unit: из `apps/frontend` запускай `bun run test:unit`; точечно `bunx vitest run --project unit path/to/file.unit.test.ts`.
- Frontend component: из `apps/frontend` запускай `bun run test:component`; точечно `bunx vitest run --project component path/to/file.component.test.tsx`.
- Frontend E2E: из `apps/frontend` запускай `bun run test:e2e` или `bun run test:e2e:smoke`; точечно `bunx playwright test path/to/file.e2e.spec.ts`.
- Frontend static/build: из `apps/frontend` запускай `bun run lint`, `bun run typecheck`, `bun run test:coverage`, если менялось покрытие, и `bun run build`.
- API: из `api` запускай `npm run lint`; добавляй `npm run bundle`, если затронуты `$ref` или bundled output.
- E2E smoke/full E2E: запускай только если требуется по риску; иначе фиксируй ручное exploratory-тестирование или waiver в `test-plan.md`.

## Критерии готовности к разработке

Фича готова к разработке, когда есть:

- OpenSpec change;
- требования и сценарии Given/When/Then;
- TDD-план: какой failing test появится до реализации;
- уровень риска;
- затронутые маршруты/компоненты/API;
- выбранные уровни тестирования;
- план соблюдения правил frontend-тестов;
- критерии приемки;
- план тестовых данных.

## Критерии завершения

Фича завершена, когда:

- все сценарии OpenSpec существуют в `test-plan.md`;
- обязательные unit/component-тесты проходят;
- правила frontend-тестов соблюдены;
- E2E smoke проходит, если требуется;
- coverage gates проходят, если применимы;
- OpenSpec валидируется;
