FROM node:24-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
# NODE_ENV не выставлен здесь: npm ci должен ставить devDependencies тоже —
# node_modules уже включают devDependencies — нужно для `npm run seed`
# (ts-node) внутри контейнера. Для внутреннего инструмента с редкими деплоями
# это проще, чем гонять отдельный seed-образ; при желании можно вынести в
# multi-stage позже.
RUN npm ci
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
EXPOSE 4000
CMD ["node", "dist/main.js"]
