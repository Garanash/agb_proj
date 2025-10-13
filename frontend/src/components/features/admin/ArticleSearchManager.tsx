'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks'
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import ArticleDetailsModal from './ArticleDetailsModal'

interface ArticleSearchRequest {
  id: number
  request_name?: string
  articles: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_articles: number
  found_articles: number
  total_suppliers: number
  created_at: string
  completed_at?: string
  results?: SearchResult[]
}

interface SearchResult {
  article_code: string
  suppliers: Supplier[]
  total_suppliers: number
  confidence_scores: number[]
}

interface Supplier {
  company_name: string
  contact_person?: string
  email?: string
  email_validated?: boolean
  phone?: string
  website?: string
  website_validated?: boolean
  address?: string
  country?: string
  city?: string
  price?: number
  currency?: string
  min_order_quantity?: number
  availability?: string
  confidence_score?: number
}

interface SupplierGroup {
  supplier: Supplier
  articles: SupplierArticle[]
  total_articles: number
  avg_price?: number
}

interface SupplierArticle {
  id: number
  article_code: string
  article_name: string
  description?: string
  price?: number
  currency: string
  unit: string
  min_order_quantity?: number
  availability?: string
  agb_article?: string
  bl_article?: string
  created_at: string
  last_price_update?: string
}

