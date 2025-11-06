/**
 * Утилиты для работы с API
 */

// Версия API по умолчанию
export const DEFAULT_API_VERSION = 'v1';

// Простая функция для получения API URL без сложной логики
export const getSimpleApiUrl = (): string => {
  // Сначала пытаемся получить URL из переменной окружения
  if (typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_API_URL) {
    return window.ENV.NEXT_PUBLIC_API_URL;
  }

  // Если переменная окружения не доступна, используем текущий origin
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;

    // Если мы на порту 80 или без порта, используем текущий origin (nginx проксирует)
    if (currentOrigin.includes(':80') || !currentOrigin.includes(':')) {
      return currentOrigin.replace(':80', '').replace(/\/$/, '');
    }

    // Если уже есть порт, используем текущий origin
    return currentOrigin.replace(/:\d+$/, '');
  }

  return 'http://localhost:8000';
};

// Базовый URL API (deprecated - используйте getSimpleApiUrl)
export const getApiUrl = (): string => {
  return getSimpleApiUrl();
};

// URL для WebSocket
export const getWsUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/^http/, 'ws');
};

// Полный URL для API эндпоинта с версионированием
export const getApiEndpoint = (endpoint: string, version: string = DEFAULT_API_VERSION): string => {
  const baseUrl = getApiUrl();
  // Убираем начальный слэш из endpoint если он есть
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Если endpoint уже содержит /api, не добавляем его повторно
  if (cleanEndpoint.startsWith('/api')) {
    return `${baseUrl}${cleanEndpoint}`;
  }
  
  // Если endpoint уже содержит версию, используем как есть
  if (cleanEndpoint.startsWith('/v')) {
    return `${baseUrl}/api${cleanEndpoint}`;
  }
  
  // Если baseUrl уже содержит /api, не добавляем его повторно
  if (baseUrl.includes('/api')) {
    return `${baseUrl}/${version}${cleanEndpoint}`;
  }
  
  return `${baseUrl}/api/${version}${cleanEndpoint}`;
};

// Полный URL для WebSocket
export const getWsEndpoint = (endpoint: string, version: string = DEFAULT_API_VERSION): string => {
  const baseUrl = getWsUrl();
  // Убираем начальный слэш из endpoint если он есть
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api/v1/${version}${cleanEndpoint}`;
};

// Утилиты для работы с версиями API
export const getApiVersionInfo = async (version: string = DEFAULT_API_VERSION) => {
  try {
    const response = await fetch(getApiEndpoint('/info', version));
    return await response.json();
  } catch (error) {
    console.error('Ошибка получения информации о версии API:', error);
    return null;
  }
};

export const getApiHealth = async (version: string = DEFAULT_API_VERSION) => {
  try {
    const response = await fetch(getApiEndpoint('/health', version));
    return await response.json();
  } catch (error) {
    console.error('Ошибка проверки здоровья API:', error);
    return null;
  }
};

// Функция formatApiError перенесена в errorHandler.ts для избежания дублирования

// Примеры использования:
// getApiEndpoint('users/list') -> http://localhost:8000/api/v1/users/list
// getApiEndpoint('users/list', 'v2') -> http://localhost:8000/api/v1/v2/users/list
// getApiEndpoint('/v1/users/list') -> http://localhost:8000/api/v1/users/list
// getWsEndpoint('chat/ws/123') -> ws://localhost:8000/api/v1/chat/ws/123