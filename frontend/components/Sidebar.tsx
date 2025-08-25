'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  InformationCircleIcon, 
  Cog6ToothIcon,
  UserCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import UserProfile from './UserProfile'
import { useAuth } from './AuthContext'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles: string[]
}

const navigation: NavigationItem[] = [
  { 
    name: 'Главная страница', 
    href: '/', 
    icon: HomeIcon, 
    roles: ['admin', 'manager', 'employee'] 
  },
  { 
    name: 'О нас', 
    href: '/about', 
    icon: InformationCircleIcon, 
    roles: ['admin', 'manager', 'employee'] 
  },
  { 
    name: 'Управление пользователями', 
    href: '/users', 
    icon: UserGroupIcon, 
    roles: ['admin'] 
  },
  { 
    name: 'Новости', 
    href: '/news', 
    icon: DocumentTextIcon, 
    roles: ['admin', 'manager'] 
  },
  { 
    name: 'Проекты', 
    href: '/projects', 
    icon: BriefcaseIcon, 
    roles: ['admin', 'manager'] 
  },
  { 
    name: 'Отчеты', 
    href: '/reports', 
    icon: ChartBarIcon, 
    roles: ['admin', 'manager'] 
  },
  { 
    name: 'Настройки', 
    href: '/settings', 
    icon: Cog6ToothIcon, 
    roles: ['admin', 'manager', 'employee'] 
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Фильтруем навигацию по ролям пользователя
  const filteredNavigation = navigation.filter(item => 
    user ? item.roles.includes(user.role) : false
  )

  return (
    <div className="w-80 bg-white sidebar-shadow flex flex-col h-full">
      {/* Логотип и название платформы */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img
              src="https://almazgeobur.kz/wp-content/uploads/2021/08/agb_logo_h-2.svg"
              alt="Алмазгеобур"
              width={60}
              height={40}
              className="h-10 w-auto logo-custom-colors"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Felix</h1>
            <p className="text-sm text-gray-600">Корпоративная платформа</p>
          </div>
        </div>
      </div>

      {/* Навигационное меню */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon 
                className={`
                  mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                  ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                `} 
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Виджет пользователя */}
      <div className="border-t border-gray-200 p-4">
        <UserProfile />
      </div>
    </div>
  )
}
