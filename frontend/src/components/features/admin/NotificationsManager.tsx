'use client'

import React, { useState, useEffect } from 'react'
import { 
  BellIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils'
import { useAuth } from '@/hooks'

interface NotificationTemplate {
  id: number
  name: string
  title_template: string
  message_template: string
  type: string
  channels: string[]
  variables: string[]
  description?: string
  created_at: string
  updated_at?: string
}

interface NotificationStats {
  period_days: number
  total_activities: number
  notifications_sent: number
  success_rate: number
}

const NotificationsManager: React.FC = () => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'templates' | 'send' | 'stats'>('templates')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [sendingNotification, setSendingNotification] = useState(false)

  const notificationTypes = [
    { value: 'info', label: 'Информация', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    { value: 'warning', label: 'Предупреждение', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
    { value: 'error', label: 'Ошибка', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
    { value: 'success', label: 'Успех', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' }
  ]

  const channels = [
    { value: 'email', label: 'Email', icon: EnvelopeIcon },
    { value: 'telegram', label: 'Telegram', icon: ChatBubbleLeftRightIcon },
    { value: 'slack', label: 'Slack', icon: ChatBubbleLeftRightIcon },
    { value: 'discord', label: 'Discord', icon: ChatBubbleLeftRightIcon },
    { value: 'webhook', label: 'Webhook', icon: LinkIcon }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadTemplates(),
        loadStats()
      ])
    } catch (err) {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/notifications/notifications/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки шаблонов:', err)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/notifications/notifications/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err)
    }
  }

  const createTemplate = async (templateData: Partial<NotificationTemplate>) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/notifications/notifications/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      })
      
      if (response.ok) {
        await loadTemplates()
        setShowCreateTemplate(false)
      }
    } catch (err) {
      console.error('Ошибка создания шаблона:', err)
    }
  }

  const updateTemplate = async (templateId: number, templateData: Partial<NotificationTemplate>) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/notifications/notifications/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      })
      
      if (response.ok) {
        await loadTemplates()
        setEditingTemplate(null)
      }
    } catch (err) {
      console.error('Ошибка обновления шаблона:', err)
    }
  }

  const deleteTemplate = async (templateId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return
    
    try {
      const response = await fetch(`${getApiUrl()}/v3/notifications/notifications/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await loadTemplates()
      }
    } catch (err) {
      console.error('Ошибка удаления шаблона:', err)
    }
  }

  const sendNotification = async (formData: FormData) => {
    setSendingNotification(true)
    try {
      const notificationData = {
        user_id: parseInt(formData.get('user_id') as string),
        title: formData.get('title') as string,
        message: formData.get('message') as string,
        type: formData.get('type') as string,
        channels: formData.getAll('channels') as string[],
        data: formData.get('data') ? JSON.parse(formData.get('data') as string) : {}
      }

      const response = await fetch(`${getApiUrl()}/v3/notifications/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      })
      
      if (response.ok) {
        alert('Уведомление отправлено!')
        // Очищаем форму
        const form = document.getElementById('notification-form') as HTMLFormElement
        if (form) form.reset()
      } else {
        alert('Ошибка отправки уведомления')
      }
    } catch (err) {
      alert('Ошибка отправки уведомления')
    } finally {
      setSendingNotification(false)
    }
  }

  const sendTestNotification = async (userId: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/notifications/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          channels: ['email']
        })
      })
      
      if (response.ok) {
        alert('Тестовое уведомление отправлено!')
      }
    } catch (err) {
      alert('Ошибка отправки тестового уведомления')
    }
  }

  const getTypeColor = (type: string) => {
    const typeInfo = notificationTypes.find(t => t.value === type)
    return typeInfo?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }

  const getChannelIcon = (channel: string) => {
    const channelInfo = channels.find(c => c.value === channel)
    const Icon = channelInfo?.icon || LinkIcon
    return <Icon className="h-4 w-4" />
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
      {/* Вкладки */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'templates', name: 'Шаблоны', icon: BellIcon },
            { id: 'send', name: 'Отправить', icon: PlayIcon },
            { id: 'stats', name: 'Статистика', icon: CheckCircleIcon }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Шаблоны уведомлений */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Шаблоны уведомлений
            </h3>
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Создать шаблон</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description || 'Без описания'}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Редактировать"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Тип</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(template.type)}`}>
                      {notificationTypes.find(t => t.value === template.type)?.label || template.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Каналы</span>
                    <div className="flex space-x-1">
                      {template.channels.map((channel) => (
                        <span key={channel} className="text-xs text-gray-500">
                          {getChannelIcon(channel)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Переменные: {template.variables.join(', ') || 'Нет'}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <p className="truncate" title={template.title_template}>
                    Заголовок: {template.title_template}
                  </p>
                  <p className="truncate" title={template.message_template}>
                    Сообщение: {template.message_template}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Отправка уведомлений */}
      {activeTab === 'send' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Отправить уведомление
          </h3>

          <form
            id="notification-form"
            onSubmit={(e) => {
              e.preventDefault()
              sendNotification(new FormData(e.target as HTMLFormElement))
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID пользователя
                </label>
                <input
                  type="number"
                  name="user_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Тип уведомления
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {notificationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Заголовок
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сообщение
              </label>
              <textarea
                name="message"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Каналы отправки
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {channels.map((channel) => {
                  const Icon = channel.icon
                  return (
                    <label key={channel.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="channels"
                        value={channel.value}
                        defaultChecked={channel.value === 'email'}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Icon className="h-4 w-4" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {channel.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дополнительные данные (JSON)
              </label>
              <textarea
                name="data"
                rows={3}
                placeholder='{"key": "value"}'
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  const userId = (document.querySelector('input[name="user_id"]') as HTMLInputElement)?.value
                  if (userId) {
                    sendTestNotification(parseInt(userId))
                  } else {
                    alert('Введите ID пользователя для тестирования')
                  }
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Тест
              </button>
              <button
                type="submit"
                disabled={sendingNotification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sendingNotification ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Статистика */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Статистика уведомлений
          </h3>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <BellIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Всего активностей
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {stats.total_activities.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Уведомлений отправлено
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {stats.notifications_sent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Успешность
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {stats.success_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно создания/редактирования шаблона */}
      {(showCreateTemplate || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const templateData = {
                name: formData.get('name'),
                title_template: formData.get('title_template'),
                message_template: formData.get('message_template'),
                type: formData.get('type'),
                channels: formData.getAll('channels') as string[],
                variables: formData.get('variables')?.toString().split(',').map(v => v.trim()).filter(v => v) || [],
                description: formData.get('description')
              }
              
              if (editingTemplate) {
                updateTemplate(editingTemplate.id, templateData)
              } else {
                createTemplate(templateData)
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Название шаблона
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTemplate?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Описание
                  </label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={editingTemplate?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Тип уведомления
                    </label>
                    <select
                      name="type"
                      defaultValue={editingTemplate?.type || 'info'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Переменные (через запятую)
                    </label>
                    <input
                      type="text"
                      name="variables"
                      defaultValue={editingTemplate?.variables.join(', ') || ''}
                      placeholder="user_name, order_id, amount"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Шаблон заголовка
                  </label>
                  <input
                    type="text"
                    name="title_template"
                    defaultValue={editingTemplate?.title_template || ''}
                    placeholder="Уведомление для {user_name}"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Шаблон сообщения
                  </label>
                  <textarea
                    name="message_template"
                    defaultValue={editingTemplate?.message_template || ''}
                    placeholder="Здравствуйте, {user_name}! Ваш заказ #{order_id} на сумму {amount} руб. готов."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Каналы отправки
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {channels.map((channel) => {
                      const Icon = channel.icon
                      return (
                        <label key={channel.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="channels"
                            value={channel.value}
                            defaultChecked={editingTemplate?.channels.includes(channel.value) || channel.value === 'email'}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <Icon className="h-4 w-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {channel.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTemplate(false)
                    setEditingTemplate(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Отменить
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingTemplate ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsManager
