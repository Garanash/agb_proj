'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomerRegistrationForm from '@/components/CustomerRegistrationForm'
import ContractorRegistrationForm from '@/components/ContractorRegistrationForm'

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  initialUserType?: 'customer' | 'contractor'
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, initialUserType = 'customer' }) => {
  const [userType, setUserType] = useState<'customer' | 'contractor'>(initialUserType)
  const router = useRouter()

  const handleRegistrationSuccess = () => {
    onClose()
    router.push('/login')
  }

  const handleSwitchToContractor = () => setUserType('contractor')
  const handleSwitchToCustomer = () => setUserType('customer')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Фон */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      {/* Модальное окно */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Заголовок и кнопка закрытия */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Регистрация на платформе
              </h2>
              <p className="text-gray-600 mt-1">
                Выберите тип аккаунта для продолжения
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Выбор типа пользователя */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                <button
                  onClick={handleSwitchToCustomer}
                  className={`px-6 py-3 rounded-md font-medium transition-colors ${
                    userType === 'customer'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Заказчик (Компания)
                </button>
                <button
                  onClick={handleSwitchToContractor}
                  className={`px-6 py-3 rounded-md font-medium transition-colors ${
                    userType === 'contractor'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Исполнитель (Физлицо)
                </button>
              </div>
            </div>
          </div>

          {/* Информация о типе пользователя */}
          <div className="px-6 py-4">
            {userType === 'customer' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Регистрация для заказчиков
                </h3>
                <p className="text-blue-800 text-sm">
                  Создайте аккаунт для вашей компании, чтобы размещать заявки на ремонт
                  и получать предложения от квалифицированных исполнителей.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Регистрация для исполнителей
                </h3>
                <p className="text-green-800 text-sm">
                  Зарегистрируйтесь как исполнитель, чтобы получать заявки на ремонт,
                  предлагать свои услуги и зарабатывать на выполнении работ.
                </p>
              </div>
            )}
          </div>

          {/* Форма регистрации */}
          <div className="px-6 pb-6">
            {userType === 'customer' ? (
              <CustomerRegistrationForm
                onSuccess={handleRegistrationSuccess}
              />
            ) : (
              <ContractorRegistrationForm
                onSuccess={handleRegistrationSuccess}
              />
            )}
          </div>

          {/* Ссылка на вход */}
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="text-center pt-4">
              <p className="text-gray-600">
                Уже есть аккаунт?{' '}
                <button
                  onClick={() => {
                    onClose()
                    router.push('/login')
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Войти в систему
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationModal
