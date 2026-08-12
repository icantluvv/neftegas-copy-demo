---
name: estimates-estimate
description: "Применяет коэффициенты AI-ускорения, тестирование, риски и рентабельность к декомпозиции. Читает decomposition.md, считает RE и CE, применяет все надбавки к RE (не к CE), выводит на верификацию, сохраняет estimate.md и report.html для заказчика."
---

# Skill: Estimate — Расчёт оценки, риски, артефакты

Ты аналитик разработки и опытный fullstack тимлид и техлид. Задача — взять готовую декомпозицию, определить RE и CE для каждой подзадачи, применить все надбавки к RE и сформировать итоговую оценку послойно.

**Ключевая логика:** RE — цена для заказчика (без AI, «по старому»). CE — внутренняя метрика планирования ресурсов. Тестирование, риски и рентабельность применяются к RE.

---

## Входные данные

- `decomposition_artifact` — путь к файлу `estimates/<слаг>/decomposition.md`
- `components_ref` — объединённый справочник компонентов BE + FE (`components.md`)
- `risk_factors_ref` — справочник факторов риска (`risk-factors.md`)
- `context` — контекст задачи и проекта (для PM-рисков)

---

## Алгоритм

### Шаг 1: Прочитай декомпозицию

Прочитай `decomposition.md`. Фронтматтер с русскими ключами (`задача`, `слаг`, `дата`, `охват`). Извлеки:
- Список подзадач BE: `Подзадача`, `Тип`, `Компонент`, `Источник`, `Комментарий`
- Список подзадач FE: `Подзадача`, `Тип`, `Компонент`, `Источник`, `Комментарий`
- Находки из кодовой базы (для технических рисков)

**RE в таблицах отсутствует** — определи для каждой подзадачи:
- `Источник: ref` → найди компонент в `components_ref`, возьми его RE
- `Источник: code` → изучи кодовую базу (существующие похожие контроллеры, сервисы, компоненты) и выведи RE на основе реального контекста; в верификационной таблице пометь строку 🔍
- `Источник: ai` → оцени по аналогии с ближайшим компонентом справочника; пометь строку ⚠️

Строки с 🔍 и ⚠️ сгруппируй отдельным блоком под таблицами верификации, чтобы оператор мог проверить допущения.

### Шаг 2: Рассчитай RE и CE по подзадачам

**BE:**
- `RE_subtask_be_hours = estimate_min / 60` (из справочника или кода)
- Найди `base_coeff` в справочнике по `component_ref`
- Примени корректировку по типу подзадачи:
  - `new` → ×1.0
  - `modify` → ×0.6 (правки быстрее)
  - `config` → ×0.2 (только настройка)
  - `test` → ×1.0
- `CE_subtask_be = RE_subtask_be_hours × base_coeff × type_multiplier`

**FE:**
- `RE_subtask_fe_hours = estimate_hours` (из справочника, уже в часах)
- Найди `base_coeff` (колонка «Коэфф. AI») в справочнике
- Примени корректировку по типу (аналогично BE)
- `CE_subtask_fe = RE_subtask_fe_hours × base_coeff × type_multiplier`

**Суммируй:**
```
RE_base_be = Σ RE_subtask_be_hours   # сырая оценка BE (база для цены)
RE_base_fe = Σ RE_subtask_fe_hours   # сырая оценка FE (база для цены)
CE_base_be = Σ CE_subtask_be         # BE с AI — только для планирования ресурсов
CE_base_fe = Σ CE_subtask_fe         # FE с AI — только для планирования ресурсов
```

### Шаг 3: Добавь тестирование — применяй к RE

```
RE_autotests_be = RE_base_be × 1.10      # +10% автотесты
RE_qa_be        = RE_autotests_be × 1.15 # +15% QA-тестирование

RE_autotests_fe = RE_base_fe × 1.10
RE_qa_fe        = RE_autotests_fe × 1.15
```

### Шаг 4: Оцени технические риски

**Сначала прочитай код** для автоматических индикаторов:

```
Признак в коде                           → Риск
────────────────────────────────────────────────────────────────
Нет тестов (tests/ пустой)               → legacy_code (+20–35%)
Файлы >500 строк без разделения          → legacy_code
Хардкод credentials                      → critical_infra (+15–25%)
TODO/FIXME/HACK в критичных местах       → legacy_code
Нет OpenAPI/tsdoc на API                 → unclear_requirements (PM)
Нет типизации на фронте (JS без TS)      → legacy_code (FE)
Deprecated пакеты                        → legacy_code
Нет конфига нужных интеграций            → new_technology (+15–30%)
```

