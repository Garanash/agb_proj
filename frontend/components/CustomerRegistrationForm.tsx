'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils/api';

interface CustomerRegistrationFormProps {
  onSuccess?: () => void
}

const CustomerRegistrationForm: React.FC<CustomerRegistrationFormProps> = ({
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

    // Данные компании
    company_name: '',
    contact_person: '',
    company_phone: '',
    company_email: '',
    address: '',
    inn: '',
    kpp: '',
    ogrn: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!formData.company_name.trim()) return 'Название компании обязательно'
    if (!formData.contact_person.trim()) return 'Контактное лицо обязательно'
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
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        phone: formData.phone,
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        company_phone: formData.company_phone,
        company_email: formData.company_email,
        address: formData.address,
        inn: formData.inn,
        kpp: formData.kpp,
        ogrn: formData.ogrn
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
        setSuccess(`Регистрация успешна! Ваш логин: ${result.username}`)
        setFormData({
          email: '', password: '', confirmPassword: '', first_name: '', last_name: '', middle_name: '',
          phone: '', company_name: '', contact_person: '', company_phone: '', company_email: '',
          address: '', inn: '', kpp: '', ogrn: ''
        })

        setTimeout(() => {
          onSuccess?.()
        }, 2000)
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

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Данные пользователя */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Личные данные</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Имя *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-1">
                Отчество
              </label>
              <input
                type="text"
                id="middle_name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
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
          </div>
        </div>

        {/* Данные для входа */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Данные для входа</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email компании *
              </label>
              <input
                type="email"
                id="company_email"
                name="company_email"
                value={formData.company_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Подтверждение пароля *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Данные компании */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Данные компании</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                Название компании *
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                Контактное лицо *
              </label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефон компании *
              </label>
              <input
                type="tel"
                id="company_phone"
                name="company_phone"
                value={formData.company_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Адрес
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="inn" className="block text-sm font-medium text-gray-700 mb-1">
                ИНН
              </label>
              <input
                type="text"
                id="inn"
                name="inn"
                value={formData.inn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="kpp" className="block text-sm font-medium text-gray-700 mb-1">
                КПП
              </label>
              <input
                type="text"
                id="kpp"
                name="kpp"
                value={formData.kpp}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="ogrn" className="block text-sm font-medium text-gray-700 mb-1">
                ОГРН
              </label>
              <input
                type="text"
                id="ogrn"
                name="ogrn"
                value={formData.ogrn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
    </div>
  )
}

export default CustomerRegistrationForm
