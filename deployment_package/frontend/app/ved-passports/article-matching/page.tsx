'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/utils/api'
import { 
  DocumentArrowUpIcon, 
  MagnifyingGlassIcon, 
  TableCellsIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface ContractorRequest {
  id: number
  request_number: string
  contractor_name: string
  request_date: string
  status: string
  total_items: number
  matched_items: number
  created_at: string
  items?: ContractorRequestItem[]
}

interface ContractorRequestItem {
  id: number
  line_number: number
  contractor_article: string
  description: string
  unit: string
  quantity: number
  category?: string
  matched_nomenclature_id?: number
  agb_article?: string
  bl_article?: string
  packaging_factor: number
  recalculated_quantity?: number
  match_confidence: number
  match_status: string
  matched_nomenclature?: {
    id: number
    name: string
    code_1c: string
    article: string
  }
}

interface MatchingSummary {
  total_items: number
  matched_items: number
  unmatched_items: number
  high_confidence_items: number
  medium_confidence_items: number
  low_confidence_items: number
  results: MatchingResult[]
}

interface MatchingResult {
  item_id: number
  contractor_article: string
  description: string
  matched: boolean
  agb_article?: string
  bl_article?: string
  packaging_factor?: number
  recalculated_quantity?: number
  match_confidence?: number
  nomenclature?: {
    id: number
    name: string
    code_1c: string
    article: string
  }
}

export default function ArticleMatchingPage() {
  const { user, token, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<ContractorRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ContractorRequest | null>(null)
  const [matchingSummary, setMatchingSummary] = useState<MatchingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [activeTab, setActiveTab] = useState<'requests' | 'matching' | 'results'>('requests')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'ved_passport' && user.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    loadRequests()
  }, [isAuthenticated, user, router])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl() + '/api/v1/article-matching/test-requests/', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Загружены заявки:', data)
        setRequests(data.data || [])
      } else {
        console.error('Ошибка загрузки заявок:', response.status, response.statusText)
        setRequests([])
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contractor_name', 'Контрагент')

      const response = await fetch(getApiUrl() + '/api/v1/article-matching/step-upload/', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Результат загрузки:', result)
        
        if (result.success) {
          const newRequest = {
            id: result.request_id,
            request_number: result.request_number,
            contractor_name: result.contractor_name,
            total_items: result.total_items || 0,
            matched_items: 0,
            status: result.status,
            request_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
          
          setRequests(prev => [newRequest, ...prev])
          setSelectedRequest(newRequest)
          setActiveTab('matching')
          alert('Файл успешно загружен!')
        } else {
          alert(`Ошибка загрузки: ${result.detail || 'Неизвестная ошибка'}`)
        }
      } else {
        const error = await response.json()
        alert(`Ошибка загрузки: ${error.detail}`)
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error)
      alert('Ошибка загрузки файла')
    } finally {
      setUploading(false)
    }
  }

  const handleMatchArticles = async (requestId: number) => {
    setMatching(true)
    try {
      const response = await fetch(`getApiUrl() + '/api/v1/article-matching/test-match/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const summary = await response.json()
        console.log('Результат сопоставления:', summary)
        setMatchingSummary(summary)
        setActiveTab('results')
        loadRequests() // Обновляем список заявок
      } else {
        const error = await response.json()
        alert(`Ошибка сопоставления: ${error.detail}`)
      }
    } catch (error) {
      console.error('Ошибка сопоставления:', error)
      alert('Ошибка сопоставления')
    } finally {
      setMatching(false)
    }
  }

  const handleExportResults = async (requestId: number) => {
    try {
      const response = await fetch(`getApiUrl() + '/api/v1/article-matching/requests/${requestId}/export/excel`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `matching_results_${requestId}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Ошибка экспорта')
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error)
      alert('Ошибка экспорта')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'matched': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'unmatched': return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'pending': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default: return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Сопоставление артикулов</h1>
            <p className="text-gray-600 mt-1">Загрузка и сопоставление заявок контрагентов с базой данных АГБ</p>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Назад
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Вкладки */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Заявки контрагентов
            </button>
            {selectedRequest && (
              <>
                <button
                  onClick={() => setActiveTab('matching')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'matching'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Сопоставление
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'results'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Результаты
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Заявки контрагентов */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Загрузка файла */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Загрузка заявки контрагента</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Выберите Excel файл с заявкой
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Поддерживаются файлы .xlsx, .xls
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </div>
                {uploading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Загрузка...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Список заявок */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Заявки контрагентов</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Номер заявки
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Контрагент
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Позиций
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сопоставлено
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата создания
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.request_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.contractor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.total_items}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.matched_items} / {request.total_items}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setActiveTab('matching')
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Открыть
                          </button>
                          {request.status === 'completed' && (
                            <button
                              onClick={() => handleExportResults(request.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Экспорт
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Сопоставление */}
        {activeTab === 'matching' && selectedRequest && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Сопоставление заявки {selectedRequest.request_number}
                </h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleMatchArticles(selectedRequest.id)}
                    disabled={matching}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{matching ? 'Сопоставление...' : 'Начать сопоставление'}</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedRequest.total_items}</div>
                  <div className="text-sm text-blue-800">Всего позиций</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedRequest.matched_items}</div>
                  <div className="text-sm text-green-800">Сопоставлено</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedRequest.total_items - selectedRequest.matched_items}
                  </div>
                  <div className="text-sm text-yellow-800">Требует внимания</div>
                </div>
              </div>

              {matching && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Выполняется ИИ сопоставление...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Результаты */}
        {activeTab === 'results' && matchingSummary && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Результаты сопоставления</h2>
                <button
                  onClick={() => selectedRequest && handleExportResults(selectedRequest.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Экспорт в Excel</span>
                </button>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{matchingSummary.total_items}</div>
                  <div className="text-sm text-blue-800">Всего</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{matchingSummary.matched_items}</div>
                  <div className="text-sm text-green-800">Сопоставлено</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{matchingSummary.unmatched_items}</div>
                  <div className="text-sm text-red-800">Не найдено</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{matchingSummary.high_confidence_items}</div>
                  <div className="text-sm text-yellow-800">Высокая уверенность</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{matchingSummary.medium_confidence_items}</div>
                  <div className="text-sm text-orange-800">Средняя уверенность</div>
                </div>
              </div>

              {/* Таблица результатов */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Артикул контрагента
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Артикул АГБ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Уверенность
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пересчитанное кол-во
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matchingSummary.results.map((result) => (
                      <tr key={result.item_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.contractor_article}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {result.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getMatchStatusIcon(result.matched ? 'matched' : 'unmatched')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.agb_article || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {result.match_confidence ? (
                            <span className={getConfidenceColor(result.match_confidence)}>
                              {result.match_confidence}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.recalculated_quantity || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
