'use client'

import { useAuth } from '@/hooks'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, isAuthenticated, isLoading, token, hasInitialized } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Отладочная информация</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Состояние аутентификации</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">isLoading:</label>
              <p className="text-sm text-gray-900">{isLoading ? 'true' : 'false'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">isAuthenticated:</label>
              <p className="text-sm text-gray-900">{isAuthenticated ? 'true' : 'false'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">hasInitialized:</label>
              <p className="text-sm text-gray-900">{hasInitialized ? 'true' : 'false'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Токен:</label>
              <p className="text-sm text-gray-900">{token ? 'Присутствует' : 'Отсутствует'}</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о пользователе</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID:</label>
                <p className="text-sm text-gray-900">{user.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Username:</label>
                <p className="text-sm text-gray-900">{user.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email:</label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Роль:</label>
                <p className="text-sm text-gray-900">{user.role}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Полное имя:</label>
                <p className="text-sm text-gray-900">{`${user.first_name} ${user.last_name}` || 'Не определено'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Действия</h2>
          
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              На главную
            </button>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Страница входа
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



