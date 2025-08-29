# Фронтенд - Next.js
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Устанавливаем переменную окружения
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запускаем приложение
CMD ["npm", "start"]
