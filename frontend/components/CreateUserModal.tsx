'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils';
import axios from 'axios'
import { formatApiError } from '@/utils'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: (newUser: any) => void
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    role: 'employee' as 'admin' | 'manager' | 'employee' | 'customer' | 'contractor' | 'service_engineer' | 'ved_passport',
    prefix: 'AGB'
  })
  
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('CreateUserModal rendered:', { isOpen })

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword)
      // Можно добавить уведомление об успешном копировании
    } catch (err) {
      console.error('Ошибка копирования пароля:', err)
    }
  }

  const handleClose = () => {
    setGeneratedPassword('')
    setShowPassword(false)
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      middle_name: '',
      role: 'employee',
      prefix: 'AGB'
    })
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Убираем поле prefix из данных, так как бэкенд генерирует username автоматически
      const { prefix, ...userData } = formData
      // Пароль всегда генерируется автоматически
      
      const response = await axios.post(`${getApiUrl()}/api/v1/users/`, userData)
      
      // Показываем сгенерированный пароль
      if (response.data.generated_password) {
        setGeneratedPassword(response.data.generated_password)
        setShowPassword(true)
        // Передаем данные пользователя с паролем
        onUserCreated(response.data)
        // Не закрываем модалку сразу, чтобы показать пароль
        return
      }
      
      onUserCreated(response.data)
      onClose()
      // Сбрасываем форму
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        role: 'employee',
        prefix: 'AGB'
      })
    } catch (error: any) {
      setError(formatApiError(error, 'Произошла ошибка при создании пользователя'))
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
              Добавить пользователя
            </h3>
            <button
              onClick={handleClose}
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

          {showPassword && generatedPassword && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-lg font-semibold text-green-800 mb-2">
                Пользователь успешно создан!
              </h4>
              <p className="text-sm text-green-700 mb-3">
                Сохраните пароль для передачи пользователю:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={generatedPassword}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={copyPassword}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  Копировать
                </button>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Пользователь будет обязан сменить пароль при первом входе в систему
              </p>
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
                Префикс для username
              </label>
              <select
                name="prefix"
                value={formData.prefix}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AGB">AGB</option>
                <option value="BSCR">BSCR</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Username будет сгенерирован автоматически</p>
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
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            {showPassword ? (
              <button
                type={"button" as const}
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Закрыть
              </button>
            ) : (
              <>
                <button
                  type={"button" as const}
                  onClick={handleClose}
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
                  {isLoading ? 'Создание...' : 'Создать пользователя'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUserModal
