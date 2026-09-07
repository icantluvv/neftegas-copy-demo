## API

_(нет задач)_

## Backend

_(нет задач)_

## Frontend

- [x] 1.1 [frontend] Добавить компонент `AuthWaveBackground` (декоративный
      SVG-фон: диагональные плоскости + волнистые линии) и keyframes
      `wave-drift` в `app/globals.css`.
- [x] 1.2 [frontend] Подключить фон и заголовок с названием приложения на
      экране входа (`app/(public)/page.tsx`), не затрагивая приватную часть
      приложения.
- [x] 1.3 [frontend] Добавить непрозрачный фон карточки формы входа
      (`login-form.tsx`), чтобы форма не сливалась с фоном.

## Проверка

- [x] `bun run typecheck` (apps/frontend)
- [x] `bunx eslint` на изменённые файлы (apps/frontend)
- [x] `login-form.component.test.tsx` — регресса нет (9/9)
- [x] Скриншот экрана входа в контейнере (headless Chromium) — визуально
      сверен с референсом (chmng.ru)
