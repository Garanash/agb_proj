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
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf-xlib-2.0-dev \
    libffi-dev \
    shared-mime-info \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Создаем и активируем виртуальное окружение
ENV VIRTUAL_ENV=/app/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Обновляем pip в виртуальном окружении
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 8000

# Делаем start.sh исполняемым
RUN chmod +x start.sh

# Запускаем приложение через скрипт инициализации
CMD ["./start.sh"]