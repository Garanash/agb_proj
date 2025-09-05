'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getApiUrl } from '@/utils/api';
import { useAuth } from '../../../components/AuthContext'
import { 
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
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
  
  // Состояния для управления столбцами
  const [columnVisibility, setColumnVisibility] = useState({
    checkbox: true,
    passport: true,
    order: true,
    nomenclature: true,
    date: true,
    actions: true
  })
  
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 8,
    passport: 80,
    order: 40,
    nomenclature: 180,
    date: 35,
    actions: 50
  })
  
  const [showTableSettings, setShowTableSettings] = useState(false)
  
  // Состояния для перетаскивания столбцов
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<keyof typeof columnWidths | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // Функции для управления столбцами
  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const updateColumnWidth = (column: keyof typeof columnWidths, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(20, Math.min(500, width)) // Ограничиваем от 20 до 500px
    }))
  }

  const resetTableSettings = () => {
    setColumnVisibility({
      checkbox: true,
      passport: true,
      order: true,
      nomenclature: true,
      date: true,
      actions: true
    })
    setColumnWidths({
      checkbox: 8,
      passport: 80,
      order: 40,
      nomenclature: 180,
      date: 35,
      actions: 50
    })
  }

  // Функции для перетаскивания столбцов
  const handleMouseDown = (e: React.MouseEvent, column: keyof typeof columnWidths) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column])
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return
    
    const deltaX = e.clientX - startX
    const newWidth = Math.max(20, Math.min(500, startWidth + deltaX))
    updateColumnWidth(resizingColumn, newWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    setResizingColumn(null)
  }

  // Добавляем обработчики событий мыши
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, resizingColumn, startX, startWidth])

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
    const headers = ['Номер паспорта', 'Номер заказа поставщику', 'Код 1С', 'Наименование', 'Артикул', 'Матрица', 'Тип продукта', 'Дата создания', 'Дата обновления']
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
                    onClick={() => setShowTableSettings(true)}
                    className="inline-flex items-center px-3 py-2 bg-gray-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-700"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Настройки таблицы
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
            <div className="w-full">
                                            <div className="overflow-x-auto" style={{ maxWidth: '95vw' }}>
                <table className="w-full divide-y divide-gray-200 text-xs" style={{ width: '100%', maxWidth: '95vw', tableLayout: 'fixed' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      {columnVisibility.checkbox && (
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group relative" style={{ width: `${columnWidths.checkbox}px` }}>
                          <div className="flex items-center justify-between">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <button
                              onClick={() => toggleColumnVisibility('checkbox')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded"
                              title="Скрыть столбец"
                            >
                              <EyeIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                          <div
                            className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onMouseDown={(e) => handleMouseDown(e, 'checkbox')}
                            title="Перетащите для изменения ширины"
                          />
                        </th>
                      )}
                      {columnVisibility.passport && (
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group relative" style={{ width: `${columnWidths.passport}px` }}>
                          <div className="flex items-center justify-between">
                            <span>Паспорт</span>
                            <button
                              onClick={() => toggleColumnVisibility('passport')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded"
                              title="Скрыть столбец"
                            >
                              <EyeIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                          <div
                            className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onMouseDown={(e) => handleMouseDown(e, 'passport')}
                            title="Перетащите для изменения ширины"
                          />
                        </th>
                      )}
                      {columnVisibility.order && (
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group relative" style={{ width: `${columnWidths.order}px` }}>
                          <div className="flex items-center justify-between">
                            <span>Заказ</span>
                            <button
                              onClick={() => toggleColumnVisibility('order')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded"
                              title="Скрыть столбец"
                            >
                              <EyeIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                          <div
                            className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onMouseDown={(e) => handleMouseDown(e, 'order')}
                            title="Перетащите для изменения ширины"
                          />
                        </th>
                      )}
                      {columnVisibility.nomenclature && (
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group relative" style={{ width: `${columnWidths.nomenclature}px` }}>
                          <div className="flex items-center justify-between">
                            <span>Номенклатура</span>
                            <button
                              onClick={() => toggleColumnVisibility('nomenclature')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded"
                              title="Скрыть столбец"
                            >
                              <EyeIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                          <div
                            className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onMouseDown={(e) => handleMouseDown(e, 'nomenclature')}
                            title="Перетащите для изменения ширины"
                          />
                        </th>
                      )}
                      {columnVisibility.date && (
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group relative" style={{ width: `${columnWidths.date}px` }}>
                          <div className="flex items-center justify-between">
                            <span>Дата</span>
                            <button
                              onClick={() => toggleColumnVisibility('date')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded"
                              title="Скрыть столбец"
                            >
                              <EyeIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                          <div
                            className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onMouseDown={(e) => handleMouseDown(e, 'date')}
                            title="Перетащите для изменения ширины"
                          />
                        </th>
                      )}
                      {columnVisibility.actions && (
                        <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider group relative" style={{ width: `${columnWidths.actions}px` }}>
                          <div className="flex items-center justify-between">
                            <span>Действия</span>
                            <button
                              onClick={() => toggleColumnVisibility('actions')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded"
                              title="Скрыть столбец"
                            >
                              <EyeIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                          <div
                            className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onMouseDown={(e) => handleMouseDown(e, 'actions')}
                            title="Перетащите для изменения ширины"
                          />
                        </th>
                      )}
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPassports.map((passport) => (
                    <tr key={passport.id} className="hover:bg-gray-50">
                      {columnVisibility.checkbox && (
                        <td className="px-1 py-1 whitespace-nowrap" style={{ width: `${columnWidths.checkbox}px` }}>
                          <input
                            type="checkbox"
                            checked={selectedPassports.includes(passport.id)}
                            onChange={(e) => handleSelectPassport(passport.id, e.target.checked)}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      )}
                      {columnVisibility.passport && (
                        <td className="px-1 py-1 text-xs font-medium text-gray-900 break-words" style={{ width: `${columnWidths.passport}px` }}>
                          {passport.passport_number}
                        </td>
                      )}
                      {columnVisibility.order && (
                        <td className="px-1 py-1 text-xs text-gray-900 break-words" style={{ width: `${columnWidths.order}px` }}>
                          {passport.order_number}
                        </td>
                      )}
                      {columnVisibility.nomenclature && (
                        <td className="px-1 py-1 text-xs" style={{ width: `${columnWidths.nomenclature}px` }}>
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
                      )}
                      {columnVisibility.date && (
                        <td className="px-1 py-1 text-xs text-gray-500 break-words" style={{ width: `${columnWidths.date}px` }}>
                          {formatDate(passport.created_at)}
                        </td>
                      )}
                      {columnVisibility.actions && (
                        <td className="px-1 py-1 text-right text-xs font-medium" style={{ width: `${columnWidths.actions}px` }}>
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
                            className="text-red-600 hover:text-red-900"
                            title="Удалить"
                            onClick={() => handleDelete(passport.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
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

      {/* Модальное окно настроек таблицы */}
      {showTableSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Настройки таблицы</h3>
              
              {/* Настройки видимости столбцов */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Видимость столбцов</h4>
                <div className="space-y-2">
                  {Object.entries(columnVisibility).map(([key, visible]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => toggleColumnVisibility(key as keyof typeof columnVisibility)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {key === 'checkbox' ? 'Чекбокс' :
                         key === 'passport' ? 'Паспорт' :
                         key === 'order' ? 'Заказ' :
                         key === 'nomenclature' ? 'Номенклатура' :
                         key === 'date' ? 'Дата' :
                         key === 'actions' ? 'Действия' : key}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Настройки ширины столбцов */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ширина столбцов (px)</h4>
                <div className="space-y-3">
                  {Object.entries(columnWidths).map(([key, width]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm text-gray-700 w-24">
                        {key === 'checkbox' ? 'Чекбокс' :
                         key === 'passport' ? 'Паспорт' :
                         key === 'order' ? 'Заказ' :
                         key === 'nomenclature' ? 'Номенклатура' :
                         key === 'date' ? 'Дата' :
                         key === 'actions' ? 'Действия' : key}
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="500"
                        value={width}
                        onChange={(e) => updateColumnWidth(key as keyof typeof columnWidths, parseInt(e.target.value) || 20)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex justify-between">
                <button
                  onClick={resetTableSettings}
                  className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Сбросить
                </button>
                <button
                  onClick={() => setShowTableSettings(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
