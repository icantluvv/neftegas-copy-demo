## Context

См. `proposal.md` — Why. Технический контекст:

- Источник требования — `docs/tz/filial-cabinet.md`, раздел 0.3, закрытый
  открытый вопрос из версии документа без даты (была помечена как
  «требует решения заказчика», решение получено и зафиксировано в этом же
  файле).
- Слоты пакета (`DocumentSlot`) создаются в `CorrectionsService.create()`
  по составу `PackageRequirement` конкретного `CorrectionType` — один слот на
  каждое требование с `kind` `EXCEL_SHEET`/`DOCUMENT`, плюс один общий слот
  «Excel корректировка» без привязки к требованию (`requirementId = null`).
  `PackageRequirement` принадлежит ровно одному `CorrectionType` (FK
  `correction_type_id`), поэтому у двух разных типов не может быть общих
  строк `PackageRequirement` — смена типа не может «переиспользовать»
  существующие типозависимые слоты, только пересоздать их.
- `deleteCorrection()` уже реализует паттерн «удалить строки в транзакции,
  затем удалить физические файлы с диска вне транзакции, игнорируя ошибки
  `unlink`» — `updateCorrectionType()` использует тот же паттерн для
  типозависимых слотов вместо удаления корректировки целиком.
- Ручная проверка через `curl` под демо-аккаунтом подтвердила happy path,
  guard-условия (403/400/404) и no-op при том же типе; полная проверка
  реконсиляции слотов между двумя разными типами не выполнена — в демо-сиде
  на момент реализации существует только один активный `CorrectionType`
  (см. `proposal.md` — Влияние на качество).

## Goals / Non-Goals

**Goals:**
- Дать автору-филиалу возможность сменить тип корректировки в `DRAFT` через
  `/corrections/{humanId}/edit`, переиспользуя UI-паттерн
  `create-correction-form.tsx`.
- Корректно реконсилировать типозависимые слоты пакета при смене типа, не
  трогая общий слот «Excel корректировка».

**Non-Goals:**
- Любые другие поля корректировки, кроме типа, — `docs/tz/filial-cabinet.md`
  (раздел 0.3) явно ограничивает маршрут одним полем.
- Предупреждение/подтверждающий диалог перед потерей файлов сверх текстового
  предупреждения в форме — не специфицировано ЧТЗ, минимальная реализация.
- Второй `CorrectionType` в демо-сиде для полноценной ручной проверки
  реконсиляции — вне рамок этой задачи (сид — предмет `database/seed.ts`,
  отдельная забота).

## Decisions

### Реконсиляция слотов — удалить типозависимые, создать заново
Альтернатива — попытаться «мигрировать» версии файлов из старых слотов в
новые по совпадению названия/позиции — отклонена: `PackageRequirement`
разных типов — разные строки без формальной связи (нет общего идентификатора
кроме текстового совпадения `name`, на которое небезопасно полагаться),
а сама смена типа физически означает другой состав обязательного пакета —
привязка старого файла к слоту, которого в новом типе может не быть по
смыслу (не только по названию), была бы более рискованной инвариант-
нарушающей операцией, чем прямая и предсказуемая потеря данных с явным
предупреждением в UI.

### Guard в сервисе, не только в контроллере
`updateCorrectionType()` дублирует проверку роли/владения/статуса и `404`
для типа — по тому же принципу, что и все остальные мутации
`CorrectionsService` (см. `apps/backend/AGENTS.md`): фронт может скрывать
кнопку, но реальная защита — бэкенд.

### UI — переиспользование Select из create-correction-form, не общий компонент
Форма `edit-correction-type-form.tsx` дублирует разметку `Select` из
`create-correction-form.tsx`, а не выносит общий компонент — единственное
отличие (предзаполнение текущим типом, другая мутация, другой текст) не
оправдывает абстракцию для двух мест использования (см. root `AGENTS.md`:
не проектировать сверх текущих нужд).

## API Shape

Новый эндпоинт (полный контракт — `api/src/paths/corrections-human-id-change-type.yaml`):

| Метод | Путь | Роль | Назначение |
|---|---|---|---|
| POST | `/corrections/{humanId}/change-type` | FILIAL (автор) | Сменить тип корректировки в статусе `DRAFT` |

