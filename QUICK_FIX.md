# ⚡ Быстрое исправление проблемы с местом на сервере

## 🚨 Проблема
```
no space left on device
```

## 🔧 Быстрое решение (5 команд)

```bash
# 1. Подключитесь к серверу
ssh root@37.252.20.46

# 2. Очистите Docker (ОБЯЗАТЕЛЬНО!)
docker system prune -a -f --volumes

# 3. Очистите системные кэши
apt-get clean && apt-get autoremove -y

# 4. Перейдите в проект
cd /root/agb_proj

# 5. Запустите развертывание
./deploy-root.sh
```

## ✅ Проверка результата

```bash
# Проверьте статус
docker-compose -f docker-compose.prod.yml ps

# Проверьте доступность
curl http://localhost:8000/api/health
curl http://localhost:3000
```

## 🚨 Если не помогло

```bash
# Экстренная очистка
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -a -f --volumes
rm -rf /tmp/* /var/tmp/*
./deploy-root.sh
```

---

**💡 После успешного развертывания настройте автоматическую очистку:**
```bash
echo "0 2 * * * docker system prune -f" | crontab -
```
