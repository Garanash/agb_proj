'use client'

import React, { useState, useEffect } from 'react'
import { 
  CogIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  ChartBarIcon,
  LinkIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils/api'
import { useAuth } from '@/hooks'
import RolePermissionsManager from './RolePermissionsManager'
import IntegrationsManager from './IntegrationsManager'
import NotificationsManager from './NotificationsManager'

interface EmailSettings {
  id: number
  name: string
  smtp_server: string
  smtp_port: number
  username: string
  from_email: string
  from_name?: string
  use_tls: boolean
  use_ssl: boolean
  is_active: boolean
  is_default: boolean
  created_at: string
}

interface Integration {
  id: number
  name: string
  type: string
  is_active: boolean
  config: Record<string, any>
  created_at: string
}

interface ApiUsageStats {
  user_id: number
  total_requests: number
  unique_users: number
  billing_info: {
    plan: string
    total_cost: number
    cost_in_rubles: number
    remaining_requests: number
  }
}

const SystemSettingsPanel: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [apiStats, setApiStats] = useState<ApiUsageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: CogIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'integrations', name: 'Интеграции', icon: LinkIcon },
    { id: 'roles', name: 'Роли', icon: UserGroupIcon },
    { id: 'notifications', name: 'Уведомления', icon: BellIcon },
    { id: 'analytics', name: 'Аналитика', icon: ChartBarIcon },
    { id: 'billing', name: 'Биллинг', icon: CurrencyDollarIcon },
    { id: 'security', name: 'Безопасность', icon: ShieldCheckIcon }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadEmailSettings(),
        loadIntegrations(),
        loadApiStats()
      ])
    } catch (err) {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const loadEmailSettings = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/email/email-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEmailSettings(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек email:', err)
    }
  }

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/integrations/integrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки интеграций:', err)
    }
  }

  const loadApiStats = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/analytics/api-usage`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setApiStats(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки статистики API:', err)
    }
  }

  const testEmailConnection = async (settingsId: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/email/email-settings/${settingsId}/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.success ? 'Подключение успешно!' : `Ошибка: ${result.error}`)
      }
    } catch (err) {
      alert('Ошибка тестирования подключения')
    }
  }

  const testIntegration = async (integrationId: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/integrations/integrations/${integrationId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.success ? 'Интеграция работает!' : `Ошибка: ${result.error}`)
      }
    } catch (err) {
      alert('Ошибка тестирования интеграции')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Заголовок */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Настройки системы
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Управление всеми настройками платформы
        </p>
      </div>

      <div className="flex">
        {/* Боковая навигация */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Основной контент */}
        <div className="flex-1 p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Обзор */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Обзор системы</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Email настройки
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {emailSettings.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <LinkIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Интеграции
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {integrations.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        API запросы
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {apiStats?.total_requests || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Быстрые действия
                </h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('email')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Настроить Email
                  </button>
                  <button
                    onClick={() => setActiveTab('integrations')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Добавить интеграцию
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Посмотреть аналитику
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email настройки */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Настройки Email
                </h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Добавить настройки
                </button>
              </div>

              <div className="space-y-4">
                {emailSettings.map((setting) => (
                  <div key={setting.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {setting.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {setting.smtp_server}:{setting.smtp_port}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          От: {setting.from_name} &lt;{setting.from_email}&gt;
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            setting.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {setting.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                          {setting.is_default && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              По умолчанию
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => testEmailConnection(setting.id)}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Тест
                        </button>
                        <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors">
                          Редактировать
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Интеграции */}
          {activeTab === 'integrations' && (
            <IntegrationsManager />
          )}

          {/* Аналитика */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Аналитика API
              </h3>

              {apiStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Использование API
                    </h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {apiStats.total_requests.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Всего запросов
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Стоимость
                    </h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {apiStats.billing_info.cost_in_rubles.toFixed(2)} ₽
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      План: {apiStats.billing_info.plan}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Биллинг */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Биллинг и подписки
              </h3>

              {apiStats && (
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Текущий план
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">План</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {apiStats.billing_info.plan}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Осталось запросов</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {apiStats.billing_info.remaining_requests === -1 
                          ? 'Безлимит' 
                          : apiStats.billing_info.remaining_requests.toLocaleString()
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Стоимость</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {apiStats.billing_info.cost_in_rubles.toFixed(2)} ₽
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Роли */}
          {activeTab === 'roles' && (
            <RolePermissionsManager />
          )}

          {/* Уведомления */}
          {activeTab === 'notifications' && (
            <NotificationsManager />
          )}

          {/* Безопасность */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Настройки безопасности
              </h3>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  Здесь будут настройки безопасности системы
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemSettingsPanel
