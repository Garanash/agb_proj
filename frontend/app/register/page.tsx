'use client'

import React, { useState, useEffect } from 'react'
import { RegistrationModal } from '@/components/features/auth'

export default function RegisterPage() {
  const [isModalOpen, setIsModalOpen] = useState(true)

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Перенаправляем на главную страницу
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Фон с информацией */}
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Felix
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Корпоративная платформа
          </p>
          <p className="text-gray-500">
            Регистрация пользователей
          </p>
        </div>

        {/* Кнопка открытия модального окна */}
        {!isModalOpen && (
          <div className="space-y-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Начать регистрацию
            </button>
            <div>
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Уже есть аккаунт? Войти
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно регистрации */}
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
