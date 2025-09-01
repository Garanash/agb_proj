'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils/api'
import LoginSuccessModal from './LoginSuccessModal'

interface CustomerRegistrationFormProps {
  onSuccess?: () => void
}

const CustomerRegistrationForm: React.FC<CustomerRegistrationFormProps> = ({
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [generatedUsername, setGeneratedUsername] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.company_name.trim()) return 'Название компании обязательно'
    if (!formData.email.trim()) return 'Email обязателен'
    if (!formData.password.trim()) return 'Пароль обязателен'
    if (formData.password.length < 6) return 'Пароль должен быть не менее 6 символов'
    if (formData.password !== formData.confirmPassword) return 'Пароли не совпадают'

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
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name
      }

      const response = await fetch(`${getApiUrl()}/api/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })

      if (response.ok) {
        const result = await response.json()
        setGeneratedUsername(result.username)
        setShowLoginModal(true)
        setFormData({
          company_name: '', email: '', password: '', confirmPassword: ''
        })
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Ошибка при регистрации')
      }
    } catch (error) {
      setError('Произошла ошибка при подключении к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Регистрация заказчика
        </h2>
        <p className="text-center text-gray-600">
          Создайте аккаунт для вашей компании
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}



      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@company.com"
            required
          />
        </div>

        {/* Пароль */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Пароль *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Минимум 6 символов"
            required
          />
        </div>

        {/* Подтверждение пароля */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Подтверждение пароля *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Повторите пароль"
            required
          />
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
        onClose={() => {
          setShowLoginModal(false)
          onSuccess?.()
        }}
        username={generatedUsername}
        userType="customer"
      />
    </div>
  )
}

export default CustomerRegistrationForm