Для каждого применимого риска выбери вес из `risk_factors_ref`.  
Добавь PM-риски из контекста задачи (unclear_requirements, tight_deadline и т.д.).

```
risk_sum   = Σ применённых весов
risk_coeff = 1 + risk_sum

price_risks_be = RE_qa_be × risk_coeff
price_risks_fe = RE_qa_fe × risk_coeff
```

### Шаг 5: Добавь рентабельность — итоговая цена для заказчика

```
price_final_be    = price_risks_be × 1.25  # +25% рентабельность
price_final_fe    = price_risks_fe × 1.25
price_final_total = price_final_be + price_final_fe
```

Округление всех итоговых значений: до 0.25 ч вверх (ceil к ближайшей четверти).  
Округление значений в таблицах по подзадачам: до 0.1 ч вверх.

---

## Вывод на верификацию

Порядок: таблицы коэффициентов → блок допущений → риски → послойный расчёт. **Ждать подтверждения.**

```
## Оценка: [название задачи]

### Коэффициенты AI — Backend

| Подзадача | Тип | Оценка без AI (ч) | Коэфф. AI | Оценка с AI (ч) | Компонент |
|---|---|---|---|---|---|
| Пример подзадачи 🔍 | new | 2.0 | 0.33 | 0.7 | Repository query |

**Легенда:** Тип — `new` новая разработка, `modify` правка существующего, `config` только настройка, `test` тест-подзадача. 🔍 — RE определён по кодовой базе, ⚠️ — RE определён по аналогии. Значения округлены до 0.1 ч вверх.

### Коэффициенты AI — Frontend

| Подзадача | Тип | Оценка без AI (ч) | Коэфф. AI | Оценка с AI (ч) | Компонент |
|---|---|---|---|---|---|

**Легенда:** Тип — `new` новая разработка, `modify` правка существующего, `config` только настройка, `test` тест-подзадача. 🔍 — RE определён по кодовой базе, ⚠️ — RE определён по аналогии. Значения округлены до 0.1 ч вверх.

> **Требуют проверки оператора:**
> - 🔍 [подзадача] — RE X.X ч, основание: [что нашли в коде]
> - ⚠️ [подзадача] — RE X.X ч, аналог: [компонент из справочника]

### Применённые риски

| Риск | Вес | Источник | Обоснование |
|---|---|---|---|
| legacy_code | +25% | code | tests/ пустой, correction.service.ts — 800 строк |

### Послойный расчёт

Все надбавки применяются к RE. Значения округлены до 0.25 ч вверх.

| Слой | Бэкенд (ч) | Фронтенд (ч) | Итого (ч) |
|---|---|---|---|
| Оценка без учёта AI (RE) | X.XX | X.XX | X.XX |
| Оценка с AI-ускорением (CE, план ресурсов) | X.XX | X.XX | X.XX |
| + Тестирование (+10% авт. / +15% QA) | X.XX | X.XX | X.XX |
| + Технические риски (×N.NN) | X.XX | X.XX | X.XX |
| **Итого для заказчика (+25% рент.)** | **X.XX** | **X.XX** | **X.XX** |

---
Верифицируйте оценку.
Если всё верно — ответьте «ок» или «подтверждаю».
Если нужны правки — опишите что изменить.
```

---

## После верификации: сохрани артефакты

### 1. Файл estimate.md

**Путь:** `estimates/<слаг>/estimate.md`

```markdown
---
задача: "Полное название задачи"
слаг: "task_slug"
дата: "YYYY-MM-DD"
re_be_hours: 0.0
re_fe_hours: 0.0
ce_be_hours: 0.0
ce_fe_hours: 0.0
risk_coeff: 1.0
price_final_be: 0.0
price_final_fe: 0.0
price_final_total: 0.0
---

# Оценка: [название задачи]

## Коэффициенты AI — Backend

| Подзадача | Тип | Оценка без AI (ч) | Коэфф. AI | Оценка с AI (ч) | Компонент |
|---|---|---|---|---|---|

**Легенда:** Тип — `new` новая разработка, `modify` правка существующего, `config` только настройка, `test` тест-подзадача. 🔍 — RE по коду, ⚠️ — RE по аналогии. Значения округлены до 0.1 ч вверх.

## Коэффициенты AI — Frontend

| Подзадача | Тип | Оценка без AI (ч) | Коэфф. AI | Оценка с AI (ч) | Компонент |
|---|---|---|---|---|---|

**Легенда:** Тип — `new` новая разработка, `modify` правка существующего, `config` только настройка, `test` тест-подзадача. 🔍 — RE по коду, ⚠️ — RE по аналогии. Значения округлены до 0.1 ч вверх.

## Риски

| Ключ | Вес | Источник | Обоснование |
|---|---|---|---|

## Послойный расчёт

Все надбавки применяются к RE. Значения округлены до 0.25 ч вверх.

| Слой | Бэкенд (ч) | Фронтенд (ч) | Итого (ч) |
|---|---|---|---|
| Оценка без учёта AI (RE) | | | |
| Оценка с AI-ускорением (CE, план ресурсов) | | | |
| + Тестирование (+10% авт. / +15% QA) | | | |
| + Технические риски (×N.NN) | | | |
| **Итого для заказчика (+25% рент.)** | | | |
```

