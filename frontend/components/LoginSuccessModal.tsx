'use client'

import React, { useEffect } from 'react'

interface LoginSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  userType: 'customer' | 'contractor'
}

const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({
  isOpen,
  onClose,
  username,
  userType
}) => {
  // Обработка клавиши Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Блокируем скролл body
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Восстанавливаем скролл body
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const userTypeText = userType === 'customer' ? 'заказчика' : 'исполнителя'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl">
        {/* Содержимое */}
        <div className="p-6">
          <div className="text-center">
            {/* Иконка успеха */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Заголовок */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Регистрация успешна!
            </h3>

            {/* Сообщение */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Регистрация {userTypeText} прошла успешно.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900">
                  Ваш логин для входа:
                </p>
                <p className="text-lg font-mono font-bold text-blue-600 mt-1">
                  {username}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Сохраните этот логин для входа в систему
              </p>
            </div>

            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Понятно, закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSuccessModal
