'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils'
import { LoginSuccessModal } from '@/components/features/auth'

interface CustomerRegistrationFormProps {
  onSuccess?: (username: string, password?: string) => void
  showLoginModal?: boolean
}

const CustomerRegistrationForm: React.FC<CustomerRegistrationFormProps> = ({
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    // Данные компании
    company_name: '',
    contact_person: '',
    company_phone: '',
    company_email: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [generatedUsername, setGeneratedUsername] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    // Валидация данных компании
    if (!formData.company_name.trim()) return 'Название компании обязательно'
    if (!formData.contact_person.trim()) return 'Контактное лицо обязательно'
    if (!formData.company_phone.trim()) return 'Телефон компании обязателен'
    if (!formData.company_email.trim()) return 'Email компании обязателен'

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const registrationData = {
        // Данные компании
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        company_phone: formData.company_phone,
        company_email: formData.company_email
      }

      console.log('📤 Отправка данных регистрации:', registrationData)

      const response = await fetch(`${getApiUrl()}/api/v1/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Регистрация успешна:', result)
        setFormData({
          // Данные компании
          company_name: '',
          contact_person: '',
          company_phone: '',
          company_email: ''
        })
        setGeneratedUsername(result.username)
        setGeneratedPassword(result.generated_password)
        setShowLoginModal(true)
        setSuccess(`Регистрация успешна! Логин: ${result.username}`)
        onSuccess?.(result.username, result.generated_password)
      } else {
        const errorData = await response.json()
        console.error('❌ Ошибка регистрации:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        })
        setError(errorData.detail || 'Ошибка при регистрации')
      }
    } catch (error) {
      setError('Произошла ошибка при подключении к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Данные компании */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Данные компании
          </h3>

          {/* Название компании */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
              Название компании *
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название вашей компании"
              required
            />
          </div>

          {/* Контактное лицо */}
          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-2">
              Контактное лицо *
            </label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ФИО контактного лица"
              required
            />
          </div>

          {/* Телефон компании */}
          <div>
            <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700 mb-2">
              Телефон компании *
            </label>
            <input
              type="tel"
              id="company_phone"
              name="company_phone"
              value={formData.company_phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>

          {/* Email компании */}
          <div>
            <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 mb-2">
              Email компании *
            </label>
            <input
              type="email"
              id="company_email"
              name="company_email"
              value={formData.company_email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="info@company.com"
              required
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </div>
      </form>

      {/* Модальное окно с логином */}
      <LoginSuccessModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        username={generatedUsername}
        password={generatedPassword}
        userType="customer"
      />
    </div>
  )
}

export default CustomerRegistrationForm