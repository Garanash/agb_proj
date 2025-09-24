'use client'

import React, { useState, useEffect } from 'react'
import { 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ApiKey {
  id: string
  name: string
  provider: 'openai' | 'polza' | 'custom'
  key: string
  is_active: boolean
  created_at: string
  last_used?: string
}

interface ApiKeysSettingsProps {
  onClose?: () => void
}

export default function ApiKeysSettings({ onClose }: ApiKeysSettingsProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'polza' | 'custom',
    key: '',
    is_active: true
  })
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/settings/api-keys/', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApiKeys(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки API ключей:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const url = editingKey 
        ? `http://localhost:8000/api/v1/settings/api-keys/${editingKey.id}/`
        : 'http://localhost:8000/api/v1/settings/api-keys/'
      
      const method = editingKey ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: editingKey ? 'API ключ обновлен' : 'API ключ добавлен' })
        setShowAddForm(false)
        setEditingKey(null)
        setFormData({ name: '', provider: 'openai', key: '', is_active: true })
        loadApiKeys()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Ошибка при сохранении' })
      }
    } catch (error) {
      console.error('Ошибка сохранения API ключа:', error)
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот API ключ?')) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/settings/api-keys/${id}/`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'API ключ удален' })
        loadApiKeys()
      } else {
        setMessage({ type: 'error', text: 'Ошибка при удалении' })
      }
    } catch (error) {
      console.error('Ошибка удаления API ключа:', error)
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
    }
  }

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key)
    setFormData({
      name: key.name,
      provider: key.provider,
      key: key.key,
      is_active: key.is_active
    })
    setShowAddForm(true)
  }

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length)
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'openai':
        return { name: 'OpenAI', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' }
      case 'polza':
        return { name: 'Polza.ai', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' }
      case 'custom':
        return { name: 'Пользовательский', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
      default:
        return { name: 'Неизвестно', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <KeyIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API ключи</h2>
            <p className="text-gray-600 dark:text-gray-300">Управление ключами для ИИ-сервисов</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true)
            setEditingKey(null)
            setFormData({ name: '', provider: 'openai', key: '', is_active: true })
          }}
          className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Добавить ключ</span>
        </button>
      </div>

      {/* Сообщения */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingKey ? 'Редактировать API ключ' : 'Добавить новый API ключ'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Название
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Например: OpenAI Production Key"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Провайдер
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="openai">OpenAI</option>
                <option value="polza">Polza.ai</option>
                <option value="custom">Пользовательский</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API ключ
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Введите API ключ"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Активен
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : (editingKey ? 'Обновить' : 'Добавить')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingKey(null)
                  setFormData({ name: '', provider: 'openai', key: '', is_active: true })
                }}
                className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список API ключей */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Сохраненные ключи</h3>
        </div>
        
        {apiKeys.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <KeyIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>Нет сохраненных API ключей</p>
            <p className="text-sm">Добавьте первый ключ для начала работы с ИИ-сервисами</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {apiKeys.map((key) => {
              const providerInfo = getProviderInfo(key.provider)
              return (
                <div key={key.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">{key.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${providerInfo.color}`}>
                          {providerInfo.name}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          key.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {key.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Ключ:</span>
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          {showKeys[key.id] ? key.key : maskKey(key.key)}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showKeys[key.id] ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Создан: {new Date(key.created_at).toLocaleDateString('ru-RU')}
                        {key.last_used && (
                          <span className="ml-4">
                            Последнее использование: {new Date(key.last_used).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(key)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Редактировать"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Удалить"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
