# AGB Project Makefile
# Управление проектом через Make

.PHONY: help build up down restart logs status clean test deploy

# Переменные
COMPOSE_FILE ?= docker-compose.yml
ENVIRONMENT ?= prod

# Цвета для вывода
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Показать справку
	@echo "$(GREEN)AGB Project Management$(NC)"
	@echo "========================"
	@echo ""
	@echo "$(YELLOW)Основные команды:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Примеры использования:$(NC)"
	@echo "  make build          # Сборка образов"
	@echo "  make up             # Запуск сервисов"
	@echo "  make down           # Остановка сервисов"
	@echo "  make logs           # Просмотр логов"
	@echo "  make test           # Запуск тестов"
	@echo "  make deploy         # Полный деплой"

build: ## Сборка Docker образов
	@echo "$(YELLOW)🔨 Сборка образов...$(NC)"
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "$(GREEN)✅ Образы собраны$(NC)"

up: ## Запуск сервисов
	@echo "$(YELLOW)🚀 Запуск сервисов...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ Сервисы запущены$(NC)"

down: ## Остановка сервисов
	@echo "$(YELLOW)🛑 Остановка сервисов...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✅ Сервисы остановлены$(NC)"

restart: ## Перезапуск сервисов
	@echo "$(YELLOW)🔄 Перезапуск сервисов...$(NC)"
	docker-compose -f $(COMPOSE_FILE) restart
	@echo "$(GREEN)✅ Сервисы перезапущены$(NC)"

logs: ## Просмотр логов
	@echo "$(YELLOW)📝 Просмотр логов...$(NC)"
	docker-compose -f $(COMPOSE_FILE) logs -f

status: ## Статус сервисов
	@echo "$(YELLOW)📊 Статус сервисов:$(NC)"
	docker-compose -f $(COMPOSE_FILE) ps

clean: ## Очистка неиспользуемых ресурсов
	@echo "$(YELLOW)🧹 Очистка ресурсов...$(NC)"
	docker system prune -f
	docker volume prune -f
	@echo "$(GREEN)✅ Очистка завершена$(NC)"

test: ## Запуск тестов
	@echo "$(YELLOW)🧪 Запуск тестов...$(NC)"
	python tests/test_deployment.py

deploy: build up ## Полный деплой (сборка + запуск)
	@echo "$(GREEN)🎉 Деплой завершен!$(NC)"
	@echo "$(YELLOW)🌐 Приложение доступно по адресу: http://localhost$(NC)"

# Команды для разработки
dev-up: ## Запуск в режиме разработки
	@echo "$(YELLOW)🔧 Запуск в режиме разработки...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Сервисы разработки запущены$(NC)"

dev-down: ## Остановка сервисов разработки
	@echo "$(YELLOW)🛑 Остановка сервисов разработки...$(NC)"
	docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)✅ Сервисы разработки остановлены$(NC)"

# Команды для базы данных
db-backup: ## Резервное копирование базы данных
	@echo "$(YELLOW)💾 Резервное копирование БД...$(NC)"
	docker-compose exec postgres pg_dump -U felix_prod_user agb_felix_prod > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Резервная копия создана$(NC)"

db-restore: ## Восстановление базы данных (использование: make db-restore FILE=backup.sql)
	@echo "$(YELLOW)🔄 Восстановление БД из файла $(FILE)...$(NC)"
	docker-compose exec -T postgres psql -U felix_prod_user agb_felix_prod < $(FILE)
	@echo "$(GREEN)✅ База данных восстановлена$(NC)"

# Команды для мониторинга
monitor: ## Мониторинг ресурсов
	@echo "$(YELLOW)📊 Мониторинг ресурсов:$(NC)"
	docker stats --no-stream

health: ## Проверка здоровья сервисов
	@echo "$(YELLOW)🏥 Проверка здоровья сервисов:$(NC)"
	@curl -s http://localhost/health && echo " - Nginx: OK" || echo " - Nginx: FAILED"
	@curl -s http://localhost/api/health && echo " - Backend: OK" || echo " - Backend: FAILED"
	@curl -s http://localhost/ && echo " - Frontend: OK" || echo " - Frontend: FAILED"

# Команды для обновления
update: ## Обновление проекта
	@echo "$(YELLOW)🔄 Обновление проекта...$(NC)"
	git pull
	make down
	make build
	make up
	@echo "$(GREEN)✅ Проект обновлен$(NC)"

# Команды для SSL
ssl-setup: ## Настройка SSL сертификатов
	@echo "$(YELLOW)🔒 Настройка SSL...$(NC)"
	@echo "Поместите SSL сертификаты в infrastructure/ssl/:"
	@echo "  - cert.pem (сертификат)"
	@echo "  - key.pem (приватный ключ)"
	@echo "Затем раскомментируйте HTTPS конфигурацию в nginx.prod.conf"

# Команды для n8n
n8n-up: ## Запуск n8n
	@echo "$(YELLOW)🤖 Запуск n8n...$(NC)"
	docker-compose -f $(COMPOSE_FILE) --profile automation up -d n8n
	@echo "$(GREEN)✅ n8n запущен$(NC)"

n8n-down: ## Остановка n8n
	@echo "$(YELLOW)🛑 Остановка n8n...$(NC)"
	docker-compose -f $(COMPOSE_FILE) --profile automation down n8n
	@echo "$(GREEN)✅ n8n остановлен$(NC)"

# Команды для логов
logs-backend: ## Логи бекенда
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## Логи фронтенда
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-nginx: ## Логи nginx
	docker-compose -f $(COMPOSE_FILE) logs -f nginx

logs-db: ## Логи базы данных
	docker-compose -f $(COMPOSE_FILE) logs -f postgres