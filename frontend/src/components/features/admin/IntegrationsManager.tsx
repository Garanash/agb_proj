'use client'

import React, { useState, useEffect } from 'react'
import { 
  LinkIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils'
import { useAuth } from '@/hooks'

interface Integration {
  id: number
  name: string
  type: string
  is_active: boolean
  config: Record<string, any>
  created_at: string
  updated_at?: string
}

interface SupportedIntegration {
  type: string
  name: string
  description: string
  config_fields: string[]
  webhook_supported: boolean
}

const IntegrationsManager: React.FC = () => {
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [supportedIntegrations, setSupportedIntegrations] = useState<SupportedIntegration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateIntegration, setShowCreateIntegration] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null)
  const [testingIntegration, setTestingIntegration] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadIntegrations(),
        loadSupportedIntegrations()
      ])
    } catch (err) {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
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

  const loadSupportedIntegrations = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/integrations/integrations/supported`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSupportedIntegrations(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки поддерживаемых интеграций:', err)
    }
  }

  const createIntegration = async (integrationData: Partial<Integration>) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/integrations/integrations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(integrationData)
      })
      
      if (response.ok) {
        await loadIntegrations()
        setShowCreateIntegration(false)
      }
    } catch (err) {
      console.error('Ошибка создания интеграции:', err)
    }
  }

  const updateIntegration = async (integrationId: number, integrationData: Partial<Integration>) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/integrations/integrations/${integrationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(integrationData)
      })
      
      if (response.ok) {
        await loadIntegrations()
        setEditingIntegration(null)
      }
    } catch (err) {
      console.error('Ошибка обновления интеграции:', err)
    }
  }

  const deleteIntegration = async (integrationId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту интеграцию?')) return
    
    try {
      const response = await fetch(`${getApiUrl()}/v3/integrations/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await loadIntegrations()
      }
    } catch (err) {
      console.error('Ошибка удаления интеграции:', err)
    }
  }

  const testIntegration = async (integrationId: number) => {
    setTestingIntegration(integrationId)
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
    } finally {
      setTestingIntegration(null)
    }
  }

  const sendTestNotification = async (integrationId: number) => {
    const message = prompt('Введите тестовое сообщение:')
    if (!message) return

    try {
      const response = await fetch(`${getApiUrl()}/v3/integrations/integrations/${integrationId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })
      
      if (response.ok) {
        alert('Тестовое уведомление отправлено!')
      }
    } catch (err) {
      alert('Ошибка отправки уведомления')
    }
  }

  const getIntegrationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'telegram': '📱',
      'slack': '💬',
      'discord': '🎮',
      'webhook': '🔗',
      'n8n': '⚡',
      'zapier': '🔌'
    }
    return icons[type] || '🔧'
  }

  const getIntegrationColor = (type: string) => {
    const colors: Record<string, string> = {
      'telegram': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'slack': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      'discord': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      'webhook': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      'n8n': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'zapier': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Управление интеграциями
        </h3>
        <button
          onClick={() => setShowCreateIntegration(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Добавить интеграцию</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Список интеграций */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {integration.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {integration.type}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => testIntegration(integration.id)}
                  disabled={testingIntegration === integration.id}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                  title="Тестировать"
                >
                  {testingIntegration === integration.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setEditingIntegration(integration)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Редактировать"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteIntegration(integration.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Удалить"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Статус</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  integration.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {integration.is_active ? 'Активна' : 'Неактивна'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Тип</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getIntegrationColor(integration.type)}`}>
                  {integration.type}
                </span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => testIntegration(integration.id)}
                disabled={testingIntegration === integration.id || !integration.is_active}
                className="flex-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Тест
              </button>
              <button
                onClick={() => sendTestNotification(integration.id)}
                disabled={!integration.is_active}
                className="flex-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно создания/редактирования интеграции */}
      {(showCreateIntegration || editingIntegration) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingIntegration ? 'Редактировать интеграцию' : 'Создать интеграцию'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const integrationData = {
                name: formData.get('name') as string || '',
                type: formData.get('type') as string || '',
                is_active: formData.get('is_active') === 'on',
                config: JSON.parse(formData.get('config') as string || '{}')
              }
              
              if (editingIntegration) {
                updateIntegration(editingIntegration.id, integrationData)
              } else {
                createIntegration(integrationData)
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Название интеграции
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingIntegration?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Тип интеграции
                  </label>
                  <select
                    name="type"
                    defaultValue={editingIntegration?.type || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Выберите тип</option>
                    {supportedIntegrations.map((integration) => (
                      <option key={integration.type} value={integration.type}>
                        {integration.name} - {integration.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Конфигурация (JSON)
                  </label>
                  <textarea
                    name="config"
                    defaultValue={JSON.stringify(editingIntegration?.config || {}, null, 2)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                    rows={8}
                    placeholder='{"key": "value"}'
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingIntegration?.is_active ?? true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Активна
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateIntegration(false)
                    setEditingIntegration(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Отменить
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {editingIntegration ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Справочная информация */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Поддерживаемые интеграции
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportedIntegrations.map((integration) => (
            <div key={integration.type} className="flex items-start space-x-3">
              <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
              <div>
                <h5 className="font-medium text-blue-900 dark:text-blue-100">
                  {integration.name}
                </h5>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {integration.description}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Поля: {integration.config_fields.join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default IntegrationsManager
