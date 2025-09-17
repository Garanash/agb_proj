'use client'

import React, { useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log('AuthGuard state:', { isAuthenticated, isLoading, user: !!user, pathname })

  useEffect(() => {
    // Если загрузка завершена и пользователь не авторизован
    if (!isLoading && !isAuthenticated) {
      // Если уже на странице входа, не перенаправляем
      if (pathname !== '/login') {
        router.push('/login')
      }
    }
    
    // Если пользователь авторизован и находится на странице входа
    if (!isLoading && isAuthenticated && pathname === '/login') {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Показываем загрузку пока проверяем аутентификацию
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

  // Если на странице входа или регистрации, показываем их всегда
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>
  }

  // Если пользователь не авторизован и не на странице входа, ничего не показываем
  // (будет выполнен редирект в useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Пользователь авторизован, показываем контент
  return <>{children}</>
}

export default AuthGuard
