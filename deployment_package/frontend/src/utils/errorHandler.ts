/**
 * Утилита для обработки ошибок API
 * Преобразует объекты ошибок Pydantic в читаемые строки
 */
export function formatApiError(error: any, defaultMessage: string = 'Произошла ошибка'): string {
  if (!error?.response?.data?.detail) {
    return defaultMessage
  }

  const detail = error.response.data.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    // Если это массив ошибок валидации Pydantic
    return detail.map((err: any) => err.msg || 'Ошибка валидации').join(', ')
  }

  if (typeof detail === 'object') {
    // Если это объект ошибки
    return detail.msg || 'Ошибка валидации'
  }

  return defaultMessage
}
