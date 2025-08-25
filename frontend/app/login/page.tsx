'use client'

import React from 'react'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Логотип компании */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="https://almazgeobur.kz/wp-content/uploads/2021/08/agb_logo_h-2.svg" 
              alt="Алмазгеобур" 
              className="h-16 w-auto logo-custom-colors"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Felix</h1>
          <p className="text-gray-600">Корпоративная платформа Алмазгеобур</p>
        </div>

        {/* Форма входа */}
        <LoginForm />

        {/* Дополнительная информация */}
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-500">
            <p className="mb-2">Нужна помощь с входом в систему?</p>
            <p>Обратитесь к администратору</p>
          </div>
        </div>

        {/* Футер */}
        <div className="mt-12 text-center text-xs text-gray-400">
          <p>&copy; 2024 Алмазгеобур. Все права защищены.</p>
        </div>
      </div>
    </div>
  )
}
