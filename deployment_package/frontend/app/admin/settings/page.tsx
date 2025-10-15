'use client'

import React from 'react'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { CogIcon } from '@heroicons/react/24/outline'
import SystemSettingsPanel from '@/src/components/features/admin/SystemSettingsPanel'

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (user && user.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CogIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки системы</h1>
              <p className="text-gray-600 dark:text-gray-300">Управление всеми настройками платформы</p>
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
        <SystemSettingsPanel />
      </div>
    </div>
  )
}
