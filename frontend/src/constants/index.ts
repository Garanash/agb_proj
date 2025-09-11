/**
 * Константы приложения
 */

// API константы
export const API_CONFIG = {
  DEFAULT_VERSION: 'v1',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const

// Роли пользователей
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  VED_PASSPORT: 'ved_passport',
  CUSTOMER: 'customer',
  CONTRACTOR: 'contractor',
  SERVICE_ENGINEER: 'service_engineer',
} as const

// Статусы заявок
export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

// Приоритеты заявок
export const REQUEST_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

// Статусы ВЭД паспортов
export const PASSPORT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const

// UI константы
export const UI_CONFIG = {
  MODAL_SIZES: {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl',
    '2XL': '2xl',
    '3XL': '3xl',
    '4XL': '4xl',
    '5XL': '5xl',
    '6XL': '6xl',
    '7XL': '7xl',
  },
  BUTTON_VARIANTS: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    DANGER: 'danger',
    SUCCESS: 'success',
    WARNING: 'warning',
  },
  BUTTON_SIZES: {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
  },
} as const

// Локальное хранилище ключи
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

// Маршруты
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DASHBOARD_CUSTOMER: '/dashboard/customer',
  DASHBOARD_CONTRACTOR: '/dashboard/contractor',
  DASHBOARD_SERVICE_ENGINEER: '/dashboard/service-engineer',
  NEWS: '/news',
  CHAT: '/chat',
  USERS: '/users',
  VED_PASSPORTS: '/ved-passports',
  VED_PASSPORTS_CREATE: '/ved-passports/create',
  VED_PASSPORTS_ARCHIVE: '/ved-passports/archive',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  ABOUT: '/about',
  ADMIN: '/admin',
  ADMIN_BOTS: '/admin/bots',
  PROJECTS: '/projects',
} as const

// Размеры модальных окон
export const MODAL_MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
} as const

// Цветовые схемы для ролей
export const ROLE_COLORS = {
  [USER_ROLES.ADMIN]: 'purple',
  [USER_ROLES.MANAGER]: 'blue',
  [USER_ROLES.EMPLOYEE]: 'gray',
  [USER_ROLES.VED_PASSPORT]: 'indigo',
  [USER_ROLES.CUSTOMER]: 'blue',
  [USER_ROLES.CONTRACTOR]: 'green',
  [USER_ROLES.SERVICE_ENGINEER]: 'purple',
} as const

// Иконки для ролей
export const ROLE_ICONS = {
  [USER_ROLES.ADMIN]: '👑',
  [USER_ROLES.MANAGER]: '👔',
  [USER_ROLES.EMPLOYEE]: '👤',
  [USER_ROLES.VED_PASSPORT]: '📋',
  [USER_ROLES.CUSTOMER]: '🏢',
  [USER_ROLES.CONTRACTOR]: '👷',
  [USER_ROLES.SERVICE_ENGINEER]: '🔧',
} as const

// Валидация
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
  },
} as const

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Это поле обязательно для заполнения',
  INVALID_EMAIL: 'Введите корректный email адрес',
  INVALID_PHONE: 'Введите корректный номер телефона',
  PASSWORD_TOO_SHORT: `Пароль должен содержать минимум ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} символов`,
  USERNAME_INVALID: 'Имя пользователя может содержать только буквы, цифры и подчеркивания',
  PASSWORDS_DO_NOT_MATCH: 'Пароли не совпадают',
  LOGIN_FAILED: 'Неверное имя пользователя или пароль',
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету',
  UNAUTHORIZED: 'Необходимо войти в систему',
  FORBIDDEN: 'У вас нет прав для выполнения этого действия',
  NOT_FOUND: 'Запрашиваемый ресурс не найден',
  SERVER_ERROR: 'Внутренняя ошибка сервера',
} as const

// Успешные сообщения
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Успешный вход в систему',
  LOGOUT_SUCCESS: 'Вы вышли из системы',
  REGISTRATION_SUCCESS: 'Регистрация прошла успешно',
  PROFILE_UPDATED: 'Профиль обновлен',
  DATA_SAVED: 'Данные сохранены',
  REQUEST_CREATED: 'Заявка создана',
  REQUEST_UPDATED: 'Заявка обновлена',
  REQUEST_DELETED: 'Заявка удалена',
} as const
