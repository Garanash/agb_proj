'use client'

import React from 'react'
import { getApiUrl } from '@/utils/api';
import LoginForm from '@/components/LoginForm'
import Logo from '@/components/Logo'

export default function LoginPage() {
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

        {/* Дополнительная информация */}
        <div className="text-center mb-4">
          <div className="text-sm text-gray-500">
            <p className="mb-2">Нужна помощь с входом в систему?</p>
            <p>Обратитесь к администратору</p>
          </div>
        </div>

        {/* Футер */}
        <div className="text-center text-xs text-gray-400">
          <p>&copy; 2025 Алмазгеобур. Все права защищены.</p>
        </div>
      </div>
    </div>
  )
}
