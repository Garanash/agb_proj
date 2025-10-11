'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import { Calendar, NewsWidget, PageLayout, RegistrationModal } from '@/components'
import { useAuth } from '@/hooks'
import Link from 'next/link'

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [initialUserType, setInitialUserType] = useState<'customer' | 'contractor'>('customer')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  console.log('Home page rendered:', { user: !!user, isLoading, mounted })

  // Показываем загрузку пока компонент не смонтирован или идет загрузка аутентификации
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title={`Добро пожаловать, ${user ? `${user.last_name} ${user.first_name}` : 'Пользователь'}!`}
      subtitle="Главная страница корпоративной платформы Felix"
    >
      {/* Информационный блок для новых пользователей */}
      {!isAuthenticated && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🛠️ Платформа для заказчиков и исполнителей
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Наша платформа соединяет заказчиков с квалифицированными исполнителями ремонтных работ.
            Заказывайте услуги или предлагайте свои профессиональные навыки!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🏢 Для заказчиков (компаний)
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Создание заявок на ремонт</li>
                <li>• Просмотр предложений исполнителей</li>
                <li>• Управление заказами</li>
                <li>• Отслеживание статуса работ</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                👷 Для исполнителей (физлиц)
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Просмотр доступных заявок</li>
                <li>• Отклик на интересные заказы</li>
                <li>• Получение уведомлений в Telegram</li>
                <li>• Управление профилем и навыками</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setInitialUserType('customer')
                setShowRegistrationModal(true)
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors text-center font-medium"
            >
              Зарегистрироваться как заказчик
            </button>
            <button
              onClick={() => {
                setInitialUserType('contractor')
                setShowRegistrationModal(true)
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors text-center font-medium"
            >
              Зарегистрироваться как исполнитель
            </button>
          </div>
        </div>
      )}

      {/* Блок для авторизованных пользователей */}
      {isAuthenticated && user && (
        <div className="mb-8">
          {/* Ссылка на админ-панель для администраторов */}
          {user.role === 'admin' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                🔧 Административная панель
              </h3>
              <p className="text-red-800 dark:text-red-200 mb-4">
                Управление системой, пользователями и настройками
              </p>
              <Link
                href="/admin"
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Перейти в админ-панель
              </Link>
            </div>
          )}

          {user.role === 'customer' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🏢 Ваш кабинет заказчика
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Создавайте заявки на ремонт и управляйте своими заказами
              </p>
              <Link
                href="/dashboard/customer"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Перейти в кабинет
              </Link>
            </div>
          )}

          {user.role === 'contractor' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                👷 Ваш кабинет исполнителя
              </h3>
              <p className="text-green-800 dark:text-green-200 mb-4">
                Просматривайте доступные заявки и откликайтесь на интересные заказы
              </p>
              <Link
                href="/dashboard/contractor"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Перейти в кабинет
              </Link>
            </div>
          )}

          {user.role === 'service_engineer' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">
                🔧 Ваш кабинет инженера
              </h3>
              <p className="text-purple-800 dark:text-purple-200 mb-4">
                Управляйте заявками заказчиков и координируйте работу исполнителей
              </p>
              <Link
                href="/dashboard/service-engineer"
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Перейти в кабинет
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Календарь и новости для всех пользователей */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Календарь */}
        <div className="lg:col-span-2">
          <Calendar />
        </div>

        {/* Новости компании */}
        <div className="lg:col-span-1">
          <NewsWidget />
        </div>
      </div>

      {/* Модальное окно регистрации */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false)
          setInitialUserType('customer') // Сброс к дефолтному значению
        }}
        initialUserType={initialUserType}
      />
    </PageLayout>
  )
}