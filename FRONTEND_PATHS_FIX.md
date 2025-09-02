# 🔧 Исправление проблем с путями в Next.js

## Проблема: "Module not found: Can't resolve '@/utils/api'"

Эта ошибка возникает когда Next.js не может найти файлы по путям с алиасом `@/` в Docker контейнере.

## 🚀 Быстрое решение

### На сервере выполните:
```bash
# Запустите специальный скрипт
./fix-frontend-paths.sh
```

## 🔧 Что исправлено

### 1. TypeScript конфигурация
```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node", // Изменено с "bundler" на "node"
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 2. Next.js конфигурация
```javascript
// frontend/next.config.js
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}
```

### 3. Исправленный Dockerfile
```dockerfile
# frontend/Dockerfile.prod.fixed
FROM node:18-alpine AS base
# ... оптимизированная сборка с правильными путями
```

## 📋 Что делает скрипт `fix-frontend-paths.sh`:

1. ✅ Останавливает все контейнеры
2. ✅ Очищает Docker кэш
3. ✅ Создает `production.env` если его нет
4. ✅ Проверяет конфигурацию Next.js
5. ✅ Запускает с исправленным Dockerfile
6. ✅ Проверяет статус и логи
7. ✅ Проверяет доступность фронтенда

## 🔍 Диагностика проблем

### Проверьте конфигурацию:
```bash
# Проверьте tsconfig.json
cat frontend/tsconfig.json | grep -A 5 "paths"

# Проверьте next.config.js
cat frontend/next.config.js | grep -A 10 "webpack"
```

### Проверьте логи сборки:
```bash
# Логи фронтенда
docker-compose -f docker-compose.prod.yml logs frontend

# Логи сборки
docker-compose -f docker-compose.prod.yml build frontend
```

### Подключитесь к контейнеру:
```bash
# Подключение к контейнеру фронтенда
docker exec -it agb_frontend_prod /bin/sh

# Проверьте файлы внутри контейнера
ls -la /app
ls -la /app/utils
ls -la /app/components
```

## 🚨 Частые проблемы

| Проблема | Решение |
|----------|---------|
| `Module not found: Can't resolve '@/utils/api'` | Запустите `./fix-frontend-paths.sh` |
| `Module not found: Can't resolve '@/components/PageLayout'` | Проверьте `tsconfig.json` |
| `Build failed because of webpack errors` | Очистите кэш: `docker system prune -af` |
| `outputFileTracingRoot` ошибка | Исправлено в `next.config.js` |

## 🔧 Ручное исправление

### Если скрипт не помог:

1. **Проверьте файлы:**
```bash
# Убедитесь что файлы существуют
ls -la frontend/utils/api.ts
ls -la frontend/components/PageLayout.tsx
```

2. **Исправьте tsconfig.json:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

3. **Пересоберите контейнер:**
```bash
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

## 📞 Поддержка

- 🔧 Диагностика: `./debug-docker.sh`
- 🐳 Подключение к контейнерам: [DOCKER_CONNECT.md](DOCKER_CONNECT.md)
- 🚀 Полное исправление: `./fix-server-complete.sh`
