'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import Link from 'next/link'
import { useAuth } from '../../components/AuthContext'
import { 
  DocumentIcon, 
  ArchiveBoxIcon, 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

interface PassportStats {
  total: number
  active: number
  completed: number
  processing: number
}

export default function VEDPassportsPage() {
  const { token, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<PassportStats>({
    total: 0,
    active: 0,
    completed: 0,
    processing: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Загружаем статистику при монтировании компонента
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchStats()
    }
  }, [isAuthenticated, token])

  const fetchStats = async () => {
    if (!token) return
    
    setIsLoading(true)
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/ved-passports/archive/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const passports = await response.json()
        
        // Подсчитываем статистику
        const stats = {
          total: passports.length,
          active: passports.filter((p: any) => p.status === 'active').length,
          completed: passports.filter((p: any) => p.status === 'completed').length,
          processing: passports.filter((p: any) => p.status === 'processing').length
        }
        
        setStats(stats)
      } else {
        console.error('Ошибка при загрузке статистики:', response.statusText)
      }
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Если пользователь не авторизован, показываем сообщение
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Требуется авторизация</h3>
          <p className="text-gray-500 mb-4">
            Для доступа к паспортам ВЭД необходимо авторизоваться
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Войти в систему
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Паспорта ВЭД</h1>
          <p className="mt-2 text-gray-600">
            Управление паспортами внешнеэкономической деятельности
          </p>
        </div>

        {/* Поиск */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Поиск по паспортам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Основные разделы */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Создание паспортов */}
          <Link 
            href="/ved-passports/create"
            className="group relative bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                    <PlusIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    Создание паспортов
                  </h3>
                  <p className="text-sm text-gray-500">
                    Создание новых паспортов ВЭД
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Архив паспортов */}
          <Link 
            href="/ved-passports/archive"
            className="group relative bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                    <ArchiveBoxIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                    Архив паспортов
                  </h3>
                  <p className="text-sm text-gray-500">
                    Просмотр и поиск по архиву паспортов
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Статистика */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Статистика</h3>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Обновление...' : 'Обновить'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Активных паспортов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-500">Завершенных</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.processing}</div>
              <div className="text-sm text-gray-500">В обработке</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Всего паспортов</div>
            </div>
          </div>
        </div>

        {/* Информация о системе */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">О системе паспортов ВЭД</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              Система автоматически генерирует номера паспортов согласно установленным правилам:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Для коронок:</strong> AGB [Глубина бурения] [Матрица] [Серийный номер]</li>
              <li><strong>Для расширителей и башмаков:</strong> AGB [Матрица] [Серийный номер]</li>
            </ul>
            <p className="mt-3">
              Каждый паспорт получает уникальный номер, что обеспечивает возможность быстрого поиска и идентификации.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
