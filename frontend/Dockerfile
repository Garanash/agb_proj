# Фронтенд - Next.js
FROM node:20.11.1-alpine

WORKDIR /app

# Устанавливаем системные зависимости
RUN apk add --no-cache libc6-compat

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости с флагом legacy-peer-deps
RUN npm install --no-fund --no-audit --legacy-peer-deps

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