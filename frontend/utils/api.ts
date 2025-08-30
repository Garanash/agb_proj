/**
 * Утилиты для работы с API
 */

// Базовый URL API
export const getApiUrl = (): string => {
  // На клиенте
  if (typeof window !== 'undefined') {
    // В локальной среде (localhost) - используем текущий origin (через Nginx)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost';
    }

    // В Docker или на сервере используем backend как имя сервиса
    if (window.location.hostname.includes('agb') || process.env.NODE_ENV === 'production') {
      return 'http://backend:8000';
    }

    // На внешнем сервере используем текущий origin
    return window.location.origin;
  }

  // На сервере используем переменную окружения или localhost для разработки
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

// URL для WebSocket
export const getWsUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/^http/, 'ws');
};

// Полный URL для API эндпоинта
export const getApiEndpoint = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  // Убираем начальный слэш из endpoint если он есть
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api${cleanEndpoint}`;
};

// Полный URL для WebSocket
export const getWsEndpoint = (endpoint: string): string => {
  const baseUrl = getWsUrl();
  // Убираем начальный слэш из endpoint если он есть
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api${cleanEndpoint}`;
};

// Примеры использования:
// getApiEndpoint('users/list') -> http://localhost/api/users/list
// getApiEndpoint('/users/list') -> http://localhost/api/users/list
// getWsEndpoint('chat/ws/123') -> ws://localhost/api/chat/ws/123
