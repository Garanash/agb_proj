'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  department_id?: number
}

export default function SimpleHome() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()


  useEffect(() => {
    console.log('🔍 Checking localStorage...')
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user')
      
      console.log('📦 Token:', token ? 'exists' : 'missing')
      console.log('👤 User data:', userData ? 'exists' : 'missing')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          console.log('✅ User loaded from localStorage:', parsedUser)
        } catch (error) {
          console.error('❌ Error parsing user data:', error)
        }
      }
    }
    
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    console.log('🚪 Logging out...')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
    setUser(null)
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Felix Platform</h1>
          <p className="text-xl text-gray-600 mb-8">Корпоративная платформа</p>
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Войти в систему
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Добро пожаловать, {user.first_name} {user.last_name}!
            </h1>
            <p className="text-xl text-gray-600">Главная страница корпоративной платформы Felix</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Выйти
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Информация о пользователе</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Имя пользователя:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Роль:</strong> {user.role}</p>
            </div>
            <div>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Активен:</strong> {user.is_active ? 'Да' : 'Нет'}</p>
              <p><strong>Отдел:</strong> {user.department_id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
