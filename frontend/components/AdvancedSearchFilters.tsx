'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import { useAuth } from './AuthContext'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  CalendarIcon,
  DocumentIcon,
  TagIcon
} from '@heroicons/react/24/outline'

interface SearchFilters {
  search: string
  product_type: string
  matrix: string
  status: string
  date_from: string
  date_to: string
  order_number: string
  code_1c: string
}

interface FilterOptions {
  product_types: string[]
  matrices: string[]
  statuses: string[]
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

export default function AdvancedSearchFilters({ 
  onFiltersChange, 
  className = "" 
}: AdvancedSearchFiltersProps) {
  const { token, isAuthenticated } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    product_type: '',
    matrix: '',
    status: '',
    date_from: '',
    date_to: '',
    order_number: '',
    code_1c: ''
  })
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    product_types: [],
    matrices: [],
    statuses: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedFilters, setHasLoadedFilters] = useState(false)

  // Загружаем фильтры при открытии панели
  useEffect(() => {
    if (isExpanded && !hasLoadedFilters && token) {
      const fetchFilterOptions = async () => {
        setIsLoading(true)
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/ved-passports/archive/filters/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setFilterOptions(data)
            setHasLoadedFilters(true)
          }
        } catch (error) {
          console.error('Ошибка при загрузке фильтров:', error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchFilterOptions()
    }
  }, [isExpanded, hasLoadedFilters, token])

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value
    }
    setFilters(newFilters)
    // Автоматически применяем фильтры при изменении
    onFiltersChange(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(filters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      product_type: '',
      matrix: '',
      status: '',
      date_from: '',
      date_to: '',
      order_number: '',
      code_1c: ''
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const getProductTypeText = (productType: string) => {
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
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активный'
      case 'completed':
        return 'Завершен'
      case 'processing':
        return 'В обработке'
      default:
        return status
    }
  }

  // Если пользователь не авторизован, показываем сообщение
  if (!isAuthenticated) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          Для использования фильтров необходимо авторизоваться
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Основная строка поиска */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Поиск по номеру паспорта, заказу..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Поиск по точному совпадению</p>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
              isExpanded 
                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Фильтры
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Расширенные фильтры */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Индикатор загрузки фильтров */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Загрузка фильтров...</p>
            </div>
          )}

          {hasLoadedFilters && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Тип продукта */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип продукта
                  </label>
                  <select
                    value={filters.product_type}
                    onChange={(e) => handleFilterChange('product_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Все типы</option>
                    {filterOptions.product_types.map(type => (
                      <option key={type} value={type}>
                        {getProductTypeText(type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Матрица */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Матрица
                  </label>
                  <select
                    value={filters.matrix}
                    onChange={(e) => handleFilterChange('matrix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Все матрицы</option>
                    {filterOptions.matrices.map(matrix => (
                      <option key={matrix} value={matrix}>{matrix}</option>
                    ))}
                  </select>
                </div>

                {/* Статус */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Статус
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Все статусы</option>
                    {filterOptions.statuses.map(status => (
                      <option key={status} value={status}>
                        {getStatusText(status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Номер заказа */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Номер заказа
                  </label>
                  <input
                    type="text"
                    value={filters.order_number}
                    onChange={(e) => handleFilterChange('order_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Введите номер заказа"
                  />
                  <p className="text-xs text-gray-500 mt-1">Поиск по точному совпадению</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Код 1С */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Код 1С
                  </label>
                  <input
                    type="text"
                    value={filters.code_1c}
                    onChange={(e) => handleFilterChange('code_1c', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="УТ-00047870"
                  />
                  <p className="text-xs text-gray-500 mt-1">Поиск по точному совпадению</p>
                </div>

                {/* Дата создания (от) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата создания (от)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Дата создания (до) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата создания (до)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Кнопка очистки фильтров */}
              {hasActiveFilters && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Очистить все фильтры
                    </button>
                  </div>
                </div>
              )}

              {/* Активные фильтры */}
              {hasActiveFilters && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Активные фильтры:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value) return null
                      
                      let displayValue = value
                      if (key === 'product_type') displayValue = getProductTypeText(value)
                      if (key === 'status') displayValue = getStatusText(value)
                      
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {key === 'search' ? 'Поиск' : 
                           key === 'product_type' ? 'Тип' :
                           key === 'matrix' ? 'Матрица' :
                           key === 'status' ? 'Статус' :
                           key === 'date_from' ? 'Дата от' :
                           key === 'date_to' ? 'Дата до' :
                           key === 'order_number' ? 'Заказ' :
                           key === 'code_1c' ? 'Код 1С' : key}: {displayValue}
                          <button
                            onClick={() => handleFilterChange(key as keyof SearchFilters, '')}
                            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
