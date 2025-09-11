'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from './AuthContext'

interface NavigationItem {
  path: string
  label: string
  icon?: string
  requiredRoles?: string[]
  requiredAnyRole?: string[]
}

const navigationConfig: NavigationItem[] = [
  // Общие для всех авторизованных пользователей
  {
    path: '/dashboard',
    label: 'Главная',
    icon: '🏠'
  },

  // Админ
  {
    path: '/admin/departments',
    label: 'Управление отделами',
    icon: '🏢',
    requiredRoles: ['admin']
  },
  {
    path: '/admin/users',
    label: 'Управление пользователями',
    icon: '👥',
    requiredRoles: ['admin']
  },
  {
    path: '/admin/bots',
    label: 'Управление ботами',
    icon: '🤖',
    requiredRoles: ['admin']
  },

  // Руководители отделов
  {
    path: '/department',
    label: 'Мой отдел',
    icon: '📊',
    requiredRoles: ['department_head']
  },
  {
    path: '/projects',
    label: 'Проекты',
    icon: '📁',
    requiredAnyRole: ['manager', 'department_head', 'admin']
  },
  {
    path: '/kanban',
    label: 'Kanban доски',
    icon: '📋',
    requiredAnyRole: ['manager', 'department_head', 'employee', 'admin']
  },

  // Сотрудники
  {
    path: '/news',
    label: 'Новости',
    icon: '📰',
    requiredAnyRole: ['employee', 'manager', 'admin']
  },
  {
    path: '/chat',
    label: 'Чат',
    icon: '💬',
    requiredAnyRole: ['employee', 'manager', 'admin']
  },

  // Специалисты по ВЭД
  {
    path: '/ved-passports',
    label: 'ВЭД паспорта',
    icon: '📄',
    requiredRoles: ['ved_passport']
  },

  // Заказчики
  {
    path: '/dashboard/customer',
    label: 'Мои заявки',
    icon: '📝',
    requiredRoles: ['customer']
  },

  // Исполнители
  {
    path: '/dashboard/contractor',
    label: 'Мои работы',
    icon: '🔧',
    requiredRoles: ['contractor']
  },

  // Сервисные инженеры
  {
    path: '/repair-requests',
    label: 'Заявки на ремонт',
    icon: '🔧',
    requiredRoles: ['service_engineer']
  },

  // HR менеджеры
  {
    path: '/hr',
    label: 'Управление персоналом',
    icon: '👔',
    requiredRoles: ['hr_manager']
  },

  // Служба безопасности
  {
    path: '/security',
    label: 'Безопасность',
    icon: '🔒',
    requiredAnyRole: ['security_officer', 'security_manager']
  },

  // Телефонный справочник (для всех)
  {
    path: '/phone-directory',
    label: 'Телефонный справочник',
    icon: '📞'
  },

  // Настройки (для всех авторизованных)
  {
    path: '/settings',
    label: 'Настройки',
    icon: '⚙️'
  }
]

export const RoleBasedNavigation: React.FC = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return null
  }

  const primaryRole = user.role

  const getVisibleItems = () => {
    return navigationConfig.filter(item => {
      // Если нет ограничений по ролям, показываем всем авторизованным
      if (!item.requiredRoles && !item.requiredAnyRole) {
        return true
      }

      // Проверяем requiredRoles (все роли обязательны)
      if (item.requiredRoles) {
        return item.requiredRoles.includes(primaryRole)
      }

      // Проверяем requiredAnyRole (достаточно одной роли)
      if (item.requiredAnyRole) {
        return item.requiredAnyRole.includes(primaryRole)
      }

      return false
    })
  }

  const visibleItems = getVisibleItems()

  return (
    <nav className="role-based-navigation">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visibleItems.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
          >
            <span className="text-2xl mb-2">{item.icon}</span>
            <span className="text-sm text-center font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Информация о ролях пользователя */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Ваши роли:</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            {primaryRole} (основная)
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {primaryRole}
          </span>
        </div>
      </div>
    </nav>
  )
}

export default RoleBasedNavigation
