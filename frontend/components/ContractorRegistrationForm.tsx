'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils/api';

interface ContractorRegistrationFormProps {
  onSuccess?: () => void
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

    // Паспортные данные
    passport_series: '',
    passport_number: '',
    passport_issued_by: '',
    passport_issued_date: '',
    passport_division_code: '',

    // Адрес
    registration_address: '',

    // Профессиональные данные
    specialization: '',
    experience_years: '',
    skills: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        passport_series: formData.passport_series || undefined,
        passport_number: formData.passport_number || undefined,
        passport_issued_by: formData.passport_issued_by || undefined,
        passport_issued_date: formData.passport_issued_date || undefined,
        passport_division_code: formData.passport_division_code || undefined,
        registration_address: formData.registration_address || undefined,
        specialization: formData.specialization,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
        skills: formData.skills || undefined
      }

      const response = await fetch(`${getApiUrl()}/api/contractors/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(`Регистрация успешна! Ваш логин: ${result.username}\n\nСсылка на Telegram бота будет доступна в личном кабинете после входа в систему.`)
        setFormData({
          email: '', password: '', confirmPassword: '', first_name: '', last_name: '', middle_name: '',
          phone: '', passport_series: '', passport_number: '', passport_issued_by: '',
          passport_issued_date: '', passport_division_code: '', registration_address: '',
          specialization: '', experience_years: '', skills: ''
        })

        setTimeout(() => {
          onSuccess?.()
        }, 3000)
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
          Регистрация исполнителя
        </h2>
        <p className="text-center text-gray-600">
          Создайте аккаунт для выполнения ремонтных работ
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 whitespace-pre-line">{success}</p>
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
            <div className="md:col-span-2">
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

        {/* Паспортные данные */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Паспортные данные</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="passport_series" className="block text-sm font-medium text-gray-700 mb-1">
                Серия паспорта
              </label>
              <input
                type="text"
                id="passport_series"
                name="passport_series"
                value={formData.passport_series}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234"
              />
            </div>
            <div>
              <label htmlFor="passport_number" className="block text-sm font-medium text-gray-700 mb-1">
                Номер паспорта
              </label>
              <input
                type="text"
                id="passport_number"
                name="passport_number"
                value={formData.passport_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="567890"
              />
            </div>
            <div>
              <label htmlFor="passport_issued_by" className="block text-sm font-medium text-gray-700 mb-1">
                Кем выдан
              </label>
              <input
                type="text"
                id="passport_issued_by"
                name="passport_issued_by"
                value={formData.passport_issued_by}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="passport_issued_date" className="block text-sm font-medium text-gray-700 mb-1">
                Дата выдачи
              </label>
              <input
                type="date"
                id="passport_issued_date"
                name="passport_issued_date"
                value={formData.passport_issued_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="passport_division_code" className="block text-sm font-medium text-gray-700 mb-1">
                Код подразделения
              </label>
              <input
                type="text"
                id="passport_division_code"
                name="passport_division_code"
                value={formData.passport_division_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123-456"
              />
            </div>
            <div>
              <label htmlFor="registration_address" className="block text-sm font-medium text-gray-700 mb-1">
                Адрес регистрации
              </label>
              <input
                type="text"
                id="registration_address"
                name="registration_address"
                value={formData.registration_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Профессиональные данные */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Профессиональные данные</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
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
                <option value="">Выберите специализацию</option>
                <option value="Электрик">Электрик</option>
                <option value="Сантехник">Сантехник</option>
                <option value="Плотник">Плотник</option>
                <option value="Маляр">Маляр</option>
                <option value="Штукатур">Штукатур</option>
                <option value="Каменщик">Каменщик</option>
                <option value="Кровельщик">Кровельщик</option>
                <option value="Универсал">Универсал</option>
              </select>
            </div>
            <div>
              <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-1">
                Стаж работы (лет)
              </label>
              <input
                type="number"
                id="experience_years"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                min="0"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                Навыки и опыт
              </label>
              <textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Опишите ваши навыки, опыт работы, используемое оборудование..."
              />
            </div>
          </div>
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
