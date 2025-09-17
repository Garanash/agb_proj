'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../../utils/api';
import axios from 'axios'
import { formatApiError } from '../../utils/errorHandler'

interface Department {
  id: number
  name: string
  description: string
  head_id?: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface EditDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onDepartmentUpdated: () => void
  department: Department | null
}

const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onDepartmentUpdated, 
  department 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('EditDepartmentModal rendered:', { isOpen, department: !!department })

  // Заполняем форму данными отдела при открытии
  useEffect(() => {
    if (department && isOpen) {
      setFormData({
        name: department.name,
        description: department.description || ''
      })
      setError('')
    }
  }, [department, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!department) return

    setIsLoading(true)
    setError('')

    try {
      // Подготавливаем данные для обновления (отправляем только изменённые поля)
      const updateData: any = {}
      
      if (formData.name !== department.name) updateData.name = formData.name
      if (formData.description !== (department.description || '')) updateData.description = formData.description

      await axios.put(`${getApiUrl()}/api/v1/departments/${department.id}`, updateData)
      
      onDepartmentUpdated()
    } catch (error: any) {
      setError(formatApiError(error, 'Произошла ошибка при обновлении отдела'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !department) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Редактировать отдел
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название отдела *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название отдела"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите описание отдела"
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>ID отдела: {department.id}</p>
              <p>Создан: {new Date(department.created_at).toLocaleDateString('ru-RU')}</p>
              {department.updated_at && (
                <p>Обновлён: {new Date(department.updated_at).toLocaleDateString('ru-RU')}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Отменить
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditDepartmentModal
