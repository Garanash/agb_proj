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
}

export default function CustomerDashboard() {
  const { user, token, logout, isAuthenticated } = useAuth()
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'requests' | 'create'>('requests')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'customer') {
      router.push('/dashboard')
      return
    }

    // Читаем параметр tab из URL
    const tabParam = searchParams.get('tab')
    if (tabParam === 'create') {
      setActiveTab('create')
    } else {
      setActiveTab('requests')  // По умолчанию показываем выполненные заявки
    }

    loadRequests()
  }, [isAuthenticated, user, router, searchParams])

  const loadRequests = async () => {
    if (!token) return

    try {
      // Загружаем только выполненные и отмененные заявки для заказчика
      const response = await fetch(`${getApiUrl()}/api/v1/repair-requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Фильтруем только выполненные и отмененные заявки
        const completedRequests = data.filter((request: RepairRequest) =>
          request.status === 'completed' || request.status === 'cancelled'
        )
        setRequests(completedRequests)
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новая'
      case 'processing': return 'В обработке'
      case 'assigned': return 'Назначен исполнитель'
      case 'completed': return 'Завершена'
      case 'cancelled': return 'Отменена'
      default: return status
    }
  }

  if (!isAuthenticated || !user || user.role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Проверка доступа...</p>
        </div>
      </div>
    )
  }

  // Функция для получения названия текущей вкладки
  const getCurrentTabTitle = () => {
    switch (activeTab) {
      case 'create': return 'Новая заявка'
      case 'requests': return 'Выполненные заявки'
      default: return 'Кабинет заказчика'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок страницы */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {getCurrentTabTitle()}
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
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Создание новой заявки */}
            {activeTab === 'create' && (
              <CreateRequestForm onSuccess={() => setActiveTab('requests')} />
            )}

            {/* Список выполненных заявок */}
            {activeTab === 'requests' && (
              <CompletedRequestsList
                requests={requests}
                onRefresh={loadRequests}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Компонент создания заявки
function CreateRequestForm({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth()
  const [formData, setFormData] = useState({
    // Контактная информация
    contactPerson: '',
    contactPhone: '',
    // Заказчик
    customerName: '',
    customCustomerName: '',
    // Расположение
    region: '',
    city: '',
    district: '',
    field: '',
    // Оборудование
    equipmentType: '',
    geologicalEquipment: '',
    drillingEquipment: '',
    customEquipment: '',
    // Проблема
    problemType: '',
    problemDescription: '',
    // Дополнительные поля для API
    title: '',
    description: '',
    urgency: 'средне',
    address: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setIsLoading(true)
    setError('')

    try {
      // Создаем полное описание из всех полей
      const fullDescription = `
Тип проблемы: ${formData.problemType}
Описание: ${formData.problemDescription}

Контактное лицо: ${formData.contactPerson}
Телефон: ${formData.contactPhone}

Заказчик: ${formData.customerName || formData.customCustomerName}

Расположение:
- Регион: ${formData.region}
- Город: ${formData.city}
- Район: ${formData.district}
- Месторождение: ${formData.field}

Оборудование:
- Тип: ${formData.equipmentType}
- Модель: ${formData.geologicalEquipment || formData.drillingEquipment || formData.customEquipment || 'Не указано'}
      `.trim()

      const requestData = {
        title: formData.title || `${formData.problemType} - ${formData.contactPerson}`,
        description: fullDescription,
        urgency: formData.urgency,
        address: `${formData.region}, ${formData.city}, ${formData.district}, ${formData.field}`.replace(/^,|,$/g, '').replace(/, ,/g, ', '),
        city: formData.city,
        region: formData.region,
        equipment_type: formData.equipmentType,
        equipment_brand: formData.geologicalEquipment || formData.drillingEquipment || formData.customEquipment,
        equipment_model: formData.customEquipment || 'Не указано'
      }

      const response = await fetch(`${getApiUrl()}/api/v1/repair-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Ошибка при создании заявки')
      }
    } catch (error) {
      setError('Произошла ошибка при подключении к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const mockCustomers = [
    'ООО "Газпром"',
    'ООО "Лукойл"',
    'ООО "Роснефть"',
    'ООО "Сургутнефтегаз"',
    'ООО "Татнефть"',
    'ООО "Башнефть"',
    'ООО "Новатэк"',
    'ООО "РуссНефть"'
  ]

  const geologicalEquipment = [
    'LF90',
    'LF70',
    'CS14',
    'CS10',
    'RS90',
    'LM90',
    'RU90',
    'Другое'
  ]

  const drillingEquipment = [
    'DM',
    'DML',
    'FLEXYROC',
    'Другое'
  ]

  const problemTypes = [
    'Поломка двигателя',
    'Неисправность гидравлики',
    'Проблемы с электрикой',
    'Износ деталей',
    'Техническое обслуживание',
    'Калибровка оборудования',
    'Замена комплектующих',
    'Другое'
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h2 className="text-2xl font-bold">Создание новой заявки</h2>
          <p className="text-blue-100 mt-1">Заполните все поля для точного описания проблемы</p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Основная информация о заявке */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
              Основная информация
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название заявки *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Краткое описание проблемы"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срочность *
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="низкая">Низкая</option>
                  <option value="средне">Средняя</option>
                  <option value="высокая">Высокая</option>
                  <option value="критическая">Критическая</option>
                </select>
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
              Контактная информация
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контактное лицо *
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контактный телефон *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
          </div>

          {/* Информация о заказчике */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">3</span>
              Информация о заказчике
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название заказчика
                </label>
                <select
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите заказчика или введите название</option>
                  {mockCustomers.map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Или введите название компании
                </label>
                <input
                  type="text"
                  name="customCustomerName"
                  value={formData.customCustomerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название компании, если её нет в списке"
                />
              </div>
            </div>
          </div>

          {/* Расположение объекта */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">4</span>
              Расположение объекта
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Регион/Область *
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Московская область"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Город *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Москва"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Район *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Центральный"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Месторождение *
                </label>
                <input
                  type="text"
                  name="field"
                  value={formData.field}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Название месторождения"
                />
              </div>
            </div>
          </div>

          {/* Тип оборудования */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">5</span>
              Тип оборудования
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория оборудования *
                </label>
                <select
                  name="equipmentType"
                  value={formData.equipmentType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите категорию</option>
                  <option value="geological">Геологоразведочное</option>
                  <option value="drilling">Буровзрывное</option>
                </select>
              </div>

              {formData.equipmentType === 'geological' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип геологоразведочного оборудования *
                  </label>
                  <select
                    name="geologicalEquipment"
                    value={formData.geologicalEquipment}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Выберите тип оборудования</option>
                    {geologicalEquipment.map(equipment => (
                      <option key={equipment} value={equipment}>{equipment}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.equipmentType === 'drilling' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип буровзрывного оборудования *
                  </label>
                  <select
                    name="drillingEquipment"
                    value={formData.drillingEquipment}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Выберите тип оборудования</option>
                    {drillingEquipment.map(equipment => (
                      <option key={equipment} value={equipment}>{equipment}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {((formData.equipmentType === 'geological' && formData.geologicalEquipment === 'Другое') ||
              (formData.equipmentType === 'drilling' && formData.drillingEquipment === 'Другое')) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название станка *
                </label>
                <input
                  type="text"
                  name="customEquipment"
                  value={formData.customEquipment}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название станка"
                />
              </div>
            )}
          </div>

          {/* Описание проблемы */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">6</span>
              Описание проблемы
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип неисправности *
                </label>
                <select
                  name="problemType"
                  value={formData.problemType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите тип неисправности</option>
                  {problemTypes.map(problem => (
                    <option key={problem} value={problem}>{problem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подробное описание проблемы *
                </label>
                <textarea
                  name="problemDescription"
                  value={formData.problemDescription}
                  onChange={handleInputChange}
                  required
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Подробно опишите возникшую проблему, укажите симптомы, когда началась, что предшествовало поломке, и другую важную информацию..."
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="border-t pt-8">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard/customer?tab=requests'}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors font-medium"
              >
                {isLoading ? 'Создание заявки...' : 'Отправить заявку'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Компонент списка выполненных заявок
function CompletedRequestsList({ requests, onRefresh }: { requests: RepairRequest[], onRefresh: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новая'
      case 'processing': return 'В обработке'
      case 'assigned': return 'Назначен исполнитель'
      case 'completed': return 'Завершена'
      case 'cancelled': return 'Отменена'
      default: return status
    }
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Выполненные заявки</h2>
        <button
          onClick={onRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Обновить
        </button>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">У вас пока нет выполненных или отмененных заявок</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                  <p className="text-sm text-gray-600">Заявка #{request.id}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="font-medium text-gray-500">Описание:</span>
                  <p className="text-gray-900 mt-1">{request.description}</p>
                </div>

                {request.equipment_type && (
                  <div>
                    <span className="font-medium text-gray-500">Оборудование:</span>
                    <p className="text-gray-900 mt-1">{request.equipment_type}</p>
                  </div>
                )}

                {request.address && (
                  <div>
                    <span className="font-medium text-gray-500">Адрес:</span>
                    <p className="text-gray-900 mt-1">{request.address}</p>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-500">Создано:</span>
                  <p className="text-gray-900 mt-1">{new Date(request.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



