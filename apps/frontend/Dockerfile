FROM oven/bun:1.3 AS dev
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/api/package.json ./packages/api/package.json
RUN bun install --frozen-lockfile
EXPOSE 3000
CMD ["bun", "run", "dev"]

FROM oven/bun:1.3 AS build
WORKDIR /app
# `bun run build` (next build) сегфолтит на bun 1.3.14 при сборе page data —
# https://github.com/oven-sh/bun/issues (баг движка bun, не приложения).
# Устанавливаем настоящий Node.js и запускаем next build через него; bun
# остаётся только для install.
RUN apt-get update && apt-get install -y --no-install-recommends nodejs npm \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
COPY packages/api/package.json ./packages/api/package.json
RUN bun install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* встраиваются в клиентский бандл на этапе сборки, поэтому нужны
# здесь как build-time ARG/ENV, а не только как runtime-переменные контейнера.
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_FRONT_URL
ARG NEXT_PUBLIC_BFF_PATH
ARG NEXT_PUBLIC_BACK_URL
ARG NEXT_PUBLIC_S3_URL
ARG NEXT_PUBLIC_MOCK_MODE
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME} \
	NEXT_PUBLIC_FRONT_URL=${NEXT_PUBLIC_FRONT_URL} \
	NEXT_PUBLIC_BFF_PATH=${NEXT_PUBLIC_BFF_PATH} \
	NEXT_PUBLIC_BACK_URL=${NEXT_PUBLIC_BACK_URL} \
	NEXT_PUBLIC_S3_URL=${NEXT_PUBLIC_S3_URL} \
	NEXT_PUBLIC_MOCK_MODE=${NEXT_PUBLIC_MOCK_MODE}
# Серверные переменные валидируются схемой src/env/server.ts уже на этапе
# "collect page data" в next build, до старта контейнера — реальные значения
# приходят в рантайме через docker-compose environment, здесь достаточно
# синтаксически валидных плейсхолдеров.
ENV BACK_INTERNAL_URL=http://backend:4000/api \
	SENTRY_ORG=local \
	SENTRY_URL=http://localhost:9001 \
	SENTRY_AUTH_TOKEN=local \
	DADATA_URL=http://localhost:9002 \
	DADATA_TOKEN=local \
	PARTNER_API_TOKEN=local
RUN node node_modules/.bin/next build

FROM oven/bun:1.3 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
COPY packages/api/package.json ./packages/api/package.json
RUN bun install --frozen-lockfile --production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
# Пока next.config.ts не переключён на output: 'standalone', образ носит с собой
# полный node_modules — проще для старта, но крупнее. Хорошая точка для
# оптимизации, когда фронт стабилизируется.
EXPOSE 3000
CMD ["bun", "run", "start"]
