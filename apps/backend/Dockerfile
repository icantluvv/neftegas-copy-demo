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
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
# node_modules уже включают devDependencies — нужно для `npm run seed` (ts-node)
# внутри контейнера. Для внутреннего инструмента с редкими деплоями это проще,
# чем гонять отдельный seed-образ; при желании можно вынести в multi-stage позже.
EXPOSE 4000
CMD ["node", "dist/main.js"]
