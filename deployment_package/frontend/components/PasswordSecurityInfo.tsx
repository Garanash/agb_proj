'use client'

import { useState } from 'react'
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

interface PasswordSecurityInfoProps {
  user: any
}

export default function PasswordSecurityInfo({ user }: PasswordSecurityInfoProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: 'Не установлен', color: 'text-gray-500' }
    
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { score, label: 'Слабый', color: 'text-red-500' }
    if (score <= 4) return { score, label: 'Средний', color: 'text-yellow-500' }
    return { score, label: 'Сильный', color: 'text-green-500' }
  }

  const getSecurityRecommendations = () => {
    const recommendations = []
    
    if (!user?.is_password_changed) {
      recommendations.push({
        type: 'warning',
        message: 'Рекомендуется сменить пароль по умолчанию',
        icon: ExclamationTriangleIcon
      })
    }

    recommendations.push({
      type: 'info',
      message: 'Используйте уникальный пароль для каждого сервиса',
      icon: KeyIcon
    })

    recommendations.push({
      type: 'info',
      message: 'Регулярно обновляйте пароли (каждые 3-6 месяцев)',
      icon: ClockIcon
    })

    return recommendations
  }

  const recommendations = getSecurityRecommendations()

  return (
    <div className="space-y-4">
      {/* Статус безопасности */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-500" />
            Безопасность аккаунта
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Скрыть детали' : 'Показать детали'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Статус пароля */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Статус пароля</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                user?.is_password_changed ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                user?.is_password_changed ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {user?.is_password_changed ? 'Изменен' : 'По умолчанию'}
              </span>
            </div>
          </div>

          {/* Последнее изменение */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Последнее изменение</span>
            <span className="text-sm text-gray-900">
              {user?.is_password_changed ? 'Недавно' : 'Никогда'}
            </span>
          </div>

          {/* Дополнительные детали */}
          {showDetails && (
            <div className="pt-3 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Длина пароля</span>
                  <span className="text-sm text-gray-900">8+ символов</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Сложность</span>
                  <span className="text-sm text-gray-900">Высокая</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Уникальность</span>
                  <span className="text-sm text-gray-900">Рекомендуется</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Рекомендации по безопасности */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Рекомендации по безопасности</h4>
        <div className="space-y-2">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon
            return (
              <div key={index} className="flex items-start space-x-2">
                <Icon className={`h-4 w-4 mt-0.5 ${
                  rec.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <span className={`text-sm ${
                  rec.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {rec.message}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Быстрые действия</h4>
        <div className="space-y-2">
          <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1">
            Изменить пароль
          </button>
          <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1">
            Настроить двухфакторную аутентификацию
          </button>
          <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1">
            Просмотреть активные сессии
          </button>
        </div>
      </div>
    </div>
  )
}
