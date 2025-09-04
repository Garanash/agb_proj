'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getApiUrl } from '@/utils/api';
import { useAuth } from '../../../components/AuthContext'
import { 
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import AdvancedSearchFilters from '../../../components/AdvancedSearchFilters'
import PassportPreview from '../../../components/PassportPreview'

interface NomenclatureItem {
  id: number
  code_1c: string
  name: string
  article: string
  matrix: string
  drilling_depth?: string
  height?: string
  thread?: string
  product_type: string
}

interface PassportRecord {
  id: number
  passport_number: string
  order_number: string
  nomenclature: NomenclatureItem
  quantity: number
  status: string
  created_at: string
  updated_at: string
}

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

export default function VEDPassportsArchivePage() {
  const { token, isAuthenticated } = useAuth()
  const [passports, setPassports] = useState<PassportRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedPassports, setHasLoadedPassports] = useState(false)
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
  const [showPassportModal, setShowPassportModal] = useState(false)
  const [selectedPassport, setSelectedPassport] = useState<PassportRecord | null>(null)
  const [selectedPassports, setSelectedPassports] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Фильтруем паспорта локально по поисковому запросу (если сервер не поддерживает поиск)
  const filteredPassports = useMemo(() => {
    if (!passports.length) return []

    let filtered = [...passports]

    // Фильтрация по поисковому запросу (локальная, если сервер не поддерживает)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim()
      filtered = filtered.filter(passport =>
        passport.passport_number.toLowerCase().includes(searchLower) ||
        passport.order_number.toLowerCase().includes(searchLower) ||
        passport.nomenclature.code_1c.toLowerCase().includes(searchLower) ||
        passport.nomenclature.name.toLowerCase().includes(searchLower) ||
        passport.nomenclature.article.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [filters.search, passports])

  // Обновляем состояние selectAll при изменении selectedPassports
  useEffect(() => {
    if (filteredPassports.length > 0) {
      const allSelected = filteredPassports.every(passport => selectedPassports.includes(passport.id))
      setSelectAll(allSelected)
    } else {
      setSelectAll(false)
    }
  }, [selectedPassports, filteredPassports])

  const fetchPassports = useCallback(async (useFilters = false) => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      let url = `${getApiUrl()}/api/ved-passports/archive/`

      // Используем фильтры при загрузке данных
      if (useFilters) {
        const params = new URLSearchParams()
        // Передаем все фильтры на сервер, включая поиск
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value)
          }
        })

        if (params.toString()) {
          url += '?' + params.toString()
        }
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPassports(data)
        setHasLoadedPassports(true)
      } else {
        setError('Ошибка при загрузке паспортов')
        console.error('Ошибка при загрузке паспортов:', response.statusText)
      }
    } catch (error) {
      setError('Ошибка при загрузке паспортов')
      console.error('Ошибка при загрузке паспортов:', error)
    } finally {
      setIsLoading(false)
    }
  }, [token, filters])

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
    // Автоматически применяем фильтры при изменении
    fetchPassports(true)
  }, [fetchPassports])

  const handleApplyFilters = useCallback(() => {
    // Перезагружаем данные с сервера для точной фильтрации
    fetchPassports(true)
  }, [fetchPassports])

  // Загружаем все паспорта при первой загрузке компонента
  useEffect(() => {
    if (isAuthenticated && token && !hasLoadedPassports) {
      fetchPassports(false) // Загружаем все паспорта без фильтров
    }
  }, [isAuthenticated, token, hasLoadedPassports, fetchPassports])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return 'Активный'
      case 'completed':
        return 'Завершен'
      case 'processing':
        return 'В обработке'
      default:
        return 'Неизвестно'
    }
  }, [])

  const getProductTypeColor = useCallback((productType: string) => {
    switch (productType) {
      case 'коронка':
        return 'bg-blue-100 text-blue-800'
      case 'расширитель':
        return 'bg-green-100 text-green-800'
      case 'башмак':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

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

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот паспорт?')) {
      return
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/ved-passports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Удаляем паспорт из списка
        setPassports(prev => prev.filter(p => p.id !== id))
        // Обновляем статистику
        fetchPassports()
      } else {
        alert('Ошибка при удалении паспорта')
      }
    } catch (error) {
      console.error('Ошибка при удалении паспорта:', error)
      alert('Ошибка при удалении паспорта')
    }
  }, [token, fetchPassports])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const clearAllFilters = useCallback(() => {
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
  }, [])

  const handleSelectPassport = useCallback((passportId: number, checked: boolean) => {
    setSelectedPassports(prev => {
      if (checked) {
        return [...prev, passportId]
      } else {
        return prev.filter(id => id !== passportId)
      }
    })
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedPassports(filteredPassports.map(p => p.id))
    } else {
      setSelectedPassports([])
    }
  }, [filteredPassports])

  const exportBulkPassports = useCallback(async (format: 'pdf' | 'xlsx') => {
    if (selectedPassports.length === 0) {
      alert('Выберите паспорта для экспорта')
      return
    }

    if (!token) return

    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/ved-passports/export/bulk/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passport_ids: selectedPassports
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `bulk_passports.${format}`

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Ошибка при экспорте паспортов')
      }
    } catch (error) {
      console.error('Ошибка при экспорте паспортов:', error)
      alert('Ошибка при экспорте паспортов')
    }
  }, [selectedPassports, token])

  const exportAllPassports = useCallback(async (format: 'pdf' | 'xlsx') => {
    if (!token) return

    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/ved-passports/export/all/${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `all_passports.${format}`

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Ошибка при экспорте паспортов')
      }
    } catch (error) {
      console.error('Ошибка при экспорте паспортов:', error)
      alert('Ошибка при экспорте паспортов')
    }
  }, [token])

  const clearSelection = useCallback(() => {
    setSelectedPassports([])
    setSelectAll(false)
  }, [])

  const viewPassport = useCallback((passport: PassportRecord) => {
    setSelectedPassport(passport)
    setShowPassportModal(true)
  }, [])

  const exportPassport = useCallback(async (passportId: number, format: 'pdf' | 'xlsx') => {
    if (!token) return

    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/ved-passports/${passportId}/export/${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `passport_${passportId}.${format}`

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Ошибка при экспорте паспорта')
      }
    } catch (error) {
      console.error('Ошибка при экспорте паспорта:', error)
      alert('Ошибка при экспорте паспорта')
    }
  }, [token])

  const exportToExcel = useCallback(() => {
    if (filteredPassports.length === 0) return

    // Создаем CSV данные с правильной кодировкой
    const BOM = '\uFEFF' // BOM для UTF-8
    const headers = ['Номер паспорта', 'Номер заказа', 'Код 1С', 'Наименование', 'Артикул', 'Матрица', 'Тип продукта', 'Количество', 'Статус', 'Дата создания', 'Дата обновления']
    const csvData = [
      headers.join(';'), // Используем точку с запятой вместо запятой
      ...filteredPassports.map(passport => [
        passport.passport_number,
        passport.order_number,
        passport.nomenclature.code_1c,
        passport.nomenclature.name.replace(/"/g, '""'), // Экранируем кавычки
        passport.nomenclature.article,
        passport.nomenclature.matrix,
        passport.nomenclature.product_type,
        passport.quantity,
        passport.status,
        new Date(passport.created_at).toLocaleDateString('ru-RU'),
        new Date(passport.updated_at).toLocaleDateString('ru-RU')
      ].join(';'))
    ].join('\r\n') // Используем Windows line endings

    // Создаем и скачиваем файл с правильной кодировкой
    const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `архив_паспортов_вэд_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [filteredPassports])

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
            Для доступа к архиву паспортов ВЭД необходимо авторизоваться
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
        {/* Заголовок и навигация */}
        <div className="mb-8">
          <Link 
            href="/ved-passports"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Назад к паспортам ВЭД
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Архив паспортов ВЭД</h1>
              <p className="mt-2 text-gray-600">
                Просмотр и управление всеми паспортами внешнеэкономической деятельности
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToExcel}
                disabled={filteredPassports.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Экспорт в Excel
              </button>
              <Link
                href="/ved-passports/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Создать паспорт
              </Link>
            </div>
          </div>
        </div>



        {/* Ошибка загрузки */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800">{error}</div>
            <button
              onClick={() => fetchPassports(false)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Расширенный поиск и фильтры */}
        <div className="mb-6">
          <AdvancedSearchFilters onFiltersChange={handleFiltersChange} />
        </div>

        {/* Результаты поиска */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Результаты поиска
              {hasLoadedPassports && filteredPassports.length !== passports.length && (
                <span className="ml-2 text-sm text-gray-500">
                  (показано {filteredPassports.length} из {passports.length})
                </span>
              )}
            </h3>
            {hasLoadedPassports && filteredPassports.length > 0 && (
              <div className="flex items-center space-x-3">
                {selectedPassports.length > 0 && (
                  <>
                    <span className="text-sm text-gray-600">
                      Выбрано: {selectedPassports.length}
                    </span>
                    <button
                      onClick={() => exportBulkPassports('pdf')}
                      className="inline-flex items-center px-3 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                    >
                      <DocumentIcon className="w-4 h-4 mr-2" />
                      Экспорт PDF
                    </button>
                    <button
                      onClick={() => exportBulkPassports('xlsx')}
                      className="inline-flex items-center px-3 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Экспорт Excel
                    </button>
                    <button
                      onClick={clearSelection}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Очистить выбор
                    </button>
                  </>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportAllPassports('pdf')}
                    disabled={filteredPassports.length === 0}
                    className="inline-flex items-center px-3 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DocumentIcon className="w-4 h-4 mr-2" />
                    Выгрузка всех PDF
                  </button>
                  <button
                    onClick={() => exportAllPassports('xlsx')}
                    disabled={filteredPassports.length === 0}
                    className="inline-flex items-center px-3 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                    Выгрузка всех Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Таблица паспортов */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {!hasLoadedPassports ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <DocumentIcon className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Паспорты не загружены</h3>
              <p className="text-gray-500 mb-4">
                Нажмите кнопку ниже для загрузки паспортов из архива
              </p>
              <button
                onClick={() => fetchPassports(false)}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Загрузка...' : 'Загрузить паспорты'}
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка паспортов...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер паспорта
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер заказа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номенклатура
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Количество
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPassports.map((passport) => (
                    <tr key={passport.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPassports.includes(passport.id)}
                          onChange={(e) => handleSelectPassport(passport.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {passport.passport_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {passport.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {passport.nomenclature.code_1c}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProductTypeColor(passport.nomenclature.product_type)}`}>
                              {getProductTypeText(passport.nomenclature.product_type)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 mb-1">
                            {passport.nomenclature.name}
                          </div>
                          <div className="text-xs text-gray-500 space-x-2">
                            <span>Артикул: {passport.nomenclature.article}</span>
                            <span>Матрица: {passport.nomenclature.matrix}</span>
                            {passport.nomenclature.drilling_depth && (
                              <span>Глубина: {passport.nomenclature.drilling_depth}</span>
                            )}
                            {passport.nomenclature.height && (
                              <span>Высота: {passport.nomenclature.height}</span>
                            )}
                            {passport.nomenclature.thread && (
                              <span>Резьба: {passport.nomenclature.thread}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {passport.quantity} шт
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(passport.status)}`}>
                          {getStatusText(passport.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(passport.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => viewPassport(passport)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Просмотр"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => exportPassport(passport.id, 'pdf')}
                            className="text-red-600 hover:text-red-900"
                            title="Экспорт в PDF"
                          >
                            <DocumentIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => exportPassport(passport.id, 'xlsx')}
                            className="text-green-600 hover:text-green-900"
                            title="Экспорт в Excel"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Удалить"
                            onClick={() => handleDelete(passport.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Пустое состояние */}
          {hasLoadedPassports && filteredPassports.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Паспорты не найдены</h3>
              <p className="text-gray-500">
                {Object.values(filters).some(v => v !== '') 
                  ? 'Попробуйте изменить параметры поиска или фильтры'
                  : 'В архиве пока нет паспортов ВЭД'
                }
              </p>
              {Object.values(filters).some(v => v !== '') && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Очистить все фильтры
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Предварительный просмотр паспорта */}
      <PassportPreview
        passport={selectedPassport!}
        isOpen={showPassportModal}
        onClose={() => setShowPassportModal(false)}
      />
    </div>
  )
}
