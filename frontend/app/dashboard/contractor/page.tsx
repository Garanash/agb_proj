'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/utils'

interface RepairRequest {
  id: number
  title: string
  description: string
  urgency: string
  status: string
  created_at: string
  equipment_type?: string
  equipment_brand?: string
  equipment_model?: string
  address?: string
  city?: string
  region?: string
  customer?: {
    company_name?: string
    contact_person?: string
  }
}

interface TelegramLink {
  telegram_bot_link: string
  instructions: string
}

// Функция для получения названия текущей вкладки
const getCurrentTabTitle = (tab: string) => {
  switch (tab) {
    case 'requests': return 'Доступные заявки'
    case 'archive': return 'Архив заявок'
    case 'profile': return 'Мой профиль'
    default: return 'Кабинет исполнителя'
  }
}

export default function ContractorDashboard() {
  const { user, token, logout, isAuthenticated } = useAuth()
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [archivedRequests, setArchivedRequests] = useState<RepairRequest[]>([])
  const [telegramLink, setTelegramLink] = useState<TelegramLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'requests' | 'archive' | 'profile'>('requests')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'contractor') {
      router.push('/dashboard')
      return
    }

    // Читаем параметр tab из URL
    const tabParam = searchParams.get('tab')
    if (tabParam === 'profile') {
      setActiveTab('profile')
    } else if (tabParam === 'archive') {
      setActiveTab('archive')
    } else {
      setActiveTab('requests')
    }

    loadRequests()
    loadArchivedRequests()
    loadTelegramLink()
  }, [isAuthenticated, user, router, searchParams])

  const loadRequests = async () => {
    if (!token) return

    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/repair-requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status >= 200 && response.status < 300) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadArchivedRequests = async () => {
    if (!token) return

    try {
      // Для демонстрации используем те же данные, но в реальном приложении
      // нужно добавить API endpoint для получения архивных заявок исполнителя
      const response: any = await fetch(`${getApiUrl()}/api/v1/repair-requests/?status=completed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status >= 200 && response.status < 300) {
        const data = await response.json()
        setArchivedRequests(data.filter((request: RepairRequest) =>
          request.status === 'completed' || request.status === 'cancelled'
        ))
      }
    } catch (error) {
      console.error('Ошибка загрузки архивных заявок:', error)
    }
  }

  const loadTelegramLink = async () => {
    if (!token) return

    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/contractors/telegram-link`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status >= 200 && response.status < 300) {
        const data = await response.json()
        setTelegramLink(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки ссылки на Telegram бота:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Доступна для отклика'
      case 'processing': return 'В обработке'
      case 'assigned': return 'Назначен исполнитель'
      case 'completed': return 'Завершена'
      case 'cancelled': return 'Отменена'
      default: return status
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'критическая': return 'bg-red-100 text-red-800'
      case 'высокая': return 'bg-orange-100 text-orange-800'
      case 'средне': return 'bg-yellow-100 text-yellow-800'
      case 'низкая': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isAuthenticated || !user || user.role !== 'contractor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Проверка доступа...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок страницы */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {getCurrentTabTitle(activeTab)}
          </h1>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="p-6">
        {/* Telegram бот информация */}
        {telegramLink && activeTab === 'requests' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🤖 Telegram бот
            </h3>
            <p className="text-blue-800 mb-2">
              Для получения уведомлений о новых заявках подключитесь к нашему Telegram боту:
            </p>
            <a
              href={telegramLink.telegram_bot_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Перейти к боту
            </a>
            <p className="text-sm text-blue-700 mt-2">{telegramLink.instructions}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Доступные заявки */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Доступные заявки</h2>
                  <button
                    onClick={loadRequests}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Обновить
                  </button>
                </div>

                {!requests || requests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка заявок...</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {requests.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {request.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Заявка #{request.id} • {new Date(request.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{request.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          {request.customer && (
                            <div>
                              <span className="font-medium text-gray-500">Заказчик:</span>
                              <p className="text-gray-900">{request.customer.company_name || request.customer.contact_person}</p>
                            </div>
                          )}
                          {request.equipment_type && (
                            <div>
                              <span className="font-medium text-gray-500">Оборудование:</span>
                              <p className="text-gray-900">{request.equipment_type}</p>
                            </div>
                          )}
                          {request.address && (
                            <div>
                              <span className="font-medium text-gray-500">Адрес:</span>
                              <p className="text-gray-900">{request.address}</p>
                            </div>
                          )}
                          {request.city && (
                            <div>
                              <span className="font-medium text-gray-500">Город:</span>
                              <p className="text-gray-900">{request.city}</p>
                            </div>
                          )}
                        </div>

                        {request.status === 'new' && (
                          <div className="flex justify-end">
                            <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors font-medium">
                              Откликнуться
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Архив заявок */}
            {activeTab === 'archive' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Архив заявок</h2>
                  <button
                    onClick={loadArchivedRequests}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Обновить
                  </button>
                </div>

                {!archivedRequests || archivedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка архивных заявок...</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {archivedRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {request.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Заявка #{request.id} • {new Date(request.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{request.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          {request.customer && (
                            <div>
                              <span className="font-medium text-gray-500">Заказчик:</span>
                              <p className="text-gray-900">{request.customer.company_name || request.customer.contact_person}</p>
                            </div>
                          )}
                          {request.equipment_type && (
                            <div>
                              <span className="font-medium text-gray-500">Оборудование:</span>
                              <p className="text-gray-900">{request.equipment_type}</p>
                            </div>
                          )}
                          {request.address && (
                            <div>
                              <span className="font-medium text-gray-500">Адрес:</span>
                              <p className="text-gray-900">{request.address}</p>
                            </div>
                          )}
                          {request.city && (
                            <div>
                              <span className="font-medium text-gray-500">Город:</span>
                              <p className="text-gray-900">{request.city}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Мой профиль */}
            {activeTab === 'profile' && (
              <ContractorProfile />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Компонент профиля исполнителя
function ContractorProfile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    // Персональная информация
    last_name: '',
    first_name: '',
    patronymic: '',
    phone: '',
    email: '',
    // Профессиональная информация (массив)
    professional_info: [{
      specialization: '',
      experience_years: '',
      skills: '',
      description: ''
    }],
    // Образование (массив)
    education: [{
      institution: '',
      degree: '',
      field_of_study: '',
      graduation_year: '',
      description: ''
    }],
    // Банковские реквизиты
    bank_name: '',
    bank_account: '',
    bank_bik: '',
    // Дополнительная информация
    telegram_username: '',
    website: '',
    description: '',
    // Файлы
    profile_photo: null as File | null,
    portfolio_files: [] as File[],
    document_files: [] as File[]
  })

  const educationDegrees = [
    'Среднее профессиональное образование',
    'Бакалавр',
    'Специалист',
    'Магистр',
    'Кандидат наук',
    'Доктор наук',
    'Другое'
  ]

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    if (!token) return

    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/contractors/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status >= 200 && response.status < 300) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          // Персональная информация
          last_name: data.last_name || '',
          first_name: data.first_name || '',
          patronymic: data.patronymic || '',
          phone: data.phone || '',
          email: data.email || '',
          // Профессиональная информация (массив)
          professional_info: data.professional_info?.length > 0 ? data.professional_info : [{
            specialization: '',
            experience_years: '',
            skills: '',
            description: ''
          }],
          // Образование (массив)
          education: data.education?.length > 0 ? data.education : [{
            institution: '',
            degree: '',
            field_of_study: '',
            graduation_year: '',
            description: ''
          }],
          // Банковские реквизиты
          bank_name: data.bank_name || '',
          bank_account: data.bank_account || '',
          bank_bik: data.bank_bik || '',
          // Дополнительная информация
          telegram_username: data.telegram_username || '',
          website: data.website || '',
          description: data.general_description || '',
          // Файлы (инициализируем пустыми массивами)
          profile_photo: null,
          portfolio_files: [],
          document_files: []
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Функции для работы с массивами
  const addProfessionalInfo = () => {
    setFormData(prev => ({
      ...prev,
      professional_info: [...prev.professional_info, {
        specialization: '',
        experience_years: '',
        skills: '',
        description: ''
      }]
    }))
  }

  const removeProfessionalInfo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      professional_info: prev.professional_info.filter((_, i) => i !== index)
    }))
  }

  const updateProfessionalInfo = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      professional_info: prev.professional_info.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        field_of_study: '',
        graduation_year: '',
        description: ''
      }]
    }))
  }

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const updateEducation = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // Функции для работы с файлами
  const handleProfilePhotoChange = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('Размер фото не должен превышать 5МБ')
        return
      }
      setFormData(prev => ({ ...prev, profile_photo: file }))
    }
  }

  const handlePortfolioFilesChange = (e: any) => {
    const files = Array.from(e.target.files || []) as File[]
    const validFiles: File[] = files.filter((file: any) => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert(`Файл ${file.name} превышает лимит в 5МБ`)
        return false
      }
      return true
    })

    const totalSize = [...formData.portfolio_files, ...validFiles].reduce((sum: number, file: any) => sum + file.size, 0)
    if (totalSize > 200 * 1024 * 1024) { // 200MB
      alert('Общий размер файлов портфолио не должен превышать 200МБ')
      return
    }

    setFormData(prev => ({
      ...prev,
      portfolio_files: [...prev.portfolio_files, ...validFiles]
    }))
  }

  const handleDocumentFilesChange = (e: any) => {
    const files = Array.from(e.target.files || []) as File[]
    const validFiles: File[] = files.filter((file: any) => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert(`Файл ${file.name} превышает лимит в 5МБ`)
        return false
      }
      return true
    })

    const totalSize = [...formData.document_files, ...validFiles].reduce((sum: number, file: any) => sum + file.size, 0)
    if (totalSize > 200 * 1024 * 1024) { // 200MB
      alert('Общий размер документов не должен превышать 200МБ')
      return
    }

    setFormData(prev => ({
      ...prev,
      document_files: [...prev.document_files, ...validFiles]
    }))
  }

  const removePortfolioFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_files: prev.portfolio_files.filter((_, i) => i !== index)
    }))
  }

  const removeDocumentFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      document_files: prev.document_files.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      const formDataToSend = new FormData()

      // Добавляем основные данные
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('patronymic', formData.patronymic)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('telegram_username', formData.telegram_username)
      formDataToSend.append('website', formData.website)
      formDataToSend.append('general_description', formData.description)
      formDataToSend.append('bank_name', formData.bank_name)
      formDataToSend.append('bank_account', formData.bank_account)
      formDataToSend.append('bank_bik', formData.bank_bik)

      // Добавляем массивы
      formDataToSend.append('professional_info', JSON.stringify(formData.professional_info))
      formDataToSend.append('education', JSON.stringify(formData.education))

      // Добавляем файлы
      if (formData.profile_photo) {
        formDataToSend.append('profile_photo', formData.profile_photo)
      }

      formData.portfolio_files.forEach((file, index) => {
        formDataToSend.append(`portfolio_files`, file)
      })

      formData.document_files.forEach((file, index) => {
        formDataToSend.append(`document_files`, file)
      })

      const response: any = await fetch(`${getApiUrl()}/api/v1/contractors/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      if (response.status >= 200 && response.status < 300) {
        setEditing(false)
        setError('')
        loadProfile()
        // Показываем уведомление об успехе
        console.log('Профиль успешно обновлен!')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      setError('Произошла ошибка при подключении к серверу')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка профиля...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Мой профиль</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Редактировать
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {editing ? (
            <div className="max-w-6xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Персональная информация */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
                    Персональная информация
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Иванов"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Имя *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Иван"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Отчество
                      </label>
                      <input
                        type="text"
                        name="patronymic"
                        value={formData.patronymic}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Иванович"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Телефон *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Профессиональная информация */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
                    Профессиональная информация
                  </h3>

                  {formData.professional_info.map((info, index) => (
                    <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg relative">
                      {formData.professional_info.length > 1 && (
                        <button
                          type={"button" as const}
                          onClick={() => removeProfessionalInfo(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
                        >
                          ×
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Специализация *
                          </label>
                          <input
                            type="text"
                            value={info.specialization}
                            onChange={(e: any) => updateProfessionalInfo(index, 'specialization', e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Например: Электрик, механик"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Опыт работы (лет)
                          </label>
                          <input
                            type="number"
                            value={info.experience_years}
                            onChange={(e: any) => updateProfessionalInfo(index, 'experience_years', e.target.value)}
                            min="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="5"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Навыки и компетенции
                        </label>
                        <textarea
                          value={info.skills}
                            onChange={(e: any) => updateProfessionalInfo(index, 'skills', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
                          placeholder="Опишите ваши навыки, опыт работы с оборудованием, сертификаты и квалификацию"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Описание деятельности
                        </label>
                        <textarea
                          value={info.description}
                            onChange={(e: any) => updateProfessionalInfo(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
                          placeholder="Краткое описание вашей деятельности в этой специализации"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type={"button" as const}
                    onClick={addProfessionalInfo}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span className="mr-2">+</span>
                    Добавить специализацию
                  </button>
                </div>

                {/* Образование */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">3</span>
                    Образование
                  </h3>

                  {formData.education.map((edu, index) => (
                    <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg relative">
                      {formData.education.length > 1 && (
                        <button
                          type={"button" as const}
                          onClick={() => removeEducation(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
                        >
                          ×
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Учебное заведение *
                          </label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e: any) => updateEducation(index, 'institution', e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Например: МГУ им. М.В. Ломоносова"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Степень образования *
                          </label>
                          <select
                            value={edu.degree}
                            onChange={(e: any) => updateEducation(index, 'degree', e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Выберите степень</option>
                            {educationDegrees.map(degree => (
                              <option key={degree} value={degree}>{degree}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Специальность
                          </label>
                          <input
                            type="text"
                            value={edu.field_of_study}
                            onChange={(e: any) => updateEducation(index, 'field_of_study', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Например: Электротехника"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Год окончания
                          </label>
                          <input
                            type="number"
                            value={edu.graduation_year}
                            onChange={(e: any) => updateEducation(index, 'graduation_year', e.target.value)}
                            min="1950"
                            max={new Date().getFullYear() + 10}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="2020"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Дополнительная информация
                        </label>
                        <textarea
                          value={edu.description}
                          onChange={(e: any) => updateEducation(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
                          placeholder="Дополнительная информация об образовании, достижения, диплом с отличием и т.д."
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type={"button" as const}
                    onClick={addEducation}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span className="mr-2">+</span>
                    Добавить образование
                  </button>
                </div>

                {/* Фото профиля */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">4</span>
                    Фото профиля
                  </h3>

                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      {formData.profile_photo ? (
                        <img
                          src={URL.createObjectURL(formData.profile_photo)}
                          alt="Фото профиля"
                          className="w-24 h-24 rounded-full object-cover border-4 border-green-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule={"evenodd" as const} d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule={"evenodd" as const} />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <span className="sr-only">Выберите фото профиля</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        PNG, JPG до 5МБ. Рекомендуемый размер: 200x200px
                      </p>
                      {formData.profile_photo && (
                        <button
                          type={"button" as const}
                          onClick={() => setFormData(prev => ({ ...prev, profile_photo: null }))}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Удалить фото
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Файлы портфолио */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">5</span>
                    Портфолио и работы
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Добавить файлы портфолио
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        onChange={handlePortfolioFilesChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Изображения, PDF, документы. Каждый файл до 5МБ, общий размер до 200МБ
                      </p>
                    </div>

                    {formData.portfolio_files.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Выбранные файлы портфолио:</h4>
                        <div className="space-y-2">
                          {formData.portfolio_files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule={"evenodd" as const} d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule={"evenodd" as const} />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{(file as any).name}</p>
                                  <p className="text-xs text-gray-500">{((file as any).size / 1024 / 1024).toFixed(2)} МБ</p>
                                </div>
                              </div>
                              <button
                                type={"button" as const}
                                onClick={() => removePortfolioFile(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule={"evenodd" as const} d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule={"evenodd" as const} />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Документы */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">6</span>
                    Документы и допуски
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Добавить документы
                      </label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                        onChange={handleDocumentFilesChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Документы об образовании, допуски, сертификаты, лицензии. Каждый файл до 5МБ, общий размер до 200МБ
                      </p>
                    </div>

                    {formData.document_files.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Выбранные документы:</h4>
                        <div className="space-y-2">
                          {formData.document_files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule={"evenodd" as const} d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule={"evenodd" as const} />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{(file as any).name}</p>
                                  <p className="text-xs text-gray-500">{((file as any).size / 1024 / 1024).toFixed(2)} МБ</p>
                                </div>
                              </div>
                              <button
                                type={"button" as const}
                                onClick={() => removeDocumentFile(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule={"evenodd" as const} d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule={"evenodd" as const} />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Контакты и социальные сети */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">7</span>
                    Контакты и социальные сети
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telegram
                      </label>
                      <input
                        type="text"
                        name="telegram_username"
                        value={formData.telegram_username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="@username или https://t.me/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Сайт/Портфолио
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Банковские реквизиты */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">4</span>
                    Банковские реквизиты
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название банка
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Сбербанк России"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Расчетный счет
                        </label>
                        <input
                          type="text"
                          name="bank_account"
                          value={formData.bank_account}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="40702810000000000000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          БИК банка
                        </label>
                        <input
                          type="text"
                          name="bank_bik"
                          value={formData.bank_bik}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="044525225"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="border-t pt-8">
                  <div className="flex gap-4">
                    <button
                      type={"button" as const}
                      onClick={() => {
                        setEditing(false)
                        setError('')
                      }}
                      className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
                    >
                      Отмена
                    </button>
                    <button
                      type={"submit" as const}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Персональная информация */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">👤</span>
                  Персональная информация
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="font-medium text-gray-500">ФИО:</span>
                    <p className="text-gray-900 mt-1 font-medium">
                      {profile?.last_name || ''} {profile?.first_name || ''} {profile?.patronymic || ''}
                      {(!profile?.last_name && !profile?.first_name) && 'Не указано'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Телефон:</span>
                    <p className="text-gray-900 mt-1">{profile?.phone || 'Не указано'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900 mt-1">{profile?.email || 'Не указано'}</p>
                  </div>
                </div>
              </div>

              {/* Профессиональная информация */}
              {(profile?.professional_info?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">💼</span>
                    Профессиональная информация
                  </h3>

                  {profile.professional_info.map((info: any, index: number) => (
                    <div key={index} className="mb-4 p-4 bg-white rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-500">Специализация:</span>
                          <p className="text-gray-900 mt-1">{info.specialization || 'Не указано'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Опыт работы:</span>
                          <p className="text-gray-900 mt-1">{info.experience_years ? `${info.experience_years} лет` : 'Не указано'}</p>
                        </div>
                      </div>

                      {info.skills && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-500">Навыки и компетенции:</span>
                          <p className="text-gray-900 mt-1 whitespace-pre-line">{info.skills}</p>
                        </div>
                      )}

                      {info.description && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-500">Описание деятельности:</span>
                          <p className="text-gray-900 mt-1 whitespace-pre-line">{info.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Образование */}
              {(profile?.education?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">🎓</span>
                    Образование
                  </h3>

                  {profile.education.map((edu: any, index: number) => (
                    <div key={index} className="mb-4 p-4 bg-white rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-500">Учебное заведение:</span>
                          <p className="text-gray-900 mt-1">{edu.institution || 'Не указано'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Степень образования:</span>
                          <p className="text-gray-900 mt-1">{edu.degree || 'Не указано'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Специальность:</span>
                          <p className="text-gray-900 mt-1">{edu.field_of_study || 'Не указано'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Год окончания:</span>
                          <p className="text-gray-900 mt-1">{edu.graduation_year || 'Не указано'}</p>
                        </div>
                      </div>

                      {edu.description && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-500">Дополнительная информация:</span>
                          <p className="text-gray-900 mt-1 whitespace-pre-line">{edu.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Фото профиля */}
              {profile?.profile_photo_url && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">📸</span>
                    Фото профиля
                  </h3>
                  <div className="flex items-center space-x-4">
                    <img
                      src={profile.profile_photo_url}
                      alt="Фото профиля"
                      className="w-20 h-20 rounded-full object-cover border-4 border-green-200"
                    />
                  </div>
                </div>
              )}

              {/* Файлы портфолио */}
              {(profile?.portfolio_files?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">📁</span>
                    Портфолио и работы
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.portfolio_files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center p-3 bg-white rounded border">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule={"evenodd" as const} d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule={"evenodd" as const} />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size} МБ</p>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule={"evenodd" as const} d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule={"evenodd" as const} />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Документы */}
              {(profile?.document_files?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">📄</span>
                    Документы и допуски
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.document_files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center p-3 bg-white rounded border">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule={"evenodd" as const} d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule={"evenodd" as const} />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size} МБ</p>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule={"evenodd" as const} d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule={"evenodd" as const} />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Контакты и социальные сети */}
              {(profile?.telegram_username || profile?.website) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">📱</span>
                    Контакты и социальные сети
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile?.telegram_username && (
                      <div>
                        <span className="font-medium text-gray-500">Telegram:</span>
                        <p className="text-gray-900 mt-1">
                          {profile.telegram_username.startsWith('@') || profile.telegram_username.startsWith('https://')
                            ? profile.telegram_username
                            : `@${profile.telegram_username}`}
                        </p>
                      </div>
                    )}
                    {profile?.website && (
                      <div>
                        <span className="font-medium text-gray-500">Сайт/Портфолио:</span>
                        <p className="text-gray-900 mt-1">
                          <a href={profile.website} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:text-blue-800 underline">
                            {profile.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Банковские реквизиты */}
              {(profile?.bank_name || profile?.bank_account || profile?.bank_bik) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">🏦</span>
                    Банковские реквизиты
                  </h3>
                  <div className="space-y-3">
                    {profile?.bank_name && (
                      <div>
                        <span className="font-medium text-gray-500">Банк:</span>
                        <p className="text-gray-900 mt-1">{profile.bank_name}</p>
                      </div>
                    )}
                    {profile?.bank_account && (
                      <div>
                        <span className="font-medium text-gray-500">Расчетный счет:</span>
                        <p className="text-gray-900 mt-1 font-mono">{profile.bank_account}</p>
                      </div>
                    )}
                    {profile?.bank_bik && (
                      <div>
                        <span className="font-medium text-gray-500">БИК:</span>
                        <p className="text-gray-900 mt-1 font-mono">{profile.bank_bik}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Если нет информации для отображения */}
              {(!profile?.last_name && !profile?.first_name && !profile?.specialization &&
                !profile?.bank_name && !profile?.telegram_username && !profile?.website) && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule={"evenodd" as const} d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule={"evenodd" as const} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Информация не заполнена</h3>
                  <p className="text-gray-500">Заполните свой профиль, чтобы заказчики могли лучше узнать о вас</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}