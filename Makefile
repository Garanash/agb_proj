# ===========================================
# AGB Project - Makefile
# ===========================================

.PHONY: help dev prod test stop restart status logs cleanup health install build frontend backend

# Цвета для вывода
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m # No Color

# Помощь
help: ## Показать справку
	@echo "$(GREEN)🚀 AGB Project - Система управления$(NC)"
	@echo ""
	@echo "$(YELLOW)Доступные команды:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Развертывание
dev: ## Развертывание для разработки
	@echo "$(GREEN)🚀 Запуск разработки...$(NC)"
	@./deploy.sh dev

prod: ## Production развертывание
	@echo "$(GREEN)🏭 Запуск production...$(NC)"
	@./deploy.sh prod

test: ## Тестовое развертывание
	@echo "$(GREEN)🧪 Запуск тестов...$(NC)"
	@./deploy.sh test

# Управление
stop: ## Остановка всех сервисов
	@echo "$(YELLOW)⏹️ Остановка сервисов...$(NC)"
	@./deploy.sh stop

restart: ## Перезапуск сервисов
	@echo "$(YELLOW)🔄 Перезапуск сервисов...$(NC)"
	@./deploy.sh restart

status: ## Показать статус сервисов
	@echo "$(BLUE)📊 Статус сервисов:$(NC)"
	@./deploy.sh status

logs: ## Показать логи (использование: make logs service=frontend)
	@echo "$(BLUE)📋 Логи сервисов:$(NC)"
	@./deploy.sh logs $(service)

# Обслуживание
cleanup: ## Очистка Docker ресурсов
	@echo "$(RED)🧹 Очистка Docker ресурсов...$(NC)"
	@./deploy.sh cleanup

health: ## Проверка здоровья системы
	@echo "$(GREEN)🏥 Проверка здоровья системы...$(NC)"
	@./deploy.sh health

# Установка зависимостей
install: ## Установка зависимостей
	@echo "$(GREEN)📦 Установка зависимостей...$(NC)"
	@cd frontend && npm install
	@cd backend && pip install -r requirements.txt

# Сборка
build: ## Сборка всех компонентов
	@echo "$(GREEN)🔨 Сборка проекта...$(NC)"
	@$(MAKE) build-frontend
	@$(MAKE) build-backend

build-frontend: ## Сборка фронтенда
	@echo "$(GREEN)🔨 Сборка фронтенда...$(NC)"
	@cd frontend && npm run build

build-backend: ## Сборка бэкенда
	@echo "$(GREEN)🔨 Сборка бэкенда...$(NC)"
	@cd backend && python -m pip install -r requirements.txt

# Разработка
frontend: ## Запуск фронтенда в режиме разработки
	@echo "$(GREEN)🎨 Запуск фронтенда...$(NC)"
	@cd frontend && npm run dev

backend: ## Запуск бэкенда в режиме разработки
	@echo "$(GREEN)🔧 Запуск бэкенда...$(NC)"
	@cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Тестирование
test-frontend: ## Тестирование фронтенда
	@echo "$(GREEN)🧪 Тестирование фронтенда...$(NC)"
	@cd frontend && npm test

test-backend: ## Тестирование бэкенда
	@echo "$(GREEN)🧪 Тестирование бэкенда...$(NC)"
	@cd backend && python -m pytest

# Линтинг
lint: ## Проверка кода линтерами
	@echo "$(GREEN)🔍 Проверка кода...$(NC)"
	@cd frontend && npm run lint
	@cd backend && python -m flake8 .

# Форматирование
format: ## Форматирование кода
	@echo "$(GREEN)✨ Форматирование кода...$(NC)"
	@cd frontend && npm run format
	@cd backend && python -m black .

# Очистка
clean: ## Очистка всех артефактов сборки
	@echo "$(RED)🧹 Очистка артефактов...$(NC)"
	@cd frontend && rm -rf .next node_modules/.cache
	@cd backend && find . -type d -name __pycache__ -exec rm -rf {} +
	@docker system prune -f

# Резервное копирование
backup: ## Создание резервной копии
	@echo "$(GREEN)💾 Создание резервной копии...$(NC)"
	@mkdir -p backups
	@docker exec agb_postgres_prod pg_dump -U felix_prod_user agb_felix_prod > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Резервная копия создана в папке backups/$(NC)"

# Восстановление
restore: ## Восстановление из резервной копии (использование: make restore file=backup.sql)
	@echo "$(GREEN)🔄 Восстановление из резервной копии...$(NC)"
	@if [ -z "$(file)" ]; then echo "$(RED)❌ Укажите файл: make restore file=backup.sql$(NC)"; exit 1; fi
	@docker exec -i agb_postgres_prod psql -U felix_prod_user agb_felix_prod < backups/$(file)
	@echo "$(GREEN)✅ Восстановление завершено$(NC)"

# Мониторинг
monitor: ## Мониторинг ресурсов
	@echo "$(GREEN)📊 Мониторинг ресурсов...$(NC)"
	@docker stats

# Обновление
update: ## Обновление зависимостей
	@echo "$(GREEN)🔄 Обновление зависимостей...$(NC)"
	@cd frontend && npm update
	@cd backend && pip install --upgrade -r requirements.txt

# Проверка безопасности
security: ## Проверка безопасности
	@echo "$(GREEN)🔒 Проверка безопасности...$(NC)"
	@cd frontend && npm audit
	@cd backend && pip install safety && safety check

# Документация
docs: ## Генерация документации
	@echo "$(GREEN)📚 Генерация документации...$(NC)"
	@cd backend && python -m pydoc -w main
	@cd frontend && npm run docs

# Полная перезагрузка
reset: ## Полная перезагрузка системы
	@echo "$(RED)🔄 Полная перезагрузка системы...$(NC)"
	@$(MAKE) stop
	@$(MAKE) cleanup
	@$(MAKE) dev

# Проверка готовности
ready: ## Проверка готовности к работе
	@echo "$(GREEN)✅ Проверка готовности...$(NC)"
	@$(MAKE) health
	@$(MAKE) status
	@echo "$(GREEN)🎉 Система готова к работе!$(NC)"

# По умолчанию показываем помощь
.DEFAULT_GOAL := help
