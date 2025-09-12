'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils'

interface EditRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: any
  onSuccess: () => void
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    manager_comment: '',
    final_price: '',
    equipment_type: '',
    equipment_brand: '',
    equipment_model: '',
    problem_description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (request && isOpen) {
      setFormData({
        manager_comment: request.manager_comment || '',
        final_price: request.final_price || '',
        equipment_type: request.equipment_type || '',
        equipment_brand: request.equipment_brand || '',
        equipment_model: request.equipment_model || '',
        problem_description: request.problem_description || ''
      })
    }
  }, [request, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request) return

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/v1/repair-requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          final_price: formData.final_price ? parseInt(formData.final_price) : null
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Ошибка при обновлении заявки')
      }
    } catch (error) {
      setError('Произошла ошибка при обновлении заявки')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen || !request) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Заголовок */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Редактирование заявки #{request.id}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Информация о заявке */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о заявке</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Заказчик:</span>
                  <p className="text-gray-600">{request.customer?.company_name || 'Не указан'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Адрес:</span>
                  <p className="text-gray-600">{request.address || 'Не указан'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Описание:</span>
                  <p className="text-gray-600">{request.description}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Срочность:</span>
                  <p className="text-gray-600">{request.urgency || 'Не указана'}</p>
                </div>
              </div>
            </div>

            {/* Технические детали */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Технические детали</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип оборудования
                  </label>
                  <input
                    type="text"
                    name="equipment_type"
                    value={formData.equipment_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: Буровая установка"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Марка оборудования
                  </label>
                  <input
                    type="text"
                    name="equipment_brand"
                    value={formData.equipment_brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: Atlas Copco"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Модель оборудования
                </label>
                <input
                  type="text"
                  name="equipment_model"
                  value={formData.equipment_model}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: ROC L8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание проблемы
                </label>
                <textarea
                  name="problem_description"
                  value={formData.problem_description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Подробное описание проблемы..."
                />
              </div>
            </div>

            {/* Комментарий менеджера и цена */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Дополнительная информация</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий менеджера <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="manager_comment"
                  value={formData.manager_comment}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ваш комментарий по заявке..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Финальная цена заявки (₽) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="final_price"
                  value={formData.final_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите цену в рублях"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditRequestModal
