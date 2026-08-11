FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
# Пока next.config.ts не переключён на output: 'standalone', образ носит с собой
# полный node_modules — проще для старта, но крупнее. Хорошая точка для
# оптимизации, когда фронт стабилизируется.
EXPOSE 3000
CMD ["npm", "run", "start"]
