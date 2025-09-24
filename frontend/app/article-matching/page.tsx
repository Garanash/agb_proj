'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { 
  DocumentArrowUpIcon, 
  MagnifyingGlassIcon, 
  TableCellsIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import AIMatchingChat from '@/components/AIMatchingChat'

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
  const [activeTab, setActiveTab] = useState<'requests' | 'matching' | 'results' | 'our_database' | 'found_items' | 'ai_matching'>('requests')
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const [contractorName, setContractorName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [ourDatabase, setOurDatabase] = useState<any[]>([])
  const [foundItems, setFoundItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    agb_article: '',
    name: '',
    code_1c: '',
    bl_article: '',
    packaging: '',
    unit: '',
    is_active: true
  })
  const [editingFoundItem, setEditingFoundItem] = useState<any>(null)
  const [showFoundEditModal, setShowFoundEditModal] = useState(false)
  const [foundEditForm, setFoundEditForm] = useState({
    bl_article: '',
    search_article: '',
    our_article: '',
    ut_number: '',
    found_data: '',
    match_confidence: 0,
    packaging_factor: 0,
    recalculated_quantity: 0
  })

  useEffect(() => {
    console.log('=== useEffect вызван ===')
    console.log('isAuthenticated:', isAuthenticated)
    console.log('user:', user)
    console.log('token:', token ? 'есть' : 'нет')
    
    if (!isAuthenticated) {
      console.log('Не аутентифицирован, перенаправляем на логин')
      router.push('/login')
      return
    }

    if (user && user.role !== 'ved_passport' && user.role !== 'admin') {
      console.log('Нет прав доступа, перенаправляем на dashboard')
      router.push('/dashboard')
      return
    }

    console.log('Загружаем данные...')
    loadRequests()
    loadOurDatabase()
    loadFoundItems()
  }, [isAuthenticated, user, router])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/test-requests/', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.data || [])
      } else {
        console.error('Ошибка загрузки заявок')
        setRequests([]) // Устанавливаем пустой массив если нет данных
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
      setRequests([]) // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false)
    }
  }

  const loadOurDatabase = async () => {
    console.log('=== loadOurDatabase вызвана ===')
    console.log('Токен:', token ? 'есть' : 'нет')
    console.log('isAuthenticated:', isAuthenticated)
    console.log('user:', user)
    
    // Временно используем тестовый endpoint без аутентификации
    console.log('Загружаем нашу базу данных (тестовый endpoint)...')
    try {
      const url = 'http://localhost:8000/api/v1/article-matching/test-our-database/'
      console.log('URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Ответ от сервера:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Получены данные нашей базы:', data.count, 'элементов')
        console.log('Первые 3 элемента:', data.data.slice(0, 3))
        // Преобразуем данные в нужный формат
        setOurDatabase(data.data)
      } else {
        const errorData = await response.json()
        console.error('Ошибка загрузки нашей базы:', errorData)
        setOurDatabase([])
      }
    } catch (error) {
      console.error('Ошибка загрузки нашей базы:', error)
      setOurDatabase([])
    }
  }

  const loadFoundItems = async () => {
    console.log('=== loadFoundItems вызвана ===')
    
    // Временно используем тестовый endpoint без аутентификации
    console.log('Загружаем найденные элементы (тестовый endpoint)...')
    try {
      const url = 'http://localhost:8000/api/v1/article-matching/test-found-items/'
      console.log('URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Ответ от сервера (найденные):', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Получены найденные элементы:', data.count, 'элементов')
        console.log('Первые 3 элемента:', data.data.slice(0, 3))
        setFoundItems(data.data)
      } else {
        const errorData = await response.json()
        console.error('Ошибка загрузки найденных элементов:', errorData)
        setFoundItems([])
      }
    } catch (error) {
      console.error('Ошибка загрузки найденных элементов:', error)
      setFoundItems([])
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Сохраняем выбранный файл
    setSelectedFile(file)

    // Валидация названия контрагента
    if (!contractorName.trim()) {
      alert('Пожалуйста, введите название контрагента перед загрузкой файла')
      event.target.value = '' // Очищаем input
      setSelectedFile(null) // Очищаем выбранный файл
      return
    }

    // Валидация типа файла
    const allowedTypes = ['.xlsx', '.xls']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      alert('Пожалуйста, выберите файл Excel (.xlsx или .xls)')
      event.target.value = '' // Очищаем input
      return
    }

    // Валидация размера файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('Размер файла не должен превышать 10MB')
      event.target.value = '' // Очищаем input
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contractor_name', contractorName.trim())

      const response = await fetch('http://localhost:8000/api/v1/article-matching/step-upload/', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          // Создаем объект заявки для отображения
          const newRequest = {
            id: result.request_id,
            request_number: result.request_number,
            contractor_name: result.contractor_name,
            total_items: result.total_items || 0,
            matched_items: 0, // Показываем 0, так как сопоставление еще в процессе
            status: result.status,
            request_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
          
          setRequests(prev => [newRequest, ...prev])
          setSelectedRequest(newRequest)
          setActiveTab('matching') // Переключаемся на вкладку сопоставления
          
          // Показываем детальное сообщение об успехе
          const successMessage = `✅ Файл успешно загружен!\n\n📊 Статистика обработки:\n• Обработано строк: ${result.rows_processed}\n• Найдено артикулов: ${result.articles_found}\n• Всего элементов: ${result.total_items}\n• Тип файла: ${result.file_type}\n\n🔄 Сопоставление выполняется в фоне...`
          alert(successMessage)
          
          // Очищаем input файла и выбранный файл
          event.target.value = ''
          setSelectedFile(null)
          
          // Обновляем найденные элементы через некоторое время
          setTimeout(() => {
            loadFoundItems()
          }, 5000)
        } else {
          const error = await response.json()
          alert(`❌ Ошибка при загрузке файла: ${error.detail || 'Неизвестная ошибка'}`)
        }
      } else {
        const error = await response.json()
        alert(`❌ Ошибка при загрузке файла: ${error.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error: any) {
      console.error('Ошибка загрузки файла:', error)
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert('Ошибка соединения с сервером. Проверьте, что backend запущен.')
      } else {
        alert(`Ошибка загрузки файла: ${error.message}`)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return

    setUploading(true)
    try {
      if (!contractorName.trim()) {
        alert('Пожалуйста, введите название контрагента')
        setUploading(false)
        return
      }
      
      const response = await fetch('http://localhost:8000/api/v1/article-matching/test-upload-text/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: textInput,
          contractor_name: contractorName.trim()
        })
      })

      if (response.ok) {
        const result = await response.json()
        const newRequest = result.request
        const matchingResults = result.matching_results
        
        setRequests(prev => [newRequest, ...prev])
        setSelectedRequest(newRequest)
        setMatchingSummary(matchingResults)
        setActiveTab('results')
        setTextInput('')
        
        // Обновляем найденные элементы
        await loadFoundItems()
        
        alert(`Текст успешно обработан! Найдено ${matchingResults.matched_items} из ${matchingResults.total_items} позиций.`)
      } else {
        const error = await response.json()
        alert(`Ошибка обработки текста: ${error.detail}`)
      }
    } catch (error) {
      console.error('Ошибка обработки текста:', error)
      alert('Ошибка обработки текста')
    } finally {
      setUploading(false)
    }
  }

  const handleMatchArticles = async (requestId: number) => {
    if (!token) return

    setMatching(true)
    try {
      const response = await fetch(`http://localhost:8000/api/v1/article-matching/test-match/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const summary = await response.json()
        setMatchingSummary(summary)
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
    if (!token) return

    try {
      const response = await fetch(`/api/v1/article-matching/requests/${requestId}/export/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  const handleItemClick = (item: any) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedItem(null)
  }

  const startEdit = (item: any) => {
    setEditingItem(item)
    setEditForm({
      agb_article: item.agb_article || '',
      name: item.name || '',
      code_1c: item.code_1c || '',
      bl_article: item.bl_article || '',
      packaging: item.packaging || '',
      unit: item.unit || 'шт',
      is_active: item.is_active !== false
    })
    setShowEditModal(true)
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setShowEditModal(false)
    setEditForm({
      agb_article: '',
      name: '',
      code_1c: '',
      bl_article: '',
      packaging: '',
      unit: '',
      is_active: true
    })
  }

  const saveEdit = async () => {
    if (!editingItem || !token) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/article-matching/nomenclature/${editingItem.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        // Обновляем локальное состояние
        setOurDatabase(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...editForm }
            : item
        ))
        cancelEdit()
      } else {
        console.error('Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
    }
  }

  const startFoundEdit = (item: any) => {
    setEditingFoundItem(item)
    setFoundEditForm({
      bl_article: item.bl_article || '',
      search_article: item.search_article || '',
      our_article: item.our_article || '',
      ut_number: item.ut_number || '',
      found_data: item.found_data || '',
      match_confidence: item.match_confidence || 0,
      packaging_factor: item.packaging_factor || 0,
      recalculated_quantity: item.recalculated_quantity || 0
    })
    setShowFoundEditModal(true)
  }

  const cancelFoundEdit = () => {
    setEditingFoundItem(null)
    setShowFoundEditModal(false)
    setFoundEditForm({
      bl_article: '',
      search_article: '',
      our_article: '',
      ut_number: '',
      found_data: '',
      match_confidence: 0,
      packaging_factor: 0,
      recalculated_quantity: 0
    })
  }

  const saveFoundEdit = async () => {
    if (!editingFoundItem || !token) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/article-matching/mapping/${editingFoundItem.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(foundEditForm)
      })

      if (response.ok) {
        // Обновляем локальное состояние
        setFoundItems(prev => prev.map(item => 
          item.id === editingFoundItem.id 
            ? { ...item, ...foundEditForm }
            : item
        ))
        cancelFoundEdit()
      } else {
        console.error('Ошибка при сохранении найденного элемента')
      }
    } catch (error) {
      console.error('Ошибка при сохранении найденного элемента:', error)
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Сопоставление артикулов</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Загрузка и сопоставление заявок контрагентов с базой данных АГБ</p>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
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
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Сопоставление и результаты
                </button>
              </>
            )}
                <button
              onClick={() => setActiveTab('our_database')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'our_database'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Наша база
                </button>
            <button
              onClick={() => setActiveTab('found_items')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'found_items'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Найденные
            </button>
            <button
              onClick={() => setActiveTab('ai_matching')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai_matching'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              АИ сопоставление
            </button>
          </nav>
        </div>

        {/* Заявки контрагентов */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Загрузка заявки */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Загрузка заявки контрагента</h2>
              
              {/* Поле для названия контрагента */}
              <div className="mb-6">
                <label htmlFor="contractor-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название контрагента *
                </label>
                <input
                  id="contractor-name"
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="Введите название контрагента"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Это название будет использовано для создания номера заявки
                </p>
              </div>
              
              {/* Переключатель режима ввода */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => setInputMode('file')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      inputMode === 'file'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Excel файл
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      inputMode === 'text'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Текстовый ввод
                  </button>
                </div>
              </div>

              {/* Режим загрузки файла */}
              {inputMode === 'file' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                    <DocumentArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                    
                    {!contractorName.trim() ? (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                          Сначала введите название контрагента
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Название контрагента необходимо для создания номера заявки
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {selectedFile ? 'Файл выбран' : 'Готово к загрузке файла'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Контрагент: <span className="font-medium text-gray-700 dark:text-gray-300">{contractorName}</span>
                          </p>
                          {selectedFile && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-sm text-green-800 dark:text-green-300">
                                <span className="font-medium">Выбран файл:</span> {selectedFile.name}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Размер: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <label 
                          htmlFor="file-upload" 
                          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors ${
                            uploading 
                              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                              : 'bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 cursor-pointer shadow-sm hover:shadow-md'
                          }`}
                        >
                          <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                          {uploading ? 'Загрузка...' : selectedFile ? 'Выбрать другой файл' : 'Выберите Excel файл'}
                        </label>
                        
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Поддерживаются файлы .xlsx, .xls (максимум 10MB)
                        </p>
                      </div>
                    )}
                    
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploading || !contractorName.trim()}
                      className="sr-only"
                    />
                  </div>
                </div>
              )}

              {/* Режим текстового ввода */}
              {inputMode === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Введите текст заявки
                    </label>
                    <textarea
                      id="text-input"
                      rows={8}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Вставьте текст заявки из письма или документа..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Вставьте текст заявки из письма или документа. Система автоматически извлечет артикулы и описания.
                    </p>
              </div>
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || uploading}
                    className="w-full bg-purple-600 dark:bg-purple-700 text-white py-2 px-4 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? 'Обработка...' : 'Обработать текст'}
                  </button>
                </div>
              )}

              {uploading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Обработка...</p>
                </div>
              )}
            </div>

            {/* Список заявок */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Заявки контрагентов</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Номер заявки
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Контрагент
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Позиций
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Сопоставлено
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Дата создания
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {request.request_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {request.contractor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {request.total_items || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {request.matched_items || 0} / {request.total_items || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(request.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setActiveTab('matching')
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          >
                            Открыть
                          </button>
                          {request.status === 'completed' && (
                            <button
                              onClick={() => handleExportResults(request.id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
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

        {/* Сопоставление и результаты */}
        {activeTab === 'matching' && selectedRequest && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Сопоставление заявки {selectedRequest.request_number}
                </h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleMatchArticles(selectedRequest.id)}
                    disabled={matching}
                    className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{matching ? 'Сопоставление...' : 'Начать сопоставление'}</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedRequest.total_items || 0}</div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">Всего позиций</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedRequest.matched_items || 0}</div>
                  <div className="text-sm text-green-800 dark:text-green-300">Сопоставлено</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {(selectedRequest.total_items || 0) - (selectedRequest.matched_items || 0)}
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">Требует внимания</div>
                </div>
              </div>

              {matching && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Выполняется сопоставление артикулов...</p>
                </div>
              )}
            </div>

            {/* Результаты сопоставления */}
            {matchingSummary && matchingSummary.results && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Результаты сопоставления</h2>
                <button
                    onClick={() => loadFoundItems()}
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                    <span>Обновить</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{matchingSummary.total_items || 0}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">Всего</div>
                </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{matchingSummary.matched_items}</div>
                    <div className="text-sm text-green-800 dark:text-green-300">Сопоставлено</div>
                </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{matchingSummary.unmatched_items}</div>
                    <div className="text-sm text-red-800 dark:text-red-300">Не найдено</div>
                </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{matchingSummary.high_confidence_items}</div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">Высокая уверенность</div>
                </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{matchingSummary.medium_confidence_items}</div>
                    <div className="text-sm text-orange-800 dark:text-orange-300">Средняя уверенность</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Артикул контрагента
                      </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Описание
                      </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Артикул АГБ
                      </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Уверенность
                      </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Пересчитанное кол-во
                      </th>
                    </tr>
                  </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {(matchingSummary.results || []).length > 0 ? (matchingSummary.results || []).map((result) => (
                        <tr key={result.item_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {result.contractor_article}
                        </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {result.description}
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.agb_article ? (
                              result.agb_article
                            ) : (
                              <span className="text-red-500 dark:text-red-400 italic">
                                Не найдены варианты сопоставления
                              </span>
                            )}
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {result.match_confidence ? (
                            <span className={getConfidenceColor(result.match_confidence)}>
                              {result.match_confidence}%
                            </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                Нет совпадений
                              </span>
                            )}
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.recalculated_quantity ? (
                              result.recalculated_quantity
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                Н/Д
                              </span>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            Нет результатов для отображения
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Наша база */}
        {activeTab === 'our_database' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Наша база данных</h2>
                <button
                  onClick={loadOurDatabase}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Обновить</span>
                </button>
              </div>
              {ourDatabase.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Загрузка данных...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Артикул АГБ
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Название
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Код 1С
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Артикул BL
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Фасовка
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Ед.изм.
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {ourDatabase.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {item.agb_article}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.code_1c}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.bl_article || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.packaging || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.unit || 'шт'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEdit(item)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Редактировать"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleItemClick(item)}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                title="Подробнее"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Найденные элементы */}
        {activeTab === 'found_items' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Найденные элементы</h2>
                <button
                  onClick={loadFoundItems}
                  className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Обновить</span>
                </button>
              </div>
              {foundItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Загрузка данных...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Артикул BL
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Артикул поиска
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Наш артикул
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Найденные данные
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {foundItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {item.bl_article || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.search_article || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.our_article || '-'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {item.found_data || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startFoundEdit(item)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Редактировать"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleItemClick(item)}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                title="Подробнее"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Модальное окно */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Подробная информация
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  {Object.entries(selectedItem).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-1/3">
                        {key}:
                      </span>
                      <span className="text-gray-900 dark:text-white flex-1">
                        {String(value) || 'Не указано'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно для редактирования */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Редактирование номенклатуры
                  </h3>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Артикул АГБ
                    </label>
                    <input
                      type="text"
                      value={editForm.agb_article}
                      onChange={(e) => setEditForm(prev => ({ ...prev, agb_article: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Название
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Код 1С
                    </label>
                    <input
                      type="text"
                      value={editForm.code_1c}
                      onChange={(e) => setEditForm(prev => ({ ...prev, code_1c: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Артикул BL
                    </label>
                    <input
                      type="text"
                      value={editForm.bl_article}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bl_article: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Фасовка
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.packaging}
                      onChange={(e) => setEditForm(prev => ({ ...prev, packaging: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Единица измерения
                    </label>
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    >
                      <option value="шт">шт</option>
                      <option value="кг">кг</option>
                      <option value="л">л</option>
                      <option value="м">м</option>
                      <option value="м²">м²</option>
                      <option value="м³">м³</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Статус
                    </label>
                    <select
                      value={editForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    >
                      <option value="active">Активен</option>
                      <option value="inactive">Неактивен</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={saveEdit}
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно для редактирования найденных элементов */}
        {showFoundEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Редактирование найденного элемента
                  </h3>
                  <button
                    onClick={cancelFoundEdit}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Артикул BL
                    </label>
                    <input
                      type="text"
                      value={foundEditForm.bl_article}
                      onChange={(e) => setFoundEditForm(prev => ({ ...prev, bl_article: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Артикул поиска
                    </label>
                    <input
                      type="text"
                      value={foundEditForm.search_article}
                      onChange={(e) => setFoundEditForm(prev => ({ ...prev, search_article: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Наш артикул
                    </label>
                    <input
                      type="text"
                      value={foundEditForm.our_article}
                      onChange={(e) => setFoundEditForm(prev => ({ ...prev, our_article: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Номер из УТ
                    </label>
                    <input
                      type="text"
                      value={foundEditForm.ut_number}
                      onChange={(e) => setFoundEditForm(prev => ({ ...prev, ut_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Найденные данные
                    </label>
                    <textarea
                      value={foundEditForm.found_data}
                      onChange={(e) => setFoundEditForm(prev => ({ ...prev, found_data: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Уверенность (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={foundEditForm.match_confidence}
                        onChange={(e) => setFoundEditForm(prev => ({ ...prev, match_confidence: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Коэффициент фасовки
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={foundEditForm.packaging_factor}
                        onChange={(e) => setFoundEditForm(prev => ({ ...prev, packaging_factor: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Пересчитанное количество
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={foundEditForm.recalculated_quantity}
                        onChange={(e) => setFoundEditForm(prev => ({ ...prev, recalculated_quantity: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={cancelFoundEdit}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={saveFoundEdit}
                    className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* АИ сопоставление */}
        {activeTab === 'ai_matching' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ИИ-агент сопоставления артикулов</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Загрузите любой документ и получите автоматическое сопоставление с базой данных АГБ
                  </p>
                </div>
              </div>
              
              <div className="h-[600px]">
                <AIMatchingChat />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
