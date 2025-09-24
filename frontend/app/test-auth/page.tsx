'use client'

import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Перенаправление на страницу входа...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Тест аутентификации</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о пользователе</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ID пользователя:</label>
              <p className="text-sm text-gray-900">{user?.id || 'Не определен'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Имя пользователя:</label>
              <p className="text-sm text-gray-900">{user?.username || 'Не определен'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email:</label>
              <p className="text-sm text-gray-900">{user?.email || 'Не определен'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Роль:</label>
              <p className="text-sm text-gray-900">{user?.role || 'Не определена'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Полное имя:</label>
                <p className="text-sm text-gray-900">{user ? `${user.first_name} ${user.last_name}` : 'Не определено'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Токен:</label>
              <p className="text-sm text-gray-900 break-all">{token ? 'Присутствует' : 'Отсутствует'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Статус аутентификации:</label>
              <p className="text-sm text-gray-900">{isAuthenticated ? 'Авторизован' : 'Не авторизован'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



