# Структура фронтенда

Этот документ описывает реорганизованную структуру фронтенда согласно лучшим практикам.

## 📁 Структура папок

```
src/
├── components/           # Все React компоненты
│   ├── ui/              # Базовые UI компоненты (переиспользуемые)
│   ├── layout/          # Компоненты макета (AppLayout, Sidebar, etc.)
│   ├── forms/           # Формы (регистрация, логин, etc.)
│   ├── modals/          # Модальные окна
│   └── features/        # Feature-specific компоненты
│       ├── auth/        # Аутентификация
│       ├── users/       # Управление пользователями
│       ├── news/        # Новости
│       ├── chat/        # Чат
│       ├── ved-passports/ # ВЭД паспорта
│       └── admin/       # Админ панель
├── hooks/               # Кастомные React хуки
├── contexts/            # React контексты
├── types/               # TypeScript типы
├── utils/               # Утилиты и хелперы
├── constants/           # Константы приложения
└── lib/                 # Внешние библиотеки и конфигурации
```

## 🎯 Принципы организации

### 1. **Разделение по функциональности**
- **UI компоненты** - базовые, переиспользуемые компоненты
- **Layout компоненты** - компоненты макета страницы
- **Feature компоненты** - специфичные для конкретных функций
- **Form компоненты** - формы и их валидация
- **Modal компоненты** - модальные окна

### 2. **Barrel Exports**
Каждая папка содержит `index.ts` файл для упрощения импортов:

```typescript
// Вместо
import { LoginForm } from '@/components/features/auth/LoginForm'
import { Modal } from '@/components/ui/Modal'

// Можно писать
import { LoginForm } from '@/components/features/auth'
import { Modal } from '@/components/ui'
// Или даже
import { LoginForm, Modal } from '@/components'
```

### 3. **Типизация**
Все типы вынесены в отдельную папку `types/` для централизованного управления.

### 4. **Хуки**
Кастомные хуки вынесены в отдельную папку `hooks/` для переиспользования логики.

### 5. **Константы**
Все константы приложения (API endpoints, роли, статусы) вынесены в `constants/`.

## 📝 Примеры использования

### Импорт компонентов
```typescript
// Импорт из конкретной категории
import { Modal, Calendar } from '@/components/ui'
import { LoginForm, AuthGuard } from '@/components/features/auth'
import { AppLayout, Sidebar } from '@/components/layout'

// Импорт всех компонентов
import { Modal, LoginForm, AppLayout } from '@/components'
```

### Импорт хуков
```typescript
import { useAuth, useModal, useApi } from '@/hooks'
```

### Импорт типов
```typescript
import type { User, AuthContextType, ModalProps } from '@/types'
```

### Импорт констант
```typescript
import { USER_ROLES, ROUTES, ERROR_MESSAGES } from '@/constants'
```

## 🔧 Настройка TypeScript

В `tsconfig.json` настроены алиасы путей:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/contexts/*": ["./src/contexts/*"],
    "@/types/*": ["./src/types/*"],
    "@/utils/*": ["./src/utils/*"],
    "@/constants/*": ["./src/constants/*"],
    "@/lib/*": ["./src/lib/*"]
  }
}
```

## 🚀 Преимущества новой структуры

1. **Масштабируемость** - легко добавлять новые функции
2. **Переиспользование** - компоненты логически сгруппированы
3. **Читаемость** - понятная структура папок
4. **Поддержка** - легко найти нужный компонент
5. **Типизация** - централизованное управление типами
6. **Производительность** - barrel exports для tree-shaking

## 📋 Следующие шаги

1. Обновить все импорты в существующих файлах
2. Добавить тесты для компонентов
3. Создать Storybook для UI компонентов
4. Добавить ESLint правила для структуры
5. Создать шаблоны для новых компонентов
