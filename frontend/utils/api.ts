/**
 * Утилиты для работы с API
 */

// Базовый URL API
export const getApiUrl = (): string => {
  // На клиенте - в Docker контейнере backend доступен по имени сервиса
  if (typeof window !== 'undefined') {
    // Проверяем, работаем ли мы в Docker контейнере
    const isDocker = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('agb') ||
                     process.env.NODE_ENV === 'production';

    if (isDocker) {
      // В Docker используем имя сервиса backend
      return 'http://backend:8000';
    } else {
      // На внешнем сервере используем текущий origin
      return window.location.origin;
    }
  }

  // На сервере используем переменную окружения или Docker сервис
  return process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
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
