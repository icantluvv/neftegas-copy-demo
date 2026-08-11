# Стратегия data-fetching — TanStack Query v5 + Kubb codegen, Suspense как умолчание, стриминг с сервера

---

## Контекст

Проект Дэшборд Нефтегаз — Next.js 16 + React 19 с App Router. Данные с бэкенда (NestJS) нужны как на сервере (SSR,
стриминг), так и на клиенте (интерактивность, фоновые обновления). OpenAPI-схема живёт в `api/src/openapi.yaml`; из
неё Kubb генерирует TypeScript-типы, fetch-клиенты, Zod-схемы и React Query хуки в `packages/api/base/codegen/`.

### Проблема

Необходимо определить:

1. Какой инструмент управляет серверным состоянием на клиенте?
2. Какой хук-паттерн (Suspense vs non-Suspense) использовать по умолчанию?
3. Как передавать данные с сервера на клиент без double-fetching?
4. Когда применять Server Functions (Server Actions, Route Handlers), а когда нет?
5. Как интегрировать автогенерированный код Kubb с этими решениями?

### Ограничения

- React 19 + React Compiler — конкурентный рендеринг и Suspense поддерживаются первоклассно
- Next.js App Router даёт RSC как основной серверный примитив
- Команда 2–3 разработчика — избыточная сложность недопустима
- Все API-методы описаны в OpenAPI; ручное написание fetch-клиентов и типов — потеря времени

---

## Решение

### Принцип: TanStack Query как единственный менеджер серверного состояния на клиенте

Все GET-запросы к API идут через TanStack Query. Прямые `fetch` в клиентских компонентах, SWR, Context-based
кеши и ручные `useState/useEffect` для серверных данных — не используются.

### Принцип: Suspense Query по умолчанию

Для всех GET-запросов к API используются генерируемые Kubb `useSuspenseXxx`-хуки (например, `useSuspenseGetMeProfile`).
Это устраняет необходимость обрабатывать `isLoading` вручную — компонент рендерится только тогда, когда данные уже
есть. Граница `<Suspense>` отвечает за fallback-состояние, `<ErrorBoundary>` — за ошибки.

Для генерации Suspense-хуков в `packages/api/kubb.config.ts` включён флаг `suspense: true` в `pluginReactQuery`.
Kubb генерирует для каждого GET-эндпоинта пару: `useXxx` (обёртка над `useQuery`) и `useSuspenseXxx` (обёртка над
`useSuspenseQuery`). В клиентских компонентах всегда используется `useSuspenseXxx`.

`useXxx` (non-Suspense) применяется только в явно обоснованных случаях — см. раздел «Когда не использовать Suspense».

### Архитектура: стриминг с сервера

```
RSC (Server Component)                   Client Component
─────────────────────                   ─────────────────
prefetchQuery(getXxxQueryOptions())  →   HydrationBoundary
   ↓                                        ↓
dehydrate(queryClient)               →   useSuspenseXxx()
   ↓                                        ↓
<HydrationBoundary state={…}>            данные уже в кеше → нет
   <Suspense fallback={…}>               waterfall-запроса с клиента
     <ClientComponent />
   </Suspense>
</HydrationBoundary>
```

`shouldDehydrateQuery` в `get-query-client.ts` включает запросы со статусом `pending` — это позволяет Next.js
стримить HTML: RSC начинает prefetch, React «замораживает» компонент до завершения запроса и постепенно досылает чанки
клиенту. Клиент получает данные вместе с разметкой, повторного запроса нет.

### Паттерны использования

#### 1. Стандартный Suspense-запрос в клиентском компоненте

```tsx
// app/(public)/profile/page.tsx — RSC, prefetch на сервере
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getQueryClient } from "#/utils/get-query-client";
import { getMeProfileQueryOptions } from "@repo/api/base";
import { ProfileCard } from "./profile-card";

export default async function ProfilePage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(getMeProfileQueryOptions());

  return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileCard />
            </Suspense>
          </HydrationBoundary>
  );
}
```

```tsx
// profile-card.tsx — Client Component
"use client";

import { useSuspenseGetMeProfile } from "@repo/api/base";

export function ProfileCard() {
  const { data } = useSuspenseGetMeProfile();
  // data гарантированно не undefined — Suspense не пропустит компонент до resolve
  return <div>{data.fullName}</div>;
}
```

#### 2. Стриминг без await на сервере (параллельный fetch + streaming)

Если prefetch не критичен для SEO или First Paint, можно не `await` — React стримит fallback сразу, данные досылает
по готовности:

