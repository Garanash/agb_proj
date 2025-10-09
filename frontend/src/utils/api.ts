/**
 * Утилиты для работы с API
 */

// Версия API по умолчанию
export const DEFAULT_API_VERSION = 'v1';

// Базовый URL API
export const getApiUrl = (): string => {
  // Если есть переменная окружения NEXT_PUBLIC_API_URL, используем её
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Для локальной разработки используем localhost:8000
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }

  // На клиенте в продакшене используем текущий origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // На сервере используем localhost для разработки
  return 'http://localhost:8000';
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
