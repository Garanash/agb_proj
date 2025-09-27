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
import ExcelDataTable from '@/components/ExcelDataTable'

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

interface SearchResult {
  id: number
  name: string
  agb_article: string
  bl_article?: string
  code_1c?: string
  match_confidence?: number
  packaging?: number
  unit?: string
  bl_description?: string
}

interface ExcelRow {
  id: string
  наименование: string
  запрашиваемый_артикул: string
  количество: number
  единица_измерения: string
  наш_артикул?: string
  артикул_bl?: string
  номер_1с?: string
  стоимость?: number
  статус_сопоставления?: 'matched' | 'unmatched' | 'pending'
  уверенность?: number
  варианты_подбора?: Array<{
    наименование: string
    наш_артикул: string
    артикул_bl?: string
    номер_1с?: string
    уверенность: number
  }>
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
  const [activeTab, setActiveTab] = useState<'matching' | 'results' | 'our_database' | 'ai_matching' | 'excel_matching' | 'found_matches'>('excel_matching')
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const [contractorName, setContractorName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [ourDatabase, setOurDatabase] = useState<any[]>([])
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
  const [showCreateMappingModal, setShowCreateMappingModal] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [createMappingForm, setCreateMappingForm] = useState({
    contractor_article: '',
    contractor_description: '',
    agb_article: '',
    agb_description: '',
    bl_article: '',
    bl_description: '',
    packaging_factor: 1,
    unit: 'шт',
    nomenclature_id: null as number | null,
    search_query: '',
    search_type: 'article' // article, name, code
  })
  
  // Новое состояние для Excel данных - пустые строки для заполнения
  const [excelData, setExcelData] = useState<ExcelRow[]>([
    {
      id: 'empty_1',
      наименование: '',
      запрашиваемый_артикул: '',
      количество: 1,
      единица_измерения: 'шт',
      наш_артикул: '',
      артикул_bl: '',
      номер_1с: '',
      стоимость: 0,
      статус_сопоставления: 'pending',
      уверенность: 0
    }
  ])
  const [isProcessingExcel, setIsProcessingExcel] = useState(false)
  const [isAutoMatching, setIsAutoMatching] = useState(false)
  const [isSavingExcel, setIsSavingExcel] = useState(false)
  const [savedVariants, setSavedVariants] = useState<{[key: string]: number}>({})
  const [foundMatches, setFoundMatches] = useState<any[]>([])
  const [loadingFoundMatches, setLoadingFoundMatches] = useState(false)

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
        loadSavedVariants()
        loadFoundMatches()
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
        console.log('Загружены заявки:', data)
        setRequests(data.data || [])
      } else {
        console.error('Ошибка загрузки заявок:', response.status, response.statusText)
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
        setOurDatabase(data.data || [])
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

  const handleDeleteItem = (item: any) => {
    if (!item.mapping_id) {
      setSuccessMessage('Нельзя удалить элемент без ID сопоставления')
      setShowSuccessModal(true)
      return
    }

    if (!token) {
      setSuccessMessage('Ошибка: Необходима авторизация для удаления сопоставлений')
      setShowSuccessModal(true)
      return
    }

    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    // Проверяем наличие токена
    if (!token) {
      setSuccessMessage('Ошибка: Необходима авторизация для удаления сопоставлений')
      setShowSuccessModal(true)
      setShowDeleteModal(false)
      setItemToDelete(null)
      return
    }

    try {
      console.log('Удаляем сопоставление с ID:', itemToDelete.mapping_id)
      console.log('Используем токен:', token ? 'есть' : 'нет')
      
      const response = await fetch(`http://localhost:8000/api/v1/article-matching/mappings/${itemToDelete.mapping_id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Ответ сервера:', response.status, response.statusText)

      if (response.ok) {
        // Удаляем элемент из локального состояния по ID элемента
        console.log('Удаляем элемент с ID:', itemToDelete.id, 'из локального состояния')
        setSuccessMessage('Сопоставление успешно удалено')
        setShowSuccessModal(true)
      } else {
        let errorMessage = 'Неизвестная ошибка'
        try {
          const error = await response.json()
          errorMessage = error.detail || error.message || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        console.error('Ошибка удаления:', errorMessage)
        setSuccessMessage(`Ошибка при удалении: ${errorMessage}`)
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Ошибка при удалении сопоставления:', error)
      setSuccessMessage(`Ошибка при удалении сопоставления: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setShowSuccessModal(true)
    } finally {
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
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
        cancelFoundEdit()
      } else {
        console.error('Ошибка при сохранении найденного элемента')
      }
    } catch (error) {
      console.error('Ошибка при сохранении найденного элемента:', error)
    }
  }

  const openCreateMappingModal = () => {
    setCreateMappingForm({
      contractor_article: '',
      contractor_description: '',
      agb_article: '',
      agb_description: '',
      bl_article: '',
      bl_description: '',
      packaging_factor: 1,
      unit: 'шт',
      nomenclature_id: null,
      search_query: '',
      search_type: 'article'
    })
    setShowCreateMappingModal(true)
  }

  const closeCreateMappingModal = () => {
    setShowCreateMappingModal(false)
    setCreateMappingForm({
      contractor_article: '',
      contractor_description: '',
      agb_article: '',
      agb_description: '',
      bl_article: '',
      bl_description: '',
      packaging_factor: 1,
      unit: 'шт',
      nomenclature_id: null,
      search_query: '',
      search_type: 'article'
    })
  }

  const handleSearch = async () => {
    if (!createMappingForm.search_query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: createMappingForm.search_query,
          search_type: createMappingForm.search_type
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.matches || []);
      } else {
        const error = await response.json();
        alert(`Ошибка поиска: ${error.detail || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      alert('Ошибка при выполнении поиска');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    setCreateMappingForm(prev => ({
      ...prev,
      agb_article: result.agb_article || '',
      agb_description: result.name || '',
      bl_article: result.bl_article || '',
      bl_description: result.bl_description || '',
      packaging_factor: result.packaging || 1,
      unit: result.unit || 'шт',
      nomenclature_id: result.id || null
    }));
  };

  const saveCreateMapping = async () => {
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/mappings/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createMappingForm)
      })

      if (response.ok) {
        const newMapping = await response.json()
        // Обновляем список найденных элементов
        closeCreateMappingModal()
        alert('Сопоставление успешно создано!')
      } else {
        const errorData = await response.json()
        alert(`Ошибка при создании сопоставления: ${errorData.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка при создании сопоставления:', error)
      alert('Ошибка при создании сопоставления')
    }
  }

  // Функции для работы с Excel данными
  const handleExcelDataChange = (data: ExcelRow[]) => {
    setExcelData(data)
  }

  const handleAutoMatch = async () => {
    if (excelData.length === 0) {
      alert('Нет данных для сопоставления')
      return
    }

    if (!token) {
      alert('Необходима авторизация для выполнения сопоставления')
      return
    }

    setIsAutoMatching(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/auto-match-excel/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: excelData })
      })