```tsx
export default async function ContestsPage() {
  const queryClient = getQueryClient();
  // Запускаем без await — не блокируем рендер страницы
  void queryClient.prefetchQuery(getMeContestsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ContestsSkeleton />}>
        <ContestsList />
      </Suspense>
    </HydrationBoundary>
  );
}
```

#### 3. Мутации — генерированные хуки как есть

Для POST/PUT/DELETE/PATCH Kubb генерирует `useMutation`-хуки. Используем их напрямую. После успешной мутации
инвалидируем связанные запросы через `queryClient.invalidateQueries`:

```tsx
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRegisterParticipant, getMeProfileQueryKey } from '@repo/api/base'

export function RegistrationForm() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useRegisterParticipant({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getMeProfileQueryKey() })
      },
    },
  })

  return <form onSubmit={…}>{…}</form>
}
```

### Когда не использовать Suspense

| Ситуация                                                              | Паттерн                           |
| --------------------------------------------------------------------- | --------------------------------- |
| Данные опциональны и их отсутствие — нормальное состояние (не ошибка) | `useQuery` + проверка `data`      |
| Запрос условно отключён (`enabled: false`)                            | `useQuery` с `enabled`            |
| Тихий фоновый polling без блокировки UI                               | `useQuery` с `refetchInterval`    |
| Lazy-запрос по действию пользователя без fallback                     | `useQuery` с `enabled: !!trigger` |

### Когда использовать Server Functions (Server Actions / Route Handlers)

Server Functions применяются **только** там, где они технически необходимы:

| Случай                                            | Обоснование                                            |
| ------------------------------------------------- | ------------------------------------------------------ |
| Аутентификационные флоу (регистрация, logout)     | Требуют серверного доступа к auth-провайдеру и `Set-Cookie` |
| Вызовы внешних partner API с приватными credentials | Credentials не должны утекать в браузер                |
| Форма с файлами (multipart) + серверная валидация | Route Handler как BFF-прокси к NestJS API               |
| `revalidatePath` / `revalidateTag` после мутации  | Server Action как единственный способ                  |

Server Functions **не используются** для обычного получения данных, которые можно получить напрямую через React
Query + BFF-прокси. Причины:

- Нет кеширования и дедупликации запросов из коробки
- Нет фонового обновления, stale-while-revalidate
- Нет интеграции с DevTools
- Смешивают серверный и клиентский data-flow, усложняя отладку

### QueryClient и конфигурация

`getQueryClient()` (`src/utils/get-query-client.ts`) возвращает синглтон на клиенте и новый экземпляр на каждый SSR
запрос. Текущие умолчания:

- `staleTime: 60_000` — данные считаются свежими 1 минуту; повторный mount не триггерит fetch
- `dehydrate.shouldDehydrateQuery` включает `pending`-запросы — обязательно для стриминга
- `shouldRedactErrors: false` — ошибки API передаются клиенту без редактирования (необходимо для корректной работы
  ErrorBoundary с серверными ошибками)

### Query Keys

Query keys генерируются Kubb и экспортируются как `getXxxQueryKey()`. Не использовать строковые ключи вручную.
При инвалидации после мутации использовать эти фабрики:

```ts
// Правильно
queryClient.invalidateQueries({ queryKey: getMeProfileQueryKey() });

// Неправильно
queryClient.invalidateQueries({ queryKey: ["/me/profile"] });
```

---

## Альтернативы

### A. Next.js `fetch` с `cache` / `unstable_cache` в RSC

Нативный способ кеширования данных в App Router — расширенный `fetch` с тегами для `revalidateTag`.

**Плюсы:** нет внешней зависимости, встроен в фреймворк, работает на сервере без дополнительных прослоек.

**Минусы:** нет клиентского кеша — при навигации данные перезапрашиваются; нет фонового обновления и
stale-while-revalidate; нет DevTools; нет `optimistic updates`; `unstable_cache` — нестабильный API с ограничениями
по сериализации. Для интерактивных страниц с формами и мутациями придётся всё равно добавлять React Query сверху.

**Причина отказа:** разделение между серверным `fetch`-кешем и клиентским состоянием усложняет модель. Единый TanStack
Query с HydrationBoundary проще и покрывает оба слоя.

### B. SWR

Аналог TanStack Query от Vercel. Меньший API, меньший bundle size.

**Плюсы:** проще API, официальная поддержка Vercel.

**Минусы:** меньше возможностей (нет `select`, ограниченный Suspense support, нет `placeholderData`); хуже интеграция с
SSR в v5-паттерне HydrationBoundary; DevTools слабее.

