'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api'

interface ContractorResponse {
  id: number
  proposed_cost?: number
  estimated_days?: number
  comment?: string
  status: string
  created_at: string
  contractor: {
    id: number
    user: {
      id: number
      first_name: string
      last_name: string
      middle_name?: string
      phone?: string
      email: string
    }
    professional_info?: any[]
    education?: any[]
    bank_name?: string
    bank_account?: string
    bank_bik?: string
    general_description?: string
  }
}

interface ContractorResponsesModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: number
  onAssignContractor: (contractorId: number) => void
}

const ContractorResponsesModal: React.FC<ContractorResponsesModalProps> = ({
  isOpen,
  onClose,
  requestId,
  onAssignContractor
}) => {
  const [responses, setResponses] = useState<ContractorResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && requestId) {
      loadResponses()
    }
  }, [isOpen, requestId])

  const loadResponses = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/v1/repair-requests/${requestId}/responses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setResponses(Array.isArray(data) ? data : [])
      } else {
        setError('Ошибка при загрузке откликов')
      }
    } catch (error) {
      setError('Произошла ошибка при загрузке откликов')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает рассмотрения'
      case 'accepted': return 'Принят'
      case 'rejected': return 'Отклонен'
      case 'assigned': return 'Назначен'
      default: return status
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Заголовок */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Отклики исполнителей на заявку #{requestId}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка откликов...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Откликов пока нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses && Array.isArray(responses) ? responses.map((response) => (
                <div key={response.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {response.contractor.user.last_name} {response.contractor.user.first_name}
                        {response.contractor.user.middle_name && ` ${response.contractor.user.middle_name}`}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>📧 {response.contractor.user.email}</span>
                        {response.contractor.user.phone && (
                          <span>📞 {response.contractor.user.phone}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(response.status)}`}>
                      {getStatusText(response.status)}
                    </span>
                  </div>

                  {/* Предложение исполнителя */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {response.proposed_cost && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <span className="text-sm font-medium text-gray-700">Предлагаемая стоимость:</span>
                        <p className="text-lg font-semibold text-green-600">
                          {response.proposed_cost.toLocaleString()} ₽
                        </p>
                      </div>
                    )}
                    {response.estimated_days && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <span className="text-sm font-medium text-gray-700">Срок выполнения:</span>
                        <p className="text-lg font-semibold text-blue-600">
                          {response.estimated_days} дн.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Комментарий */}
                  {response.comment && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700">Комментарий:</span>
                      <p className="text-gray-600 mt-1">{response.comment}</p>
                    </div>
                  )}

                  {/* Информация об исполнителе */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Информация об исполнителе:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {response.contractor.general_description && (
                        <div>
                          <span className="font-medium text-gray-700">Описание:</span>
                          <p className="text-gray-600">{response.contractor.general_description}</p>
                        </div>
                      )}
                      {response.contractor.bank_name && (
                        <div>
                          <span className="font-medium text-gray-700">Банк:</span>
                          <p className="text-gray-600">{response.contractor.bank_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  {response.status === 'pending' && (
                    <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => onAssignContractor(response.contractor.user.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Назначить исполнителем
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Ошибка загрузки откликов</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Кнопка закрытия */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractorResponsesModal
