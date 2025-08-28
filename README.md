# Felix Platform - Корпоративная платформа

## 🚀 Быстрый запуск

### 1. Клонировать проект
```bash
git clone https://github.com/Garanash/agb_proj.git
cd agb_proj
```

### 2. Запустить все одной командой
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Готово! 
Приложение доступно по адресу: **http://localhost**

## 📋 Что запускается

- **Frontend** - Next.js приложение
- **Backend** - FastAPI API
- **Database** - PostgreSQL
- **Nginx** - Reverse proxy

## 🔑 Данные для входа

- **Логин:** `admin`
- **Пароль:** `neurofork1`

## 🛠️ Полезные команды

```bash
# Посмотреть логи
docker-compose -f docker-compose.prod.yml logs

# Остановить все
docker-compose -f docker-compose.prod.yml down

# Перезапустить
docker-compose -f docker-compose.prod.yml restart
```

## ⚠️ Требования

- Docker
- Docker Compose
- Git

## 🆘 Если что-то не работает

1. Убедитесь что порт 80 свободен
2. Перезапустите: `./deploy.sh`
3. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs nginx`
