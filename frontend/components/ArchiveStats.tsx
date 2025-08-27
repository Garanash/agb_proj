'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useAuth } from './AuthContext'
import { 
  DocumentIcon, 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ArchiveStats {
  total_passports: number
  status_counts: Record<string, number>
  product_type_counts: Record<string, number>
  matrix_counts: Record<string, number>
  recent_passports: Array<{
    id: number
    passport_number: string
    order_number: string
    created_at: string
    nomenclature: {
      name: string
      code_1c: string
    }
  }>
}

interface ArchiveStatsProps {
  className?: string
}

const ArchiveStats = memo(({ className = "" }: ArchiveStatsProps) => {
  const { token, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<ArchiveStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedStats, setHasLoadedStats] = useState(false)
  const lastTokenRef = useRef<string | null>(null)

  // Мемоизируем функцию fetchStats
  const fetchStats = useCallback(async () => {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/ved-passports/archive/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setHasLoadedStats(true)
      } else {
        setError('Ошибка при загрузке статистики')
      }
    } catch (error) {
      setError('Ошибка при загрузке статистики')
      console.error('Ошибка при загрузке статистики:', error)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Загружаем статистику только при изменении токена или первом рендере
  useEffect(() => {
    if (token && token !== lastTokenRef.current && !hasLoadedStats) {
      lastTokenRef.current = token
      fetchStats()
    }
  }, [token, hasLoadedStats, fetchStats])

  const getProductTypeText = useCallback((productType: string) => {
    switch (productType) {
      case 'коронка':
        return 'Коронка'
      case 'расширитель':
        return 'Расширитель'
      case 'башмак':
        return 'Башмак'
      default:
        return productType
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return 'Активные'
      case 'completed':
        return 'Завершенные'
      case 'processing':
        return 'В обработке'
      default:
        return status
    }
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'completed':
        return <DocumentIcon className="h-5 w-5 text-blue-600" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-600" />
    }
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Если пользователь не авторизован, показываем сообщение
  if (!isAuthenticated) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          Для просмотра статистики необходимо авторизоваться
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Заголовок */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Статистика архива</h3>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoading ? 'Загрузка...' : hasLoadedStats ? 'Обновить' : 'Загрузить'}
          </button>
        </div>
      </div>

      {/* Основная статистика */}
      <div className="p-6">
        {!hasLoadedStats ? (
          <div className="text-center py-8">
            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Статистика не загружена</p>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Загрузка...' : 'Загрузить статистику'}
            </button>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : error || !stats ? (
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{error || 'Не удалось загрузить статистику'}</p>
            <button
              onClick={fetchStats}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Общее количество */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DocumentIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_passports}</div>
                <div className="text-sm text-gray-500">Всего паспортов</div>
              </div>

              {/* По статусам */}
              {Object.entries(stats.status_counts).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    {getStatusIcon(status)}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500">{getStatusText(status)}</div>
                </div>
              ))}
            </div>

            {/* Детальная статистика */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* По типам продуктов */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">По типам продуктов</h4>
                <div className="space-y-2">
                  {Object.entries(stats.product_type_counts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{getProductTypeText(type)}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* По матрицам */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">По матрицам</h4>
                <div className="space-y-2">
                  {Object.entries(stats.matrix_counts).map(([matrix, count]) => (
                    <div key={matrix} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{matrix}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Последние созданные паспорты */}
            {stats.recent_passports.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Последние созданные паспорты</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {stats.recent_passports.map((passport) => (
                      <div key={passport.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <DocumentIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{passport.passport_number}</div>
                            <div className="text-gray-500">{passport.nomenclature.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-900">{passport.order_number}</div>
                          <div className="text-gray-500">{formatDate(passport.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

ArchiveStats.displayName = 'ArchiveStats'

export default ArchiveStats
