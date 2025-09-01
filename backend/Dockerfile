# Бекенд - FastAPI
FROM python:3.11-slim AS backend

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    wget \
    procps \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 8000

# Запускаем приложение с оптимизированными настройками
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--workers", "2", "--loop", "uvloop", "--http", "httptools", "--access-log", "--log-level", "info"]