Request: `CorrectionTypeChangeInput { correctionTypeId: integer }`.
Response `200`: `CorrectionDetail` (та же схема, что у остальных мутаций
корректировки). Errors: `400` (не `DRAFT`), `403` (не автор), `404`
(корректировка или тип не найдены).

Обратная совместимость: аддитивно, существующие эндпоинты не менялись.

## Backend

`apps/backend/src/corrections/`:
- `dto/update-correction-type.dto.ts` — новый, `{ correctionTypeId: number }`.
- `corrections.service.ts` — метод `updateCorrectionType(user, humanId, dto)`.
- `corrections.controller.ts` — `POST :humanId/change-type`, `@Roles(FILIAL)`.

## Frontend

- `apps/frontend/app/(private)/corrections/[humanId]/edit/page.tsx` — RSC:
  `getCorrection({ humanId })` напрямую (без Suspense-хука — страница не
  входит в основной ADR-паттерн детальной карточки, это отдельная простая
  форма по паттерну `/corrections/create`), guard
  `isFilialOwner && status === "DRAFT"` → `AccessDeniedScreen`, `404` →
  `NotFoundScreen`, `403` → `AccessDeniedScreen`.
- `.../edit/components/edit-correction-type-form.tsx` — `"use client"`,
  `useChangeCorrectionType` + `useGetCorrectionTypes`, редирект на
  `/corrections/{humanId}` по успеху.
- `.../components/correction-header.tsx` — условная ссылка «Изменить тип»
  рядом с названием типа, видна при `isFilialOwner && status === "DRAFT"`.

## Files / Owners

| Область | Файлы | Владелец |
|---|---|---|
| API | `api/src/components/schemas/correction.yaml`, `api/src/paths/corrections-human-id-change-type.yaml`, `api/src/openapi.yaml` | автор change |
| Backend | `apps/backend/src/corrections/{dto/update-correction-type.dto.ts,corrections.service.ts,corrections.controller.ts}` | автор change |
| Frontend | `apps/frontend/app/(private)/corrections/[humanId]/edit/**`, `.../components/correction-header.tsx` | автор change |

## Readiness Decision

**ready with conditions** — реализация функционально завершена и вручную
проверена через прямые HTTP-запросы (happy path, все guard-условия, no-op),
но: (1) автоматизированное тестовое покрытие отсутствует, (2) реконсиляция
слотов между двумя разными типами не проверена вручную из-за единственного
активного типа в демо-сиде. Перед архивацией change нужно закрыть оба пункта
или оформить явные waiver'ы в `test-plan.md`.

## Тестовая стратегия

- Риск фичи: **P1** (см. `proposal.md` — Влияние на качество): необратимая
  потеря уже загруженных файлов при смене типа.
- Backend Unit/Feature (Jest, `corrections.service.spec.ts`): guard-условия
  (403/400/404), реконсиляция слотов между двумя разными типами (требует
  тестовой фикстуры с двумя `CorrectionType`), no-op при том же типе,
  сохранность общего слота «Excel корректировка» и его версий.
- Frontend Component: `edit-correction-type-form.component.test.tsx` —
  disabled-состояние кнопки при невыбранном/неизменённом типе, вызов
  мутации, редирект по успеху.
- Frontend E2E: happy path смены типа с последующей проверкой состава слотов
  на карточке корректировки.
- Verification gates: `npx tsc --noEmit` (backend и frontend) — чисто;
  `bun run lint` (backend и frontend) — без новых ошибок; `redocly lint`
  (`api/`) — валиден.

## Risks / Trade-offs

- [Риск] Необратимая потеря уже загруженных файлов при ошибочном выборе
  нового типа → Митигация: действие доступно только в `DRAFT` (до внешних
  последствий направления), текстовое предупреждение в форме перед
  сохранением.
- [Риск] Реконсиляция слотов не проверена вручную между двумя разными
  типами (только один активный тип в демо-сиде) → Митигация: логика —
  точная копия уже проверенного и работающего алгоритма из `create()`,
  применённая к тем же данным; риск снижен, но не снят — зафиксировано как
  условие Readiness Decision.

## Open Questions

Нет — ЧТЗ по этому элементу (раздел 0.3) содержит принятое решение, не
открытый вопрос.
