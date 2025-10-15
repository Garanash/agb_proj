/**
 * ESLint правила для проверки структуры проекта
 */

module.exports = {
  rules: {
    // Запрещаем импорты из старой структуры
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/components/*'],
            message: 'Используйте barrel exports из @/components вместо прямых импортов',
          },
          {
            group: ['@/components/AuthContext'],
            message: 'Используйте @/contexts для AuthContext',
          },
          {
            group: ['@/components/useAuth'],
            message: 'Используйте @/hooks для useAuth',
          },
        ],
      },
    ],
    
    // Требуем использование barrel exports
    'import/no-relative-parent-imports': 'error',
    
    // Требуем использование алиасов путей
    'import/no-relative-packages': 'error',
  },
  
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      rules: {
        // В src директории требуем использование алиасов
        'import/no-relative-parent-imports': 'error',
      },
    },
    {
      files: ['app/**/*.{ts,tsx}'],
      rules: {
        // В app директории разрешаем относительные импорты для Next.js
        'import/no-relative-parent-imports': 'off',
      },
    },
  ],
};
