'use client'

import { useState } from 'react'
import { getApiUrl } from '@/utils/api';
import Calendar from '@/components/Calendar'
import NewsWidget from '@/components/NewsWidget'
import PageLayout from '@/components/PageLayout'
import { useAuth } from '@/components/SimpleAuthContext'
import Link from 'next/link'
import RegistrationModal from '@/components/RegistrationModal'

// Отключаем статическую генерацию
export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [initialUserType, setInitialUserType] = useState<'customer' | 'contractor'>('customer')

  console.log('Home page rendered:', { user: !!user })

  return (
    <PageLayout
      title={`Добро пожаловать, ${user ? `${user.last_name} ${user.first_name}` : 'Пользователь'}!`}
      subtitle="Главная страница корпоративной платформы Felix"
    >
      {/* Информационный блок для новых пользователей */}
      {!isAuthenticated && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🛠️ Платформа для заказчиков и исполнителей
          </h2>
          <p className="text-gray-700 mb-6">
            Наша платформа соединяет заказчиков с квалифицированными исполнителями ремонтных работ.
            Заказывайте услуги или предлагайте свои профессиональные навыки!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🏢 Для заказчиков (компаний)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Создание заявок на ремонт</li>
                <li>• Просмотр предложений исполнителей</li>
                <li>• Управление заказами</li>
                <li>• Отслеживание статуса работ</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                👷 Для исполнителей (физлиц)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
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
          {user.role === 'customer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🏢 Ваш кабинет заказчика
              </h3>
              <p className="text-blue-800 mb-4">
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                👷 Ваш кабинет исполнителя
              </h3>
              <p className="text-green-800 mb-4">
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                🔧 Ваш кабинет инженера
              </h3>
              <p className="text-purple-800 mb-4">
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