export default function ArticleSearchManager() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'suppliers'>('search')
  const [articles, setArticles] = useState<string[]>([''])
  const [requestName, setRequestName] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [validateContacts, setValidateContacts] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchRequests, setSearchRequests] = useState<ArticleSearchRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ArticleSearchRequest | null>(null)
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Состояние для модального окна
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArticleCode, setSelectedArticleCode] = useState('')
  const [modalResults, setModalResults] = useState<SearchResult[]>([])

  useEffect(() => {
    if (token) {
      loadSearchRequests()
    }
  }, [token])

  const loadSearchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/v3/article-search/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSearchRequests(data)
      } else {
        setMessage({ type: 'error', text: 'Ошибка загрузки запросов поиска' })
      }
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error)
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
    } finally {
      setLoading(false)
    }
  }

  const addArticleField = () => {
    setArticles([...articles, ''])
  }

  const removeArticleField = (index: number) => {
    if (articles.length > 1) {
      setArticles(articles.filter((_, i) => i !== index))
    }
  }

  const updateArticle = (index: number, value: string) => {
    const newArticles = [...articles]
    newArticles[index] = value
    setArticles(newArticles)
  }

  const handleSearch = async () => {
    const validArticles = articles.filter(article => article.trim() !== '')
    if (validArticles.length === 0) {
      setMessage({ type: 'error', text: 'Введите хотя бы один артикул' })
      return
    }

    try {
      setIsSearching(true)
      setMessage(null)

      const response = await fetch('http://localhost:8000/api/v3/article-search/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articles: validArticles,
          request_name: requestName || undefined,
          use_ai: useAI,
          validate_contacts: validateContacts
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: 'Поиск поставщиков запущен' })
        setRequestName('')
        setArticles([''])
        loadSearchRequests()
        setActiveTab('results')
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.detail || 'Ошибка запуска поиска' })
      }
    } catch (error) {
      console.error('Ошибка поиска:', error)
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
    } finally {
      setIsSearching(false)
    }
  }

  const loadRequestDetails = async (requestId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/api/v3/article-search/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedRequest(data)
        
        // Если есть результаты, открываем модальное окно с первым артикулом
        if (data.results && data.results.length > 0) {
          const firstResult = data.results[0]
          openArticleModal(firstResult.article_code, data.results)
        } else {
          setActiveTab('results')
        }
      } else {
        setMessage({ type: 'error', text: 'Ошибка загрузки деталей запроса' })
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error)
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
    } finally {
      setLoading(false)
    }
  }

  const loadSupplierGroups = async (requestId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/api/v3/article-search/suppliers/grouped?request_id=${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSupplierGroups(data)
        setActiveTab('suppliers')
      } else {
        setMessage({ type: 'error', text: 'Ошибка загрузки поставщиков' })
      }
    } catch (error) {
      console.error('Ошибка загрузки поставщиков:', error)
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
    } finally {
      setLoading(false)
    }
  }

  // Функции для модального окна
  const openArticleModal = (articleCode: string, results: SearchResult[]) => {
    setSelectedArticleCode(articleCode)
    setModalResults(results)
    setIsModalOpen(true)
  }

  const closeArticleModal = () => {
    setIsModalOpen(false)
    setSelectedArticleCode('')
    setModalResults([])
  }

  const retrySearchForArticle = async (articleCode: string) => {
    try {
      setIsSearching(true)
      const response = await fetch('http://localhost:8000/api/v3/article-search/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          articles: [articleCode],
          request_name: `Повторный поиск: ${articleCode}`,
          use_ai: true,
          validate_contacts: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Обновляем результаты в модальном окне
        if (data.results && data.results.length > 0) {
          const articleResult = data.results.find((r: any) => r.article_code === articleCode)
          if (articleResult) {
            setModalResults(data.results)
          }
        }
        // Перезагружаем список запросов
        await loadSearchRequests()
        setMessage({ type: 'success', text: 'Повторный поиск выполнен успешно' })
      } else {
        setMessage({ type: 'error', text: 'Ошибка повторного поиска' })
      }
    } catch (error) {
      console.error('Ошибка повторного поиска:', error)
      setMessage({ type: 'error', text: 'Ошибка повторного поиска' })
    } finally {
      setIsSearching(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает'
      case 'processing':
        return 'Обрабатывается'
      case 'completed':
        return 'Завершен'
      case 'failed':
        return 'Ошибка'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU')
  }

  const formatPrice = (price?: number, currency: string = 'RUB') => {
    if (!price) return 'Цена не указана'
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'RUB' ? 'RUB' : 'USD'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Сообщения */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Вкладки */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Новый поиск
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'results'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Результаты поиска
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Поставщики
          </button>
        </nav>
      </div>

      {/* Вкладка поиска */}
      {activeTab === 'search' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="space-y-6">
            {/* Название запроса */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Название запроса (необязательно)
              </label>
              <input
                type="text"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="Например: Поиск поставщиков для проекта X"
              />
            </div>

            {/* Артикулы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Артикулы для поиска *
              </label>
              <div className="space-y-2">
                {articles.map((article, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={article}
                      onChange={(e) => updateArticle(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder={`Артикул ${index + 1}`}
                    />
                    {articles.length > 1 && (
                      <button
                        onClick={() => removeArticleField(index)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addArticleField}
                className="mt-2 flex items-center space-x-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Добавить артикул</span>
              </button>
            </div>

            {/* Настройки */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Настройки поиска</h3>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="useAI"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="useAI" className="text-sm text-gray-700 dark:text-gray-300">
                  Использовать ИИ для поиска поставщиков
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="validateContacts"
                  checked={validateContacts}
                  onChange={(e) => setValidateContacts(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="validateContacts" className="text-sm text-gray-700 dark:text-gray-300">
                  Валидировать email и сайты поставщиков
                </label>
              </div>
            </div>

            {/* Кнопка поиска */}
            <div className="flex justify-end">
              <button
                onClick={handleSearch}
                disabled={isSearching || articles.every(article => article.trim() === '')}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <ClockIcon className="h-5 w-5 animate-spin" />
                    <span>Поиск...</span>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>Найти поставщиков</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Вкладка результатов */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Список запросов */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">История поиска</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.request_name || `Поиск ${request.id}`}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getStatusText(request.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {request.total_articles} артикулов • {request.found_articles} найдено • {request.total_suppliers} поставщиков
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Создан: {formatDate(request.created_at)}
                        {request.completed_at && ` • Завершен: ${formatDate(request.completed_at)}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadRequestDetails(request.id)}
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                      >
                        Подробнее
                      </button>
                      {request.status === 'completed' && (
                        <button
                          onClick={() => loadSupplierGroups(request.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Поставщики
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Детали выбранного запроса */}
          {selectedRequest && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedRequest.request_name || `Запрос ${selectedRequest.id}`}
                </h3>
              </div>
              <div className="p-6">
                {selectedRequest.results && selectedRequest.results.length > 0 ? (
                  <div className="space-y-4">
                    {selectedRequest.results.map((result, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Артикул: {result.article_code}
                          </h4>
                          <button
                            onClick={() => openArticleModal(result.article_code, [result])}
                            className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>Подробнее</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.suppliers.map((supplier, supplierIndex) => (
                            <div key={supplierIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {supplier.company_name}
                                </h5>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {supplier.confidence_score ? `${(supplier.confidence_score * 100).toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>
                              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {supplier.email && (
                                  <div className="flex items-center space-x-1">
                                    <EnvelopeIcon className="h-3 w-3" />
                                    <span>{supplier.email}</span>
                                  </div>
                                )}
                                {supplier.website && (
                                  <div className="flex items-center space-x-1">
                                    <GlobeAltIcon className="h-3 w-3" />
                                    <span>{supplier.website}</span>
                                  </div>
                                )}
                                {supplier.phone && (
                                  <div className="flex items-center space-x-1">
                                    <PhoneIcon className="h-3 w-3" />
                                    <span>{supplier.phone}</span>
                                  </div>
                                )}
                                {supplier.price && (
                                  <div className="flex items-center space-x-1">
                                    <CurrencyDollarIcon className="h-3 w-3" />
                                    <span>{supplier.price} {supplier.currency || 'RUB'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {selectedRequest.status === 'processing' ? 'Поиск в процессе...' : 'Поставщики не найдены'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка поставщиков */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {supplierGroups.length > 0 ? (
            <div className="space-y-4">
              {supplierGroups.map((group, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {group.supplier.company_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {group.total_articles} артикулов
                            {group.avg_price && ` • Средняя цена: ${formatPrice(group.avg_price)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {group.supplier.email_validated && (
                          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-xs">Email проверен</span>
                          </div>
                        )}
                        {group.supplier.website_validated && (
                          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-xs">Сайт проверен</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Контактная информация */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {group.supplier.email && (
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{group.supplier.email}</p>
                          </div>
                        </div>
                      )}
                      {group.supplier.phone && (
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Телефон</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{group.supplier.phone}</p>
                          </div>
                        </div>
                      )}
                      {group.supplier.website && (
                        <div className="flex items-center space-x-2">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Сайт</p>
                            <a 
                              href={group.supplier.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {group.supplier.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Артикулы */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        Доступные артикулы ({group.articles.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.articles.map((article, articleIndex) => (
                          <div key={articleIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {article.article_name}
                              </h5>
                              {article.price && (
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  {formatPrice(article.price, article.currency)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Код: {article.article_code}
                            </p>
                            {article.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                                {article.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                              <span>{article.unit}</span>
                              {article.min_order_quantity && (
                                <span>Мин. заказ: {article.min_order_quantity}</span>
                              )}
                            </div>
                            {article.availability && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {article.availability}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет данных о поставщиках
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Выберите завершенный запрос поиска для просмотра поставщиков
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Модальное окно с подробной информацией по артикулу */}
      <ArticleDetailsModal
        isOpen={isModalOpen}
        onClose={closeArticleModal}
        articleCode={selectedArticleCode}
        results={modalResults}
        onRetrySearch={retrySearchForArticle}
        isSearching={isSearching}
      />
    </div>
  )
}
