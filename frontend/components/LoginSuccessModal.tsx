'use client'

import React, { useEffect } from 'react'

interface LoginSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  password?: string
  userType: 'customer' | 'contractor'
}

const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({
  isOpen,
  onClose,
  username,
  password,
  userType
}) => {
  // Обработка клавиши Escape
  useEffect(() => {
  const handleEscape = (e: any) => {
    if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      (window as any).document.addEventListener('keydown', handleEscape)
      // Блокируем скролл body
      (window as any).document.body.style.overflow = 'hidden'
    }

    return () => {
      (window as any).document.removeEventListener('keydown', handleEscape)
      // Восстанавливаем скролл body
      (window as any).document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const userTypeText = userType === 'customer' ? 'заказчика' : 'исполнителя'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-xl">
        {/* Заголовок */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Регистрация успешна
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="p-6">
          <div className="text-center">
            {/* Иконка успеха */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Подзаголовок */}
            <p className="text-gray-600 mb-6">
              Регистрация {userTypeText} прошла успешно
            </p>

            {/* Блок с данными для входа */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="space-y-4">
                {/* Логин */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Логин для входа:
                  </label>
                  <div className="bg-white border border-gray-300 rounded-md p-3">
                    <p className="text-lg font-mono font-semibold text-gray-900">
                      {username}
                    </p>
                  </div>
                </div>

                {/* Пароль */}
                {password && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Пароль для входа:
                    </label>
                    <div className="bg-white border border-gray-300 rounded-md p-3">
                      <p className="text-lg font-mono font-semibold text-gray-900">
                        {password}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Обязательно сохраните эти данные для входа в систему
                </p>
              </div>
            </div>

            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSuccessModal
