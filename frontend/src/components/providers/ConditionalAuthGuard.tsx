'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import AppLayout from '../../../components/AppLayout'

interface ConditionalAuthGuardProps {
  children: React.ReactNode
}

// Страницы, которые не требуют аутентификации
const PUBLIC_PAGES = [
  '/login',
  '/register',
  '/about'
]

// Страницы, которые требуют аутентификации
const PROTECTED_PAGES = [
  '/dashboard',
  '/projects',
  '/news',
  '/reports',
  '/users',
  '/settings',
  '/ved-passports',
  '/chat',
  '/admin'
]

const ConditionalAuthGuard: React.FC<ConditionalAuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log('ConditionalAuthGuard state:', { isAuthenticated, isLoading, user: !!user, pathname })

  // Определяем, нужна ли аутентификация для текущей страницы
  const isPublicPage = PUBLIC_PAGES.includes(pathname) || pathname.startsWith('/about')
  const isProtectedPage = PROTECTED_PAGES.some(page => pathname.startsWith(page))
  const needsAuth = isProtectedPage && !isPublicPage

  useEffect(() => {
    // Если страница требует аутентификации
    if (needsAuth) {
      // Если загрузка завершена и пользователь не авторизован
      if (!isLoading && !isAuthenticated) {
        router.push('/login')
      }
    }
    
    // Если пользователь авторизован и находится на странице входа
    if (!isLoading && isAuthenticated && pathname === '/login') {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router, pathname, needsAuth])

  // Если страница не требует аутентификации, показываем её как есть
  if (isPublicPage) {
    return <>{children}</>
  }

  // Если страница требует аутентификации
  if (needsAuth) {
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

    // Если пользователь не авторизован, ничего не показываем
    // (будет выполнен редирект в useEffect)
    if (!isAuthenticated) {
      return null
    }

    // Пользователь авторизован, показываем контент с AppLayout
    return <AppLayout>{children}</AppLayout>
  }

  // Для остальных страниц (например, главная страница) показываем без AppLayout
  return <>{children}</>
}

export default ConditionalAuthGuard
