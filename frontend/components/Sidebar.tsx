'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { getApiUrl } from '@/utils';
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon as ArchiveIcon,
  TableCellsIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
  ShieldCheckIcon as ShieldIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import UserProfile from './UserProfile'
import { useAuth } from '@/hooks'
import TextLogo from './TextLogo'
import ThemeToggle from './ThemeToggle'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles: string[]
  children?: { name: string; href: string; icon: any }[]
}

const navigation: NavigationItem[] = [
  { 
    name: 'Главная страница', 
    href: '/', 
    icon: HomeIcon, 
    roles: ['admin', 'manager', 'employee', 'ved_passport'] 
  },
  { 
    name: 'О нас', 
    href: '/about', 
    icon: InformationCircleIcon, 
    roles: ['admin', 'manager', 'employee', 'ved_passport'] 
  },
  { 
    name: 'Wiki', 
    href: '/wiki', 
    icon: BookOpenIcon, 
    roles: ['admin', 'manager', 'employee', 'ved_passport', 'service_engineer'] 
  },
  {
    name: 'Сопоставление артикулов',
    href: '/article-matching',
    icon: TableCellsIcon,
    roles: ['ved_passport', 'admin']
  },
  {
    name: 'Поиск поставщиков',
    href: '/article-search',
    icon: MagnifyingGlassIcon,
    roles: ['admin', 'manager', 'ved_passport']
  },
  {
    name: 'Управление пользователями',
    href: '/users',
    icon: UserGroupIcon,
    roles: ['admin']
  },
  {
    name: 'Новая заявка',
    href: '/dashboard/customer?tab=create',
    icon: ClipboardDocumentListIcon,
    roles: ['customer']
  },
  {
    name: 'Выполненные заявки',
    href: '/dashboard/customer?tab=requests',
    icon: ArchiveIcon,
    roles: ['customer']
  },
  {
    name: 'Доступные заявки',
    href: '/dashboard/contractor?tab=requests',
    icon: ClipboardDocumentListIcon,
    roles: ['contractor']
  },
  {
    name: 'Архив заявок',
    href: '/dashboard/contractor?tab=archive',
    icon: ArchiveIcon,
    roles: ['contractor']
  },
  {
    name: 'Мой профиль',
    href: '/dashboard/contractor?tab=profile',
    icon: UserGroupIcon,
    roles: ['contractor']
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
    name: 'Рабочий чат', 
    href: '/chat', 
    icon: ChatBubbleLeftRightIcon, 
    roles: ['admin', 'manager', 'employee', 'ved_passport'] 
  },
  { 
    name: 'Паспорта ВЭД', 
    href: '/ved-passports',
    icon: DocumentIcon, 
    roles: ['ved_passport', 'admin'],
    children: [
      { name: 'Создание паспортов', href: '/ved-passports/create', icon: DocumentIcon },
      { name: 'Архив паспортов', href: '/admin/ved-passports', icon: ArchiveBoxIcon }
    ]
  },
  {
    name: 'Автоматизация',
    href: '/admin/automation',
    icon: Cog6ToothIcon,
    roles: ['admin']
  },
  {
    name: 'Управление ботами',
    href: '/admin/bots',
    icon: ChatBubbleLeftRightIcon,
    roles: ['admin']
  },
  {
    name: 'Настройки системы',
    href: '/admin/settings',
    icon: WrenchScrewdriverIcon,
    roles: ['admin']
  },
  {
    name: 'Текущие заявки',
    href: '/dashboard/service-engineer?tab=current',
    icon: ClipboardDocumentListIcon,
    roles: ['service_engineer']
  },
  {
    name: 'Архив заявок',
    href: '/dashboard/service-engineer?tab=archive',
    icon: ArchiveIcon,
    roles: ['service_engineer']
  },
  {
    name: 'Наши исполнители',
    href: '/dashboard/service-engineer?tab=contractors',
    icon: WrenchScrewdriverIcon,
    roles: ['service_engineer']
  },
  {
    name: 'Служба безопасности',
    href: '/dashboard/security',
    icon: ShieldIcon,
    roles: ['security']
  },
  {
    name: 'Отдел кадров',
    href: '/dashboard/hr',
    icon: UserGroupIcon,
    roles: ['hr']
  },
  {
    name: 'Настройки',
    href: '/settings',
    icon: Cog6ToothIcon,
    roles: ['admin', 'manager', 'employee', 'ved_passport', 'customer', 'contractor', 'security', 'hr']
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [currentUrl, setCurrentUrl] = useState(window.location.href)

  console.log('Sidebar rendered:', { pathname, user: !!user })

  // Отслеживаем изменения URL
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentUrl(window.location.href)
    }

    // Слушаем изменения URL
    window.addEventListener('popstate', handleLocationChange)

    // Также проверяем изменения через интервал для SPA навигации
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        setCurrentUrl(window.location.href)
      }
    }

    const interval = setInterval(checkUrlChange, 100)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      clearInterval(interval)
    }
  }, [currentUrl])

  // Мемоизируем отфильтрованную навигацию
  const filteredNavigation = useMemo(() => {
    return navigation.filter(item => 
      user ? item.roles.includes(user.role) : false
    )
  }, [user?.role])

  // Проверяем, активен ли текущий путь
  const isItemActive = useCallback((item: NavigationItem) => {
    // Для пунктов сервисного инженера проверяем и путь и параметр tab
    if (item.roles.includes('service_engineer')) {
      if (pathname === '/dashboard/service-engineer') {
        const url = new URL(currentUrl)
        const tab = url.searchParams.get('tab')

        // Извлекаем tab из href элемента
        const itemUrl = new URL(item.href, window.location.origin)
        const itemTab = itemUrl.searchParams.get('tab')

        // Сравниваем tabs: точное совпадение или current по умолчанию
        if (itemTab === tab || (itemTab === 'current' && !tab)) {
          return true
        }
      }
      return false
    }

    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }, [pathname, currentUrl])

  // Переключение состояния подпунктов
  const toggleExpanded = useCallback((itemName: string) => {
    console.log('Toggle expanded:', itemName)
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }, [])

  // Обработчик клика по элементу навигации
  const handleNavigationClick = useCallback((href: string, itemName: string) => {
    console.log('Navigation click:', { href, itemName, currentPath: pathname })
    
    // Если это элемент с подпунктами, переключаем его
    const item = navigation.find(nav => nav.name === itemName)
    if (item && item.children) {
      toggleExpanded(itemName)
      return
    }
    
    // Иначе переходим по ссылке
    console.log('Navigating to:', href)
    router.push(href)
  }, [pathname, router, toggleExpanded])

  // Автоматически разворачиваем активный пункт
  useEffect(() => {
    const activeItem = filteredNavigation.find(item => isItemActive(item))
    if (activeItem && activeItem.children) {
      setExpandedItems(prev => {
        // Проверяем, не добавлен ли уже этот пункт
        if (prev.has(activeItem.name)) {
          return prev
        }
        return new Set(Array.from(prev).concat(activeItem.name))
      })
    }
  }, [pathname, filteredNavigation, isItemActive])

  return (
    <div className="w-80 bg-white dark:bg-gray-800 sidebar-shadow flex flex-col h-full relative z-50">
      {/* Логотип и название платформы */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <TextLogo size="md" />
      </div>

      {/* Навигационное меню */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = isItemActive(item)
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.has(item.name)
          
          return (
            <div key={item.name}>
              <button
                onClick={() => handleNavigationClick(item.href, item.name)}
                className={`
                  w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group cursor-pointer text-left
                  ${isActive 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <item.icon 
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                    ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                  `} 
                />
                <span className="flex-1">{item.name}</span>
                {hasChildren && (
                  isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  )
                )}
              </button>
              
              {/* Подпункты */}
              {hasChildren && isExpanded && item.children && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <button
                        key={child.name}
                        onClick={() => {
                          console.log('Child navigation click:', child.href)
                          router.push(child.href)
                        }}
                        className={`
                          w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-left
                          ${isChildActive 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-400' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                          }
                        `}
                      >
                        <child.icon 
                          className={`
                            mr-3 h-4 w-4 flex-shrink-0
                            ${isChildActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                          `} 
                        />
                        {child.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Переключатель темы */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Тема</span>
          <ThemeToggle variant="button" size="sm" showLabel={false} />
        </div>
      </div>

      {/* Виджет пользователя */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <UserProfile />
      </div>
    </div>
  )
}
