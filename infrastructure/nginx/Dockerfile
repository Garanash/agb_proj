# Nginx
FROM nginx:alpine

# Устанавливаем дополнительные инструменты для health check
RUN apk add --no-cache wget

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем директорию для SSL сертификатов
RUN mkdir -p /etc/nginx/ssl

# Открываем порты
EXPOSE 80 443

# Проверяем конфигурацию nginx при запуске
CMD ["nginx", "-g", "daemon off;"]
