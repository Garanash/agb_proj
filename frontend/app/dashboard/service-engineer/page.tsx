'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/utils/api'
import EditRequestModal from '@/components/EditRequestModal'
import ContractorResponsesModal from '@/components/ContractorResponsesModal'

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
  manager_comment?: string
  final_price?: number
  sent_to_bot_at?: string
  customer?: {
    company_name?: string
    contact_person?: string
    phone?: string
    email?: string
  }
  assigned_contractor?: {
    first_name: string
    last_name: string
    middle_name?: string
    phone?: string
    email: string
  }
}

interface ContractorProfile {
  id: number
  user_id: number
  specialization: string
  experience_years?: number
  skills?: string
  bank_name?: string
  bank_account?: string
  bank_bik?: string
  passport_series?: string
  passport_number?: string
  passport_issued_by?: string
  passport_issued_date?: string
  passport_division_code?: string
  registration_address?: string
  user: {
    first_name: string
    last_name: string
    middle_name?: string
    phone?: string
    email: string
  }
  telegram_username?: string
  telegram_bot_link?: string
}

export default function ServiceEngineerDashboard() {
  const { user, token, logout, isAuthenticated } = useAuth()
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [contractors, setContractors] = useState<ContractorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'current' | 'archive' | 'contractors'>('current')
  const [editingRequest, setEditingRequest] = useState<RepairRequest | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResponsesModal, setShowResponsesModal] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'service_engineer') {
      router.push('/dashboard')
      return
    }

    // Читаем параметр tab из URL
    const tabParam = searchParams.get('tab')
    if (tabParam === 'current' || tabParam === 'archive' || tabParam === 'contractors') {
      setActiveTab(tabParam)
    } else if (!tabParam) {
      // Если параметра нет, устанавливаем по умолчанию 'current'
      setActiveTab('current')
    }

    loadData()
  }, [isAuthenticated, user, router, searchParams])

  const loadData = async () => {
    if (!token) return

    setLoading(true)
    try {
      if (activeTab === 'contractors') {
        await loadContractors()
      } else {
        await loadRequests()
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRequests = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/repair-requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
    }
  }

  const loadContractors = async () => {
    try {
      // Получаем профили всех исполнителей через новый endpoint
      const response = await fetch(`${getApiUrl()}/api/contractors/profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const profilesData = await response.json()

        // Для каждого профиля получаем данные пользователя
        const contractorsData = []
        for (const profile of profilesData) {
          try {
            const userResponse = await fetch(`${getApiUrl()}/api/users/${profile.user_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })

            if (userResponse.ok) {
              const userData = await userResponse.json()
              contractorsData.push({
                ...profile,
                user: userData
              })
            } else {
              // Если не можем получить данные пользователя, добавляем профиль с базовой информацией
              contractorsData.push({
                ...profile,
                user: {
                  first_name: 'Неизвестно',
                  last_name: 'Неизвестно',
                  email: 'Не указан',
                  phone: null
                }
              })
            }
          } catch (error) {
            console.error(`Ошибка загрузки данных пользователя для профиля ${profile.id}:`, error)
          }
        }

        setContractors(contractorsData)
      } else {
        console.error('Ошибка при получении профилей исполнителей')
      }
    } catch (error) {
      console.error('Ошибка загрузки исполнителей:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, token])

  const updateRequestStatus = async (requestId: number, newStatus: string) => {
    if (!token) return

    try {
      const response = await fetch(`${getApiUrl()}/api/repair-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadRequests()
      } else {
        alert('Ошибка при обновлении статуса заявки')
      }
    } catch (error) {
      alert('Произошла ошибка при обновлении статуса')
    }
  }

  const assignContractor = async (requestId: number, contractorId: number) => {
    if (!token) return

    try {
      const response = await fetch(`${getApiUrl()}/api/repair-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'assigned',
          assigned_contractor_id: contractorId
        })
      })

      if (response.ok) {
        await loadRequests()
        alert('Исполнитель успешно назначен!')
      } else {
        alert('Ошибка при назначении исполнителя')
      }
    } catch (error) {
      alert('Произошла ошибка при назначении исполнителя')
    }
  }

  const handleEditRequest = (request: RepairRequest) => {
    setEditingRequest(request)
    setShowEditModal(true)
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setEditingRequest(null)
    loadRequests()
  }

  const sendToBot = async (requestId: number) => {
    if (!token) return

    try {
      const response = await fetch(`${getApiUrl()}/api/repair-requests/${requestId}/send-to-bot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadRequests()
        alert('Заявка успешно отправлена в бот!')
      } else {
        const errorData = await response.json()
        alert(errorData.detail || 'Ошибка при отправке в бот')
      }
    } catch (error) {
      alert('Произошла ошибка при отправке в бот')
    }
  }

  const handleViewResponses = (requestId: number) => {
    setSelectedRequestId(requestId)
    setShowResponsesModal(true)
  }

  const handleAssignFromResponses = async (contractorId: number) => {
    if (!selectedRequestId || !token) return

    try {
      const response = await fetch(`${getApiUrl()}/api/repair-requests/${selectedRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'assigned',
          assigned_contractor_id: contractorId
        })
      })

      if (response.ok) {
        await loadRequests()
        setShowResponsesModal(false)
        setSelectedRequestId(null)
        alert('Исполнитель успешно назначен!')
      } else {
        alert('Ошибка при назначении исполнителя')
      }
    } catch (error) {
      alert('Произошла ошибка при назначении исполнителя')
    }
  }



  const currentRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled')
  const archivedRequests = requests.filter(r => r.status === 'completed' || r.status === 'cancelled')

  if (!isAuthenticated || !user || user.role !== 'service_engineer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Проверка доступа...</p>
        </div>
      </div>
    )
  }

  // Функция для получения названия текущей вкладки
  const getCurrentTabTitle = () => {
    switch (activeTab) {
      case 'current': return 'Текущие заявки'
      case 'archive': return 'Архив выполненных заявок'
      case 'contractors': return 'Наши исполнители'
      default: return 'Кабинет сервисного инженера'
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Текущие заявки */}
            {activeTab === 'current' && (
              <CurrentRequestsTab
                requests={currentRequests}
                contractors={contractors}
                onUpdateStatus={updateRequestStatus}
                onAssignContractor={assignContractor}
                onEditRequest={handleEditRequest}
                onSendToBot={sendToBot}
                onViewResponses={handleViewResponses}
              />
            )}

            {/* Архив */}
            {activeTab === 'archive' && (
              <ArchiveTab requests={archivedRequests} />
            )}

            {/* Исполнители */}
            {activeTab === 'contractors' && (
              <ContractorsTab contractors={contractors} />
            )}
          </>
        )}
      </div>

      {/* Модальное окно редактирования заявки */}
      <EditRequestModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingRequest(null)
        }}
        request={editingRequest}
        onSuccess={handleEditSuccess}
      />

      {/* Модальное окно откликов исполнителей */}
      <ContractorResponsesModal
        isOpen={showResponsesModal}
        onClose={() => {
          setShowResponsesModal(false)
          setSelectedRequestId(null)
        }}
        requestId={selectedRequestId || 0}
        onAssignContractor={handleAssignFromResponses}
      />
    </div>
  )
}

