'use client'

import React, { useState } from 'react'
import { getApiUrl } from '@/utils';
import { LoginForm } from '@/components/features/auth'
import { Logo } from '@/components/ui'
import { RegistrationModal } from '@/components/features/auth'

export default function LoginPage() {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  console.log('Login page rendered')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
                {/* Логотип компании */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo width={120} height={80} className="logo-svg login-logo" />
          </div>
          <div className="mb-2">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Felix</h1>
            <p className="text-xl text-gray-600">Корпоративная платформа</p>
          </div>
        </div>

        {/* Форма входа */}
        <div className="mb-8">
          <LoginForm />
        </div>

        {/* Ссылка на регистрацию */}
        <div className="text-center mb-4">
          <div className="text-sm">
            <p className="text-gray-600 mb-2">
              Нет аккаунта?{' '}
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="text-blue-600 hover:text-blue-800 font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                Зарегистрироваться
              </button>
            </p>
            <p className="text-gray-500">Нужна помощь с входом в систему? Обратитесь к администратору</p>
          </div>
        </div>

        {/* Футер */}
        <div className="text-center text-xs text-gray-400">
          <p>&copy; 2025 Алмазгеобур. Все права защищены.</p>
        </div>
      </div>

      {/* Модальное окно регистрации */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />
    </div>
  )
}