      if (response.ok) {
        const result = await response.json()
        setExcelData(result.matched_data || excelData)
        
        const matchedCount = result.matched_data?.filter((row: ExcelRow) => row.статус_сопоставления === 'matched').length || 0
        alert(`Сопоставление завершено! Сопоставлено ${matchedCount} из ${excelData.length} позиций.`)
      } else {
        const error = await response.json()
        alert(`Ошибка сопоставления: ${error.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка сопоставления:', error)
      alert('Ошибка сопоставления')
    } finally {
      setIsAutoMatching(false)
    }
  }

  const handleSaveExcelResults = async () => {
    if (excelData.length === 0) {
      alert('Нет данных для сохранения')
      return
    }

    if (!token) {
      alert('Необходима авторизация для сохранения')
      return
    }

    setIsSavingExcel(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/save-excel-results/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: excelData })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Результаты успешно сохранены! Сохранено ${result.saved_count} записей.`)
      } else {
        const error = await response.json()
        alert(`Ошибка сохранения: ${error.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert('Ошибка сохранения результатов')
    } finally {
      setIsSavingExcel(false)
    }
  }

  const loadSavedVariants = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/saved-variants/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setSavedVariants(result.saved_variants || {})
      }
    } catch (error) {
      console.error('Ошибка при загрузке сохраненных вариантов:', error)
    }
  }

  const loadFoundMatches = async () => {
    try {
      setLoadingFoundMatches(true)
      const response = await fetch('http://localhost:8000/api/v1/article-matching/found-matches/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setFoundMatches(result.matches || [])
      }
    } catch (error) {
      console.error('Ошибка при загрузке найденных сопоставлений:', error)
    } finally {
      setLoadingFoundMatches(false)
    }
  }

  const saveVariantSelection = async (rowId: string, variantIndex: number) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/save-variant-selection/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ row_id: rowId, variant_index: variantIndex })
      })

      if (response.ok) {
        setSavedVariants(prev => ({
          ...prev,
          [rowId]: variantIndex
        }))
      }
    } catch (error) {
      console.error('Ошибка при сохранении выбранного варианта:', error)
    }
  }

  const deleteFoundMatch = async (matchId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/article-matching/found-matches/${matchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setFoundMatches(prev => prev.filter(match => match.id !== matchId))
      }
    } catch (error) {
      console.error('Ошибка при удалении сопоставления:', error)
    }
  }

  const saveConfirmedMatch = async (rowData: ExcelRow, variant: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/article-matching/save-found-match/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          search_name: rowData.наименование,
          search_article: rowData.запрашиваемый_артикул,
          quantity: rowData.количество,
          unit: rowData.единица_измерения,
          matched_name: variant.наименование,
          matched_article: variant.наш_артикул,
          bl_article: variant.артикул_bl,
          article_1c: variant.номер_1с,
          cost: rowData.стоимость,
          confidence: variant.уверенность,
          match_type: variant.тип_совпадения || 'user_confirmed',
          is_auto_confirmed: false,
          is_user_confirmed: true
        })
      })

      if (response.ok) {
        // Обновляем список найденных сопоставлений
        loadFoundMatches()
      }
    } catch (error) {
      console.error('Ошибка при сохранении подтвержденного сопоставления:', error)
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
            <p className="text-gray-600 dark:text-gray-300 mt-1">Интеллектуальное сопоставление артикулов контрагентов с базой данных АГБ</p>
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
              onClick={() => setActiveTab('excel_matching')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'excel_matching'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Excel сопоставление
            </button>
            <button
              onClick={() => setActiveTab('found_matches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'found_matches'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Найденные
            </button>
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
              onClick={() => setActiveTab('ai_matching')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai_matching'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              ИИ сопоставление
            </button>
          </nav>
        </div>


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
                  <p className="text-gray-600 dark:text-gray-400">Выполняется ИИ сопоставление...</p>
                </div>
              )}
            </div>

            {/* Результаты сопоставления */}
            {matchingSummary && matchingSummary.results && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Результаты сопоставления</h2>
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
                  <p className="text-gray-600 dark:text-gray-400">Нет данных для отображения</p>
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
              <div className="h-[600px]">
                <AIMatchingChat />
              </div>
            </div>
          </div>
        )}

        {/* Excel сопоставление */}
        {activeTab === 'excel_matching' && (
          <div className="space-y-6">
            {/* Таблица с данными */}
              <ExcelDataTable
                data={excelData}
                onDataChange={handleExcelDataChange}
                onAutoMatch={handleAutoMatch}
                onSave={handleSaveExcelResults}
                isMatching={isAutoMatching}
                isSaving={isSavingExcel}
                savedVariants={savedVariants}
                onSaveVariant={saveVariantSelection}
                onSaveConfirmedMatch={saveConfirmedMatch}
              />

          </div>
        )}

        {/* Модальное окно для создания сопоставления */}
        {showCreateMappingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Создание нового сопоставления
                  </h3>
                  <button
                    onClick={closeCreateMappingModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Поисковая форма */}
                <div className="mb-6 space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                    Поиск номенклатуры
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Поисковый запрос
                      </label>
                      <input
                        type="text"
                        value={createMappingForm.search_query}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, search_query: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Введите артикул, наименование или код для поиска"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Тип поиска
                      </label>
                      <select
                        value={createMappingForm.search_type}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, search_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      >
                        <option value="article">По артикулу</option>
                        <option value="name">По наименованию</option>
                        <option value="code">По коду 1С</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSearch()}
                      className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                      <span>Найти</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Левая колонка - данные контрагента */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                      Данные контрагента
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Артикул контрагента *
                      </label>
                      <input
                        type="text"
                        value={createMappingForm.contractor_article}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, contractor_article: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Введите артикул контрагента"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Описание контрагента *
                      </label>
                      <textarea
                        value={createMappingForm.contractor_description}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, contractor_description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Введите описание товара контрагента"
                      />
                    </div>
                  </div>

                  {/* Правая колонка - данные АГБ */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                      Данные АГБ
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Артикул АГБ *
                      </label>
                      <input
                        type="text"
                        value={createMappingForm.agb_article}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, agb_article: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Введите артикул АГБ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Описание АГБ *
                      </label>
                      <textarea
                        value={createMappingForm.agb_description}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, agb_description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Введите описание товара АГБ"
                      />
                    </div>
                  </div>
                </div>

                {/* Индикатор загрузки */}
                {isSearching && (
                  <div className="mt-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Выполняется поиск...</p>
                  </div>
                )}

                {/* Результаты поиска */}
                {!isSearching && searchResults && searchResults.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                      Результаты поиска
                    </h4>
                    <div className="mt-4 space-y-4">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => selectSearchResult(result)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{result.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Артикул АГБ: {result.agb_article}</p>
                              {result.bl_article && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Артикул BL: {result.bl_article}</p>
                              )}
                              {result.code_1c && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Код 1С: {result.code_1c}</p>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {result.match_confidence && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  result.match_confidence >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  result.match_confidence >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {result.match_confidence}% совпадение
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Дополнительные поля */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                    Дополнительные параметры
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Артикул BL
                      </label>
                      <input
                        type="text"
                        value={createMappingForm.bl_article}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, bl_article: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Артикул BL (необязательно)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Описание BL
                      </label>
                      <input
                        type="text"
                        value={createMappingForm.bl_description}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, bl_description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Описание BL (необязательно)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Коэффициент фасовки
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={createMappingForm.packaging_factor}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, packaging_factor: parseFloat(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Единица измерения
                      </label>
                      <select
                        value={createMappingForm.unit}
                        onChange={(e) => setCreateMappingForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      >
                        <option value="шт">шт</option>
                        <option value="кг">кг</option>
                        <option value="л">л</option>
                        <option value="м">м</option>
                        <option value="м²">м²</option>
                        <option value="м³">м³</option>
                        <option value="упак">упак</option>
                        <option value="компл">компл</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={closeCreateMappingModal}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={saveCreateMapping}
                    disabled={!createMappingForm.contractor_article || !createMappingForm.contractor_description || !createMappingForm.agb_article || !createMappingForm.agb_description}
                    className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Создать сопоставление
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно подтверждения удаления */}
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Подтверждение удаления
                  </h3>
                  <button
                    onClick={cancelDelete}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Вы уверены, что хотите удалить это сопоставление?
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="font-medium mb-2">Детали сопоставления:</div>
                      <div>Артикул BL: <span className="font-medium">{itemToDelete.bl_article || '-'}</span></div>
                      <div>Артикул поиска: <span className="font-medium">{itemToDelete.search_article || '-'}</span></div>
                      <div>Наш артикул: <span className="font-medium">{itemToDelete.our_article || '-'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно успешного выполнения */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Уведомление
                  </h3>
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    {successMessage}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    ОК
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Найденные сопоставления */}
        {activeTab === 'found_matches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Найденные сопоставления
              </h2>
              <button
                onClick={loadFoundMatches}
                disabled={loadingFoundMatches}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loadingFoundMatches ? 'Загрузка...' : 'Обновить'}
              </button>
            </div>

            {loadingFoundMatches ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : foundMatches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Найденные сопоставления отсутствуют</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Поисковый запрос
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Найденное соответствие
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Артикулы
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Уверенность
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {foundMatches.map((match) => (
                        <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {match.search_name}
                              </div>
                              {match.search_article && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Арт: {match.search_article}
                                </div>
                              )}
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {match.quantity} {match.unit}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {match.matched_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <div>АГБ: {match.matched_article || '—'}</div>
                              <div>BL: {match.bl_article || '—'}</div>
                              <div>1С: {match.article_1c || '—'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              match.confidence >= 90 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : match.confidence >= 70
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {match.confidence}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              {match.is_auto_confirmed && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Авто
                                </span>
                              )}
                              {match.is_user_confirmed && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Подтверждено
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {match.match_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(match.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                if (confirm('Удалить это сопоставление?')) {
                                  deleteFoundMatch(match.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
