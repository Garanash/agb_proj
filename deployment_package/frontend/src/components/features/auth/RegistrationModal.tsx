'use client'

import React, { useState } from 'react'
import { CustomerRegistrationForm, ContractorRegistrationForm } from '../../forms'
import { LoginSuccessModal } from './LoginSuccessModal'
import { PrivacyPolicyModal } from '../admin/PrivacyPolicyModal'

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  initialUserType?: 'customer' | 'contractor'
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  initialUserType
}) => {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'contractor' | null>(null)
  const [isPrivacyPolicyAccepted, setIsPrivacyPolicyAccepted] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [generatedUsername, setGeneratedUsername] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [registrationUserType, setRegistrationUserType] = useState<'customer' | 'contractor'>('customer')

  const handleRoleSelect = (role: 'customer' | 'contractor') => {
    setSelectedRole(role)
  }

  const handlePrivacyPolicyAccept = () => {
    setIsPrivacyPolicyAccepted(true)
    setShowPrivacyPolicy(false)
  }

  const handleClose = () => {
    setSelectedRole(null)
    setIsPrivacyPolicyAccepted(false)
    setShowPrivacyPolicy(false)
    setShowLoginModal(false)
    setGeneratedUsername('')
    setGeneratedPassword('')
    onClose()
  }

  // Устанавливаем начальную роль при открытии модального окна
  React.useEffect(() => {
    if (isOpen && initialUserType) {
      setSelectedRole(initialUserType)
    }
  }, [isOpen, initialUserType])

  const handleFormSuccess = (username: string, password: string | undefined, userType: 'customer' | 'contractor') => {
    setGeneratedUsername(username)
    setGeneratedPassword(password || '')
    setRegistrationUserType(userType)
    setShowLoginModal(true)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        style={{ pointerEvents: showPrivacyPolicy ? 'none' : 'auto' }}
      >
        <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Заголовок */}
          <div className="border-b border-gray-200 p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Регистрация
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                aria-label="Закрыть"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Содержимое */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {!selectedRole ? (
                /* Выбор роли */
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-8">
                    Выберите вашу роль
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Заказчик */}
                    <button
                      onClick={() => handleRoleSelect('customer')}
                      className="group p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Заказчик</h4>
                          <p className="text-sm text-gray-600">
                            Ищу специалистов для выполнения работ
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Исполнитель */}
                    <button
                      onClick={() => handleRoleSelect('contractor')}
                      className="group p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Исполнитель</h4>
                          <p className="text-sm text-gray-600">
                            Предоставляю услуги по ремонту техники
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Форма регистрации */
                <div className="max-w-2xl mx-auto">
                  {/* Кнопка назад */}
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Выбрать другую роль
                  </button>

                  {/* Форма */}
                  <div className="mb-8">
                    {selectedRole === 'customer' ? (
                      <CustomerRegistrationForm
                        onSuccess={(username, password) => handleFormSuccess(username, password, 'customer')}
                        showLoginModal={false}
                      />
                    ) : (
                      <ContractorRegistrationForm
                        onSuccess={(username) => handleFormSuccess(username, undefined, 'contractor')}
                        showLoginModal={false}
                      />
                    )}
                  </div>

                  {/* Чекбокс политики */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivacyPolicyAccepted}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setIsPrivacyPolicyAccepted(false)
                          } else {
                            setShowPrivacyPolicy(true)
                          }
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="text-sm">
                        <span className="text-gray-700">
                          Я согласен с{' '}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyPolicy(true)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            политикой обработки персональных данных
                          </button>
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно политики */}
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        onAccept={handlePrivacyPolicyAccept}
      />

      {/* Модальное окно с логином */}
      <LoginSuccessModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false)
          handleClose()
        }}
        username={generatedUsername}
        password={generatedPassword}
        userType={registrationUserType}
      />
    </>
  )
}

export default RegistrationModal