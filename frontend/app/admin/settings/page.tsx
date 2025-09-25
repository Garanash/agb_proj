'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { 
  CogIcon, 
  KeyIcon, 
  ShieldCheckIcon,
  ServerIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline'
import ApiKeysSettings from '@/components/ApiKeysSettings'

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'api-keys' | 'system' | 'security' | 'database'>('api-keys')

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (user && user.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  const tabs = [
    { id: 'api-keys', name: 'API ключи', icon: KeyIcon, description: 'Управление ключами для ИИ-сервисов' },
    { id: 'system', name: 'Система', icon: ServerIcon, description: 'Настройки системы' },
    { id: 'security', name: 'Безопасность', icon: ShieldCheckIcon, description: 'Настройки безопасности' },
    { id: 'database', name: 'База данных', icon: CircleStackIcon, description: 'Управление базой данных' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CogIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки системы</h1>
              <p className="text-gray-600 dark:text-gray-300">Управление конфигурацией и API ключами</p>
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
        {/* Вкладки */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Содержимое вкладок */}
        <div className="space-y-6">
          {activeTab === 'api-keys' && <ApiKeysSettings />}
          
          {activeTab === 'system' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Настройки системы</h2>
              <p className="text-gray-600 dark:text-gray-300">Здесь будут настройки системы...</p>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Настройки безопасности</h2>
              <p className="text-gray-600 dark:text-gray-300">Здесь будут настройки безопасности...</p>
            </div>
          )}
          
          {activeTab === 'database' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Управление базой данных</h2>
              <p className="text-gray-600 dark:text-gray-300">Здесь будут настройки базы данных...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
