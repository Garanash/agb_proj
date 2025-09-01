'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Перенаправляем в соответствующий кабинет в зависимости от роли
      switch (user.role) {
        case 'customer':
          router.push('/dashboard/customer')
          break
        case 'contractor':
          router.push('/dashboard/contractor')
          break
        case 'service_engineer':
          router.push('/')  // Главная страница с календарем и новостями
          break
        case 'admin':
          router.push('/admin')
          break
        default:
          router.push('/login')
          break
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, user, isLoading, router])

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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Перенаправление в личный кабинет...</p>
      </div>
    </div>
  )
}