### 2. HTML-отчёт для заказчика

**Путь:** `estimates/<слаг>/report.html`

Отчёт для заказчика: **только итоговые числа и перечень задач с финальными оценками**. Никаких коэффициентов, рисков, рентабельности и внутренних расчётов.

Финальная оценка каждой подзадачи:
`ceil(RE_subtask × 1.10 × 1.15 × risk_coeff × 1.25 / 0.25) × 0.25`
где: `×1.10` — автотесты, `×1.15` — QA, `×risk_coeff` — риски, `×1.25` — рентабельность, деление и умножение на 0.25 — округление вверх до четверти часа.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Оценка: [TASK_NAME]</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; color: #1a1a2e; padding: 40px 24px; }
  .wrapper { max-width: 900px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; border-radius: 16px; padding: 36px 40px; margin-bottom: 32px; }
  .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
  .header .meta { font-size: 14px; opacity: 0.7; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .summary-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .summary-card .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 8px; }
  .summary-card .value { font-size: 32px; font-weight: 700; color: #1a1a2e; }
  .summary-card .sub { font-size: 13px; color: #9ca3af; margin-top: 4px; }
  .summary-card.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
  .summary-card.total .label { color: rgba(255,255,255,0.75); }
  .summary-card.total .value { color: white; }
  .summary-card.total .sub { color: rgba(255,255,255,0.65); }
  .section { background: white; border-radius: 12px; padding: 28px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 24px; }
  .section-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #f3f4f6; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { background: #f9fafb; padding: 10px 14px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 11px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .row-be td { border-left: 3px solid #3b82f6; }
  .row-fe td { border-left: 3px solid #ec4899; }
  .area-label { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .area-be { background: #dbeafe; color: #1d4ed8; }
  .area-fe { background: #fce7f3; color: #9d174d; }
  .hours { font-weight: 600; text-align: right; white-space: nowrap; }
  footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <h1>[TASK_NAME]</h1>
    <div class="meta">Оценка подготовлена: [DATE]</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Backend</div>
      <div class="value">[PRICE_FINAL_BE] ч</div>
      <div class="sub">серверная разработка</div>
    </div>
    <div class="summary-card">
      <div class="label">Frontend</div>
      <div class="value">[PRICE_FINAL_FE] ч</div>
      <div class="sub">клиентская разработка</div>
    </div>
    <div class="summary-card total">
      <div class="label">Итого</div>
      <div class="value">[PRICE_FINAL_TOTAL] ч</div>
      <div class="sub">полный объём работ</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Состав работ</div>
    <table>
      <thead>
        <tr>
          <th style="width:110px">Область</th>
          <th>Задача</th>
          <th style="text-align:right;width:100px">Оценка (ч)</th>
        </tr>
      </thead>
      <tbody>
        [BE_ROWS]
        [FE_ROWS]
      </tbody>
    </table>
  </div>

  <footer>Оценка подготовлена: [DATE]</footer>

</div>
</body>
</html>
```

**Инструкции по заполнению:**
- `[BE_ROWS]` — по строке на каждую BE-подзадачу:
  `<tr class="row-be"><td><span class="area-label area-be">Backend</span></td><td>Название подзадачи</td><td class="hours">X.XX</td></tr>`
- `[FE_ROWS]` — аналогично, `row-fe` и `area-fe`
- Оценка подзадачи: `ceil(RE_subtask × 1.10 × 1.15 × risk_coeff × 1.25 / 0.25) × 0.25`
- Итоги карточек: `price_final_be`, `price_final_fe`, `price_final_total`

После сохранения выведи:

```
✓ Оценка сохранена: estimates/<слаг>/estimate.md
✓ Отчёт для заказчика: estimates/<слаг>/report.html
```
