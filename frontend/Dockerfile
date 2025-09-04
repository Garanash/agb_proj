# Фронтенд - Next.js
FROM node:20.11.1-alpine

WORKDIR /app

# Устанавливаем системные зависимости и обновляем npm до стабильной версии
RUN apk add --no-cache libc6-compat && \
    npm install -g npm@10.2.4 && \
    npm cache clean --force

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --no-fund --no-audit

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Запускаем приложение
CMD ["npm", "start"]