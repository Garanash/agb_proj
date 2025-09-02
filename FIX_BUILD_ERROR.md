# Исправление ошибки сборки фронтенда

## Проблема
Ошибка: `Couldn't find any 'pages' or 'app' directory`

## Причина
В Dockerfile для фронтенда не копировались файлы приложения перед сборкой.

## Решение

### 1. Обновите код на сервере
```bash
cd /root/agb_proj
git pull
```

### 2. Запустите исправленный скрипт
```bash
./server-fix-local.sh
```

## Что было исправлено

1. **Dockerfile.prod.minimal** - добавлено копирование файлов приложения перед сборкой
2. **server-fix-local.sh** - добавлена проверка наличия production.env

## Альтернативное решение (если git pull не работает)

### 1. Исправьте Dockerfile вручную
```bash
cd /root/agb_proj/frontend
nano Dockerfile.prod.minimal
```

Найдите строки:
```dockerfile
# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости и собираем в одной команде
RUN npm ci --only=production --frozen-lockfile && \
    npm run build && \
    npm prune --production
```

Замените на:
```dockerfile
# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm ci --only=production --frozen-lockfile

# Копируем файлы приложения
COPY . .

# Собираем приложение
RUN npm run build && \
    npm prune --production
```

### 2. Запустите сборку
```bash
cd /root/agb_proj
docker-compose -f docker-compose.prod.yml up -d --build
```

## Проверка результата
```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи фронтенда
docker-compose -f docker-compose.prod.yml logs frontend

# Доступность
curl http://localhost:3000
```
