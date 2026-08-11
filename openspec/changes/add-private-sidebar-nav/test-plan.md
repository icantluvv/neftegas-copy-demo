# Test Plan

## Risk level

P2

## Scenario coverage

| Requirement | Scenario | Risk | Test level | Test file | Status |
| ----------- | -------- | ---: | ---------- | --------- | ------ |
| Боковая навигация приватного контура | Сайдбар виден на приватной странице | P2 | Component | `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx` | Done |
| Боковая навигация приватного контура | Раскладка ширины на десктопе | P3 | Manual | — | Planned (визуальная проверка ширины 1/5, автотест на конкретные px/проценты не пишем) |
| Адаптивное поведение сайдбара на мобильных экранах | Сайдбар скрыт на мобильном экране по умолчанию | P2 | Component | `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx` | Done |
| Адаптивное поведение сайдбара на мобильных экранах | Открытие сайдбара по кнопке-бургеру на мобильном экране | P2 | Component | `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx` | Done |
| Адаптивное поведение сайдбара на мобильных экранах | Закрытие сайдбара на мобильном экране по кнопке-бургеру | P2 | Component | `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx` | Done |
| Адаптивное поведение сайдбара на мобильных экранах | Закрытие сайдбара на мобильном экране по выбору пункта меню | P2 | Component | `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx` | Done |
| Выход из аккаунта через сайдбар | Успешный выход | P2 | Component | `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx` | Done |
| Выход из аккаунта через сайдбар | Ошибка при выходе | P2 | Component | `apps/frontend/app/(private)/components/sidebar-nav.component.test.tsx` | Done |

## Required automated tests

### Unit

- (нет) — логика тривиальна, покрывается на component-уровне вместе с рендером.

### Component

- [x] `SidebarNav` рендерит пункт «Дашборд» и кнопку «Выйти»
- [x] Клик «Выйти» → вызов `useLogout` → успех → `router.replace("/login")`
- [x] Клик «Выйти» → вызов `useLogout` → ошибка → `toast.error`, без редиректа
- [x] На мобильном viewport сайдбар скрыт, видна кнопка-бургер
- [x] Клик по кнопке-бургеру на мобильном viewport открывает сайдбар на всю ширину экрана
- [x] Повторный клик по кнопке-бургеру закрывает сайдбар
- [x] Клик по пункту навигации на мобильном viewport при открытом сайдбаре закрывает сайдбар

### Integration

_(не вводится согласно тестовому подходу проекта)_

### E2E

_(нет — сквозной путь логин → дашборд → выход не выделен как P0/P1 в этом change)_

## Manual checks

- [ ] Визуально подтвердить, что сайдбар занимает 1/5 ширины экрана, а контент — оставшиеся 4/5, на странице `/dashboard` в браузере на десктопной ширине
- [ ] Визуально подтвердить тёмно-синий фон и белый текст сайдбара в светлой и тёмной системной теме
- [ ] Визуально подтвердить на реальном мобильном устройстве/эмуляторе, что открытый по бургеру сайдбар занимает всю ширину экрана и не обрезается

## Test data

- Fixtures: не требуются (нет доменных сущностей)
- API mocks: мутация `useLogout` мокается на уровне модуля (`vi.mock`) по паттерну, уже используемому в `login-form.component.test.tsx`
- User roles: единственная роль — авторизованный пользователь приватного контура (сессия проверяется в `layout.tsx`, не в `SidebarNav`)
- Seed data: не требуется

## Out of scope

- Contract tests
- Visual regression tests
- Accessibility tests
- Mutation tests
- Feature flag combination matrices

## Verification commands

- [ ] openspec validate add-private-sidebar-nav --strict --no-interactive
- [ ] frontend: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`
- [ ] api: `npm run lint` (контракт не менялся, `npm run bundle` не требуется)
- [ ] E2E smoke / manual exploratory — ручная проверка раскладки и цветов (см. Manual checks)