// Вспомогательные функции
const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-yellow-100 text-yellow-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'sent_to_bot': return 'bg-orange-100 text-orange-800'
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
    case 'sent_to_bot': return 'Отправлена в бот'
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

// Компонент для текущих заявок
function CurrentRequestsTab({
  requests,
  contractors,
  onUpdateStatus,
  onAssignContractor,
  onEditRequest,
  onSendToBot,
  onViewResponses
}: {
  requests: RepairRequest[]
  contractors: ContractorProfile[]
  onUpdateStatus: (requestId: number, status: string) => void
  onAssignContractor: (requestId: number, contractorId: number) => void
  onEditRequest: (request: RepairRequest) => void
  onSendToBot: (requestId: number) => void
  onViewResponses: (requestId: number) => void
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Нет текущих заявок</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Отладочная информация */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Отладка:</strong> Загружено заявок: {requests.length}
        </p>
        {requests.length > 0 && (
          <p className="text-xs text-yellow-700 mt-1">
            Статусы: {requests.map(r => r.status).join(', ')}
          </p>
        )}
      </div>
      
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                    {request.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    #{request.id} • {new Date(request.created_at).toLocaleDateString('ru-RU')}
                  </p>

                  {/* Компактная информация */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {request.customer && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">👤</span>
                        <span className="text-gray-900">{request.customer.company_name || request.customer.contact_person}</span>
                      </div>
                    )}
                    {request.equipment_type && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">🔧</span>
                        <span className="text-gray-900">{request.equipment_type}</span>
                      </div>
                    )}
                    {request.address && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">📍</span>
                        <span className="text-gray-900 truncate max-w-48">{request.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Назначенный исполнитель */}
                  {request.assigned_contractor && (
                    <div className="mt-2 flex items-center space-x-1">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm text-green-800">
                        {request.assigned_contractor.last_name} {request.assigned_contractor.first_name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2 ml-4">
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency}
                    </span>
                  </div>

                  {/* Отладочная информация */}
                  <div className="text-xs text-gray-500 mb-2">
                    Статус: {request.status} | Комментарий: {request.manager_comment ? 'есть' : 'нет'} | Цена: {request.final_price || 'нет'}
                  </div>

                  {/* Компактные действия */}
                  <div className="flex flex-wrap gap-2">
                    {request.status === 'new' && (
                      <button
                        onClick={() => onUpdateStatus(request.id, 'processing')}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Взять
                      </button>
                    )}

                    {request.status === 'processing' && (
                      <button
                        onClick={() => onEditRequest(request)}
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                      >
                        Редактировать
                      </button>
                    )}

                    {request.status === 'processing' && request.manager_comment && request.final_price && (
                      <button
                        onClick={() => onSendToBot(request.id)}
                        className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                      >
                        Отправить в бот
                      </button>
                    )}

                    {request.status === 'sent_to_bot' && !request.assigned_contractor && (
                      <button
                        onClick={() => onViewResponses(request.id)}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                      >
                        Просмотреть отклики
                      </button>
                    )}

                    {request.status !== 'completed' && request.status !== 'cancelled' && (
                      <button
                        onClick={() => onUpdateStatus(request.id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        Завершить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Компонент для архива
function ArchiveTab({ requests }: { requests: RepairRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Архив пуст</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 opacity-75 hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                    {request.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    #{request.id} • {new Date(request.created_at).toLocaleDateString('ru-RU')}
                  </p>

                  {/* Компактная информация */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {request.customer && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">👤</span>
                        <span className="text-gray-900">{request.customer.company_name || request.customer.contact_person}</span>
                      </div>
                    )}
                    {request.equipment_type && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">🔧</span>
                        <span className="text-gray-900">{request.equipment_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Назначенный исполнитель */}
                  {request.assigned_contractor && (
                    <div className="mt-2 flex items-center space-x-1">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm text-green-800">
                        {request.assigned_contractor.last_name} {request.assigned_contractor.first_name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end ml-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Компонент для исполнителей
function ContractorsTab({ contractors }: { contractors: ContractorProfile[] }) {
  if (contractors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Нет зарегистрированных исполнителей</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contractors.map((contractor) => (
        <div key={contractor.user_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {contractor.user.last_name} {contractor.user.first_name}
                    {contractor.user.middle_name && ` ${contractor.user.middle_name}`}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {contractor.specialization}
                    {contractor.experience_years && ` • ${contractor.experience_years} лет стажа`}
                  </p>

                  {/* Компактная контактная информация */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500">✉️</span>
                      <span className="text-gray-900">{contractor.user.email}</span>
                    </div>
                    {contractor.user.phone && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">📱</span>
                        <span className="text-gray-900">{contractor.user.phone}</span>
                      </div>
                    )}
                    {contractor.telegram_username && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">💬</span>
                        <span className="text-gray-900">@{contractor.telegram_username}</span>
                      </div>
                    )}
                  </div>

                  {/* Навыки (компактно) */}
                  {contractor.skills && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-500">Навыки:</span>
                      <p className="text-sm text-gray-900 truncate">{contractor.skills}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end ml-4">
                  {/* Ссылка на Telegram бота */}
                  {contractor.telegram_bot_link && (
                    <a
                      href={contractor.telegram_bot_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12.057 12.057 0 0 0-1.128 0 1.5 1.5 0 0 0-.996.469L6.52 7.694a1.5 1.5 0 0 0 .036 1.981l3.239 4.443a1.5 1.5 0 0 0 2.082.267l5.39-4.181a1.5 1.5 0 0 0 .266-2.082L13.33.735a1.5 1.5 0 0 0-.996-.469A12.057 12.057 0 0 0 11.944 0z"/>
                      </svg>
                      Написать
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