**Причина отказа:** TanStack Query v5 предоставляет более полный API при сопоставимом bundle size и лучшую интеграцию
с React 19 Suspense.

### C. Прямые Server Functions для всех GET-запросов

Все данные получать через `async` Server Components или Server Actions, без клиентского кеша.

**Плюсы:** меньше зависимостей, проще концептуальная модель для статических страниц.

**Минусы:** нет клиентского кеша — любая навигация назад вызывает полный рефетч; нет оптимистичных обновлений; нет
фонового обновления; мутации сложнее координировать с отображением данных; нет DevTools.

**Причина отказа:** для приложения с личным кабинетом, формами и интерактивными состояниями (статус участия, загрузка
файлов) клиентский кеш необходим.

### D. TanStack Query без Suspense (только `useQuery`)

Использовать `useQuery` с явной обработкой `isLoading`/`isError` во всех компонентах.

**Плюсы:** привычный паттерн, меньше требований к структуре компонентов (не нужны ErrorBoundary).

**Минусы:** каждый компонент несёт ответственность за состояния загрузки/ошибки — дублирование; сложнее организовать
параллельные запросы без waterfall; нет гарантии non-undefined `data` в теле компонента.

**Причина отказа:** React 19 + Next.js App Router проектировались с расчётом на Suspense как на первоклассный
примитив. `useSuspenseQuery` убирает `undefined` из типа `data`, упрощает компоненты и делает
loading/error-состояния декларативными через Suspense/ErrorBoundary-дерево.

---

## Последствия

### Плюсы

- **Типобезопасность end-to-end.** Kubb генерирует типы из OpenAPI — нет ручных интерфейсов для API-ответов.
- **Нет waterfall и double-fetch.** Prefetch на сервере + HydrationBoundary — данные приходят вместе с HTML.
- **Простые компоненты.** `useSuspenseQuery` убирает `isLoading`/`data?.field` — компонент работает только в
  «данные есть» состоянии.
- **Единый cache и DevTools.** Все запросы видны в React Query DevTools; инвалидация через `invalidateQueries`
  работает глобально.
- **Стриминг из коробки.** `shouldDehydrateQuery` с `pending` уже настроен — достаточно убрать `await` перед
  `prefetchQuery` и обернуть в `<Suspense>`.

### Минусы

- **Обязательные ErrorBoundary.** Suspense-компоненты не имеют встроенной обработки ошибок — каждый Suspense-узел
  должен быть обёрнут `ErrorBoundary`. Без этого необработанная ошибка сломает всё дерево.
- **Сложнее условные запросы.** `useSuspenseQuery` нельзя использовать с `enabled: false` — для условных запросов
  нужен `useQuery` или разделение компонентов.
- **Overhead Kubb при изменении схемы.** Каждое изменение OpenAPI требует перегенерации (`bun run generate` в
  `packages/api`). Сгенерированные файлы коммитятся в репозиторий — diff при изменении схемы большой.
- **HydrationBoundary boilerplate.** Каждый RSC, делающий prefetch, требует `dehydrate` + `<HydrationBoundary>`. Это
  повторяющийся шаблон, но он явный и предсказуемый.

### Риски

| Риск                                                        | Вероятность | Митигация                                                               |
| ----------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| ErrorBoundary отсутствует вокруг Suspense → белый экран     | Средняя     | Lint-правило или review-чеклист; глобальный ErrorBoundary как страховка |
| `staleTime: 60s` приводит к устаревшим данным после мутации | Средняя     | Явная инвалидация через `invalidateQueries` в `onSuccess` мутации       |
| prefetchQuery + dehydrate на каждой странице → дублирование | Средняя     | Вынести в layout, если данные нужны на всех страницах раздела           |

---

## Чеклист

- [ ] GET-запрос в клиентском компоненте → `useSuspenseXxx()` (генерируемый Kubb хук)
- [ ] Над Suspense-компонентом — `<Suspense fallback>` + `<ErrorBoundary>`
- [ ] RSC делает `prefetchQuery` → оборачивает в `<HydrationBoundary state={dehydrate(queryClient)}>`
- [ ] Мутация завершилась → `queryClient.invalidateQueries({ queryKey: getXxxQueryKey() })`
- [ ] Новый эндпоинт в OpenAPI → `bun run generate` в `packages/api` → коммит сгенерированных файлов
- [ ] Server Function — только если данные требуют server-only секрета или `Set-Cookie`
