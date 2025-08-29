'use client'

import { useState } from 'react'
import { getApiUrl } from '@/utils/api';
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  PaintBrushIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline'
import PageLayout from '@/components/PageLayout'
import { useAuth } from '@/components/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', name: 'Профиль', icon: UserIcon },
    { id: 'notifications', name: 'Уведомления', icon: BellIcon },
    { id: 'security', name: 'Безопасность', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Внешний вид', icon: PaintBrushIcon },
    { id: 'system', name: 'Система', icon: GlobeAltIcon },
  ]

  return (
    <PageLayout 
      title="Настройки"
      subtitle="Управление настройками профиля и системы"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Навигация по вкладкам */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Основной контент */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Профиль пользователя</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Фамилия
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user?.last_name || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Имя
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user?.first_name || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Отчество
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user?.middle_name || ''}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={user?.username || ''}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Имя пользователя нельзя изменить</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={user?.email || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Роль
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      value={user?.role === 'admin' ? 'Администратор' : user?.role === 'manager' ? 'Менеджер' : 'Сотрудник'}
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Настройки уведомлений</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Email уведомления</h3>
                      <p className="text-sm text-gray-600">Получать уведомления на email</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Push уведомления</h3>
                      <p className="text-sm text-gray-600">Показывать push-уведомления в браузере</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Уведомления о новостях</h3>
                      <p className="text-sm text-gray-600">Получать уведомления о новых новостях компании</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600" defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Безопасность</h2>
                <div className="space-y-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Смена пароля</h3>
                    <p className="text-sm text-gray-600 mb-4">Обновите свой пароль для обеспечения безопасности</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                      Изменить пароль
                    </button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Двухфакторная аутентификация</h3>
                    <p className="text-sm text-gray-600 mb-4">Дополнительный уровень защиты для вашего аккаунта</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                      Настроить 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Внешний вид</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тема оформления
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Светлая</option>
                      <option>Темная</option>
                      <option>Автоматическая</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Язык интерфейса
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Русский</option>
                      <option>English</option>
                      <option>Қазақша</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Системные настройки</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Автоматическое обновление</h3>
                      <p className="text-sm text-gray-600">Автоматически обновлять приложение</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Сбор аналитики</h3>
                      <p className="text-sm text-gray-600">Помочь улучшить приложение</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                  Отменить
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}