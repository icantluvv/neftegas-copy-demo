FROM oven/bun:1-alpine AS dev
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
EXPOSE 4000
# node_modules живёт в именованном volume (см. docker-compose.dev.yml) и
# переживает ребилд образа, поэтому `bun install` из шага выше на уже созданном
# volume не выполняется повторно. `bun install` при каждом старте
# синхронизирует volume с bun.lock (быстро, если ничего не менялось)
# — без этого добавление зависимости в package.json приводит к
# "Cannot find module" в watch-режиме до ручного docker exec bun install.
# `bun run seed` идемпотентен (пропускает себя, если в БД уже есть
# пользователи) — на каждом старте dev-контейнера безопасно гонять его
# заново, чтобы не создавать демо-объекты вручную.
CMD ["sh", "-c", "bun install && bun run seed && bun run start:dev"]

FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
COPY package.json bun.lock ./
# NODE_ENV не выставлен здесь: bun install должен ставить devDependencies тоже —
# node_modules уже включают devDependencies и типы, нужные bun при выполнении
# `bun run seed` (bun запускает src/database/seed.ts напрямую, без сборки).
# Для внутреннего инструмента с редкими деплоями это проще, чем гонять
# отдельный seed-образ; при желании можно вынести в multi-stage позже.
RUN bun install --frozen-lockfile
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
EXPOSE 4000
CMD ["bun", "dist/main.js"]
