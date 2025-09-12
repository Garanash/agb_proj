'use client'

import { useState } from 'react'
import { UserCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils';
import { useAuth } from '@/hooks'
import { LoginForm } from '@/components/features/auth'
import ProfileEditModal from './ProfileEditModal'

export default function UserProfile() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  const { user, logout, refreshUser, isLoading, isAuthenticated } = useAuth()

  console.log('UserProfile rendered:', { isAuthenticated, isLoading, user: !!user })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="text-center p-4">
          <UserCircleIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-3">Войдите в систему</p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Войти
          </button>
        </div>

        {/* Модальное окно входа */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="relative">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 shadow-lg z-10"
              >
                ×
              </button>
              <LoginForm onClose={() => setShowLoginModal(false)} />
            </div>
          </div>
        )}
      </>
    )
  }

  // Генерируем аватар из инициалов
  const getInitials = (user: any) => {
    const parts = []
    if (user.last_name) parts.push(user.last_name)
    if (user.first_name) parts.push(user.first_name)
    if (user.middle_name) parts.push(user.middle_name)
    
    return parts
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500'
    ]
    const index = username.length % colors.length
    return colors[index]
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'manager':
        return 'Менеджер'
      case 'employee':
        return 'Сотрудник'
      default:
        return role
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleUpdateProfile = async () => {
    await refreshUser()
    setShowProfileModal(false)
  }

  return (
    <div className="user-card-shadow bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
      <div 
        className="flex items-center space-x-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Аватар с инициалами */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden
          ${!user?.avatar_url ? getAvatarColor(user?.username || '') : ''}
        `}>
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={`${user?.last_name} ${user?.first_name}`} 
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(user)
          )}
        </div>
        
        {/* Информация о пользователе */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user?.last_name} {user?.first_name} {user?.middle_name || ''}
          </p>
          <p className="text-xs text-gray-600 truncate">
            @{user?.username}
          </p>
        </div>
        
        {/* Иконка раскрытия */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>
      
      {/* Расширенная информация */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-800 font-medium truncate ml-2">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Роль:</span>
              <span className="text-gray-800 font-medium">
                {getRoleName(user?.role || 'employee')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Статус:</span>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${user?.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
                }
              `}>
                {user?.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="mt-4 space-y-2">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowProfileModal(true)
              }}
              className="w-full text-xs bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Редактировать профиль
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                handleLogout()
              }}
              className="w-full text-xs bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Выйти
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования профиля */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdate={handleUpdateProfile}
      />
    </div>
  )
}
