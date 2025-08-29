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

# Создаем скрипт для запуска с миграциями и созданием админа
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'echo "Waiting for database..."' >> /app/start.sh && \
    echo 'while ! pg_isready -h postgres -U felix_user -d agb_felix; do' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "Database is ready!"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Applying migrations..."' >> /app/start.sh && \
    echo 'python create_tables.py' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Creating admin user..."' >> /app/start.sh && \
    echo 'python init_db.py' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload' >> /app/start.sh && \
    chmod +x /app/start.sh

# Открываем порт
EXPOSE 8000

# Запускаем приложение через скрипт
CMD ["/bin/bash", "/app/start.sh"]
