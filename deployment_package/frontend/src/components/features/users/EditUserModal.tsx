'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import axios from 'axios'
import { formatApiError } from '@/utils/errorHandler'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  role: string
  is_active: boolean
  phone?: string
  department_id?: number
  position?: string
  avatar_url?: string
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
  user: User | null
}

const EditUserModal: React.FC<EditUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onUserUpdated, 
  user 
}) => {
  const [formData, setFormData] = useState(() => ({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    middle_name: user?.middle_name || '',
    role: (user?.role as 'admin' | 'manager' | 'employee' | 'customer' | 'contractor' | 'service_engineer' | 'ved_passport') || 'employee',
    is_active: user?.is_active ?? true,
    phone: user?.phone || '',
    department_id: user?.department_id || null,
    position: user?.position || ''
  }))
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // console.log('EditUserModal rendered:', { isOpen, user: !!user })

  // Заполняем форму данными пользователя при открытии
  useEffect(() => {
    if (user && isOpen) {
      const newFormData = {
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        middle_name: user.middle_name || '',
        role: (user.role as 'admin' | 'manager' | 'employee' | 'customer' | 'contractor' | 'service_engineer' | 'ved_passport') || 'employee',
        is_active: user.is_active ?? true,
        phone: user.phone || '',
        department_id: user.department_id || null,
        position: user.position || ''
      }
      
      // Обновляем только если данные действительно изменились
      setFormData(prev => {
        const hasChanges = Object.keys(newFormData).some(key => 
          prev[key as keyof typeof prev] !== newFormData[key as keyof typeof newFormData]
        )
        return hasChanges ? newFormData : prev
      })
      setError('')
    }
  }, [user?.id, isOpen]) // Используем user.id вместо всего объекта user

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      // Подготавливаем данные для обновления (исключаем пустые поля)
      const updateData: any = {}
      
      // username нельзя изменять
      if (formData.email !== user.email) updateData.email = formData.email
      if (formData.first_name !== user.first_name) updateData.first_name = formData.first_name
      if (formData.last_name !== user.last_name) updateData.last_name = formData.last_name
      if (formData.middle_name !== (user.middle_name || '')) updateData.middle_name = formData.middle_name || null
      if (formData.role !== user.role) updateData.role = formData.role
      if (formData.is_active !== user.is_active) updateData.is_active = formData.is_active
      if (formData.phone !== (user.phone || '')) updateData.phone = formData.phone || null
      if (formData.department_id !== user.department_id) updateData.department_id = formData.department_id
      if (formData.position !== (user.position || '')) updateData.position = formData.position || null

      // Получаем токен из localStorage
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему заново.')
      }

      const response = await axios.put(`${getApiUrl()}/api/v1/users/${user.id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      onUserUpdated()
      onClose()
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите в систему заново.')
      } else {
        setError(formatApiError(error, 'Произошла ошибка при обновлении пользователя'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Редактировать пользователя
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Основная информация */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                placeholder="Имя пользователя"
              />
              <p className="text-xs text-gray-500 mt-1">Имя пользователя нельзя изменить</p>
            </div>

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
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Роль *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="employee">Сотрудник</option>
                <option value="manager">Менеджер</option>
                <option value="ved_passport">Сотрудник ВЭД</option>
                <option value="customer">Заказчик</option>
                <option value="contractor">Исполнитель</option>
                <option value="service_engineer">Сервисный инженер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>

            {/* Дополнительная информация */}
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
                placeholder="+7 (xxx) xxx-xx-xx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Отдел
              </label>
              <input
                type="number"
                name="department_id"
                value={formData.department_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ID отдела"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Должность
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите должность"
              />
            </div>

            {/* Статус активности */}
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                  Пользователь активен
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Неактивные пользователи не могут войти в систему
              </p>
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

export default EditUserModal
