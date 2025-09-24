'use client'

import React, { useEffect, useState } from 'react'
import { getApiUrl } from '@/utils';
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [redirecting, setRedirecting] = useState(false)

  console.log('AuthGuard state:', { 
    isAuthenticated, 
    isLoading, 
    user: !!user, 
    pathname, 
    redirecting,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    // Если загрузка завершена и пользователь не авторизован
    if (!isLoading && !isAuthenticated && !redirecting) {
      // Если уже на странице входа или регистрации, не перенаправляем
      if (pathname !== '/login' && pathname !== '/register') {
        console.log('Redirecting to login page')
        setRedirecting(true)
        router.push('/login')
      }
    }
    
    // Если пользователь авторизован и находится на странице входа
    if (!isLoading && isAuthenticated && !redirecting && (pathname === '/login' || pathname === '/register')) {
      console.log('Redirecting to home page')
      setRedirecting(true)
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router, pathname, redirecting])

  // Сброс флага редиректа при изменении пути
  useEffect(() => {
    setRedirecting(false)
  }, [pathname])

  // Таймаут для редиректа
  useEffect(() => {
    if (redirecting) {
      const timeout = setTimeout(() => {
        console.log('Redirect timeout, resetting redirect flag')
        setRedirecting(false)
      }, 3000) // 3 секунды таймаут для редиректа

      return () => clearTimeout(timeout)
    }
  }, [redirecting])

  // Если на странице входа или регистрации, показываем их всегда
  if (pathname === '/login' || pathname === '/register') {
    console.log('Showing auth page without check:', pathname)
    return <>{children}</>
  }

  // Если загрузка не завершена, показываем индикатор загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
          <p className="text-sm text-gray-500 mt-2">
            Инициализация аутентификации...
          </p>
        </div>
      </div>
    )
  }

  // Если пользователь не авторизован, показываем загрузку с сообщением о редиректе
  // (будет выполнен редирект в useEffect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Перенаправление на страницу входа...</p>
          <p className="text-sm text-gray-500 mt-2">Проверка аутентификации...</p>
        </div>
      </div>
    )
  }


  // Пользователь авторизован, показываем контент
  return <>{children}</>
}

export default AuthGuard
