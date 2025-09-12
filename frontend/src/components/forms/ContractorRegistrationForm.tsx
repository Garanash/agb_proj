'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils'
import LoginSuccessModal from '@/components/features/auth'

interface ContractorRegistrationFormProps {
  onSuccess?: (username: string) => void
  showLoginModal?: boolean
}

const ContractorRegistrationForm: React.FC<ContractorRegistrationFormProps> = ({
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    // Данные пользователя
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: '',

    // Профессиональные данные
    specialization: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [generatedUsername, setGeneratedUsername] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email.trim()) return 'Email обязателен'
    if (!formData.password.trim()) return 'Пароль обязателен'
    if (formData.password.length < 6) return 'Пароль должен быть не менее 6 символов'
    if (formData.password !== formData.confirmPassword) return 'Пароли не совпадают'
    if (!formData.first_name.trim()) return 'Имя обязательно'
    if (!formData.last_name.trim()) return 'Фамилия обязательна'
    if (!formData.specialization.trim()) return 'Специализация обязательна'

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
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        phone: formData.phone,
        specialization: formData.specialization
      }

      const response = await fetch(`${getApiUrl()}/api/v1/contractors/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })

      if (response.ok) {
        const result = await response.json()
        setFormData({
          email: '', password: '', confirmPassword: '', first_name: '', last_name: '', middle_name: '',
          phone: '', specialization: ''
        })
        onSuccess?.(result.username)
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
    <div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}



      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Фамилия */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
            Фамилия *
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите вашу фамилию"
            required
          />
        </div>

        {/* Имя */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
            Имя *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите ваше имя"
            required
          />
        </div>

        {/* Отчество */}
        <div>
          <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-2">
            Отчество
          </label>
          <input
            type="text"
            id="middle_name"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите ваше отчество"
          />
        </div>

        {/* Телефон */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Телефон
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+7(999)123-45-67"
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
            placeholder="your.email@example.com"
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


        {/* Специализация */}
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
            Специализация *
          </label>
          <select
            id="specialization"
            name="specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Выберите вашу специализацию</option>
            <option value="Электрик">Электрик (электросистемы, электроника)</option>
            <option value="Гидравлик">Гидравлик (гидросистемы, насосы)</option>
            <option value="Двигателист">Двигателист (двигатели, моторы)</option>
            <option value="Механик">Механик (механические узлы, трансмиссия)</option>
            <option value="Ходовая часть">Специалист по ходовой части</option>
            <option value="Рабочее оборудование">Специалист по рабочему оборудованию</option>
            <option value="Системы управления">Специалист по системам управления</option>
            <option value="Пневматика">Специалист по пневматике</option>
            <option value="Тормозные системы">Специалист по тормозным системам</option>
            <option value="Топливные системы">Специалист по топливным системам</option>
            <option value="Диагностика">Диагностика и контроль</option>
            <option value="Универсал">Универсал (многофункциональный специалист)</option>
          </select>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContractorRegistrationForm
