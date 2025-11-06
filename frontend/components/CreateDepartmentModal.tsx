'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils/api';
import axios from 'axios'
import { formatApiError } from '@/utils/errorHandler'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onDepartmentCreated: () => void
}

const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onDepartmentCreated 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')


  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await axios.post(`${getApiUrl()}/api/v1/departments/`, formData)
      
      // Сбрасываем форму
      setFormData({
        name: '',
        description: ''
      })
      
      onDepartmentCreated()
    } catch (error: any) {
      setError(formatApiError(error, 'Произошла ошибка при создании отдела'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Создать отдел
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type={"button" as const}
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Отменить
            </button>
            <button
              type={"submit" as const}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Создание...' : 'Создать отдел'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateDepartmentModal
