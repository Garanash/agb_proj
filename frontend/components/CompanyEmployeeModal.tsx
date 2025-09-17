'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import axios from 'axios'
import { formatApiError } from '@/utils/errorHandler'

interface CompanyEmployee {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  position: string
  department_id: number
  email?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface Department {
  id: number
  name: string
  description?: string
}

interface CompanyEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onEmployeeCreated: () => void
  onEmployeeUpdated: () => void
  employee?: CompanyEmployee | null
}

const CompanyEmployeeModal: React.FC<CompanyEmployeeModalProps> = ({
  isOpen,
  onClose,
  onEmployeeCreated,
  onEmployeeUpdated,
  employee
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    position: '',
    department_id: 0,
    email: '',
    phone: '',
    is_active: true
  })
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      if (employee) {
        setFormData({
          first_name: employee.first_name,
          last_name: employee.last_name,
          middle_name: employee.middle_name || '',
          position: employee.position,
          department_id: employee.department_id,
          email: employee.email || '',
          phone: employee.phone || '',
          is_active: employee.is_active
        })
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          middle_name: '',
          position: '',
          department_id: 0,
          email: '',
          phone: '',
          is_active: true
        })
      }

      // Добавляем обработку клавиши Escape
  const handleEscape = (e: any) => {
    if (e.key === 'Escape') {
          onClose()
        }
      }

      (window as any).document.addEventListener('keydown', handleEscape)
      // Блокируем скролл body
      (window as any).document.body.style.overflow = 'hidden'

      return () => {
        (window as any).document.removeEventListener('keydown', handleEscape)
        // Восстанавливаем скролл body
        (window as any).document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, employee, onClose])

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/v1/departments/list`)
      setDepartments(response.data)
    } catch (error) {
      console.error('Ошибка загрузки отделов:', error)
    }
  }

  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as any).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (employee) {
        // Обновление
        await axios.put(`${getApiUrl()}/api/v1/company-employees/${employee.id}`, formData)
        onEmployeeUpdated()
        onClose()
      } else {
        // Создание
        const response = await axios.post(`${getApiUrl()}/api/v1/company-employees/`, formData)
        console.log('Сотрудник создан успешно:', response.data)
        onEmployeeCreated()
        onClose()
      }
    } catch (error: any) {
      console.error('Ошибка при создании/обновлении сотрудника:', error)
      setError(formatApiError(error, employee ? 'Произошла ошибка при обновлении сотрудника' : 'Произошла ошибка при создании сотрудника'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Заголовок */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {employee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите фамилию"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите имя"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Отчество
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите отчество"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Должность *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите должность"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Отдел *
              </label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Выберите отдел</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите телефон"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Активный сотрудник
              </label>
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
              {isLoading ? 'Сохранение...' : (employee ? 'Обновить' : 'Добавить')}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyEmployeeModal
