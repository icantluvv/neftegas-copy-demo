# Локальный разворот

Документ описывает запуск Дэшборда Нефтегаз локально через Docker Compose.
Compose-файл находится в `infra/docker-compose.yml`; дев-оверлей с hot-reload —
`infra/docker-compose.dev.yml`. Отдельного Makefile в проекте нет, команды
запускаются напрямую через `docker compose`.

## Стек

| Сервис   | Технология                              | Порт   |
| -------- | ---------------------------------------- | ------ |
| Frontend | Next.js 16, React 19, Bun 1.3            | `3000` |
| Backend  | Node.js, NestJS 11, TypeORM              | `4000` |
| БД       | PostgreSQL 17                            | `5432` |

Внешних инфраструктурных зависимостей (S3, очередей, почтового сервера,
feature-flag сервиса) в проекте нет — файлы хранятся на локальном volume
(`backend_uploads`), а браузер ходит на бэкенд через same-origin rewrite
`/api/*` (см. комментарии в `infra/docker-compose.yml`), чтобы httpOnly-cookie
авторизации работали без настройки CORS.

## Требования

- Docker с поддержкой `docker compose`
- (опционально, для запуска фронта/бэка вне контейнеров) Node.js 24, Bun 1.3

## Шаги

1. Скопировать переменные окружения бэкенда:

   ```sh
   cp apps/backend/.env.example apps/backend/.env
   ```

   Дефолтные значения (`.env.example`) уже рабочие для локального запуска —
   секретов из внешних хранилищ (Bitwarden и т.п.) не требуется. При желании
   можно поменять `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`.

   Для фронтенда `apps/frontend/.env` и `apps/frontend/.env.local` уже
   существуют локально с рабочими дефолтами (`NEXT_PUBLIC_MOCK_MODE=true` и
   т.д.) — эти файлы в `.gitignore`, отдельного `.env.example` для фронта пока
   нет. При первом клонировании репозитория создать их по образцу значений из
   `infra/docker-compose.yml` (`NEXT_PUBLIC_*`, `BACK_INTERNAL_URL`).

2. Собрать и запустить контейнеры:

   ```sh
   docker compose -f infra/docker-compose.yml up --build -d
   ```

   Для разработки с hot-reload (монтирование исходников с хоста, `npm run
   start:dev` / `bun run dev` внутри контейнера) добавить дев-оверлей:

   ```sh
   docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up --build -d
   ```

3. Наполнить БД демо-данными (справочники филиалов/ЦФО и по одному
   пользователю на каждую роль):

   ```sh
   docker compose -f infra/docker-compose.yml exec backend npm run seed
   ```

   Сид идемпотентен — если в базе уже есть пользователи, он ничего не
   перезапишет. Схема БД создаётся через TypeORM `synchronize` (миграций пока
   нет — `synchronize: true` вне `production`), поэтому отдельного шага
   применения миграций не требуется.

4. Проверить, что контейнеры запущены:

   ```sh
   docker compose -f infra/docker-compose.yml ps
   ```

## Адреса сервисов

- Frontend: http://localhost:3000
- Backend (Swagger/REST): http://localhost:4000
- PostgreSQL: `localhost:5432` (`gas_dashboard` / `gas_dashboard`)

## Демо-аккаунты

После `npm run seed` доступны логины (пароль один для всех — `Password123`):

| Роль    | Email                  |
| ------- | ----------------------- |
| Филиал  | `filial@demo.local`     |
| ЦФО     | `cfo@demo.local`        |
| ДТОиР   | `dtoe@demo.local`       |
| Админ   | `admin@demo.local`      |

## Установка git-хуков

Проект использует [Lefthook](https://lefthook.dev/) для управления git-хуками
(конфиг — `lefthook.yml` в корне). Хуки для фронтенда (lint, format,
typecheck, тесты, commitlint) устанавливаются вместе с зависимостями фронта:

```sh
cd apps/frontend
bun install
bun run lefthook install   # если хук не подхватился автоматически через prepare-скрипт
```

## Полезные команды

```sh
docker compose -f infra/docker-compose.yml logs -f          # логи всех контейнеров
docker compose -f infra/docker-compose.yml exec backend sh  # shell в backend-контейнере
docker compose -f infra/docker-compose.yml exec frontend sh # shell в frontend-контейнере
docker compose -f infra/docker-compose.yml down             # остановить локальный стек
```

Backend и frontend также можно запускать без Docker, при поднятой одной
Postgres (например, из `infra/docker-compose.yml`, сервис `db`):

```sh
cd apps/backend && npm install && npm run start:dev
cd apps/frontend && bun install && bun run dev
```
