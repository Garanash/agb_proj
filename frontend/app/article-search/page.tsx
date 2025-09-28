'use client'

import React from 'react'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ArticleSearchManager from '../../src/components/features/admin/ArticleSearchManager'

export default function ArticleSearchPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  // Проверяем права доступа
  const allowedRoles = ['admin', 'manager', 'ved_passport']
  if (user && !allowedRoles.includes(user.role)) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MagnifyingGlassIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Поиск поставщиков артикулов</h1>
              <p className="text-gray-600 dark:text-gray-300">Поиск поставщиков через ИИ с валидацией контактов</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Назад
          </button>
        </div>
      </div>

      <div className="p-6">
        <ArticleSearchManager />
      </div>
    </div>
  )
}
