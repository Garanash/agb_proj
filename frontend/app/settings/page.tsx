'use client'

import { useState } from 'react'
import { getApiUrl } from '@/utils';
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  PaintBrushIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline'
import { PageLayout } from '@/components/layout'
import { useAuth } from '@/hooks'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import ThemeToggle, { ThemeIndicator } from '@/components/ThemeToggle'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Профиль пользователя</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Фамилия
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue={user?.last_name || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Имя
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue={user?.first_name || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Отчество
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    <button 
                      onClick={() => setShowChangePasswordModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
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

                  {/* Информация о безопасности */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Рекомендации по безопасности</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Используйте сложные пароли с буквами, цифрами и символами</li>
                      <li>• Не используйте один пароль для разных сервисов</li>
                      <li>• Регулярно обновляйте пароли</li>
                      <li>• Не передавайте пароли третьим лицам</li>
                    </ul>
                  </div>

                  {/* Статус пароля */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Статус пароля</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        user?.is_password_changed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-600">
                        {user?.is_password_changed 
                          ? 'Пароль был изменен' 
                          : 'Рекомендуется сменить пароль'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Внешний вид</h2>
                <div className="space-y-6">
                  {/* Переключатель темы */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Цветовая схема</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Выберите предпочитаемую цветовую схему для интерфейса
                    </p>
                    
                    <div className="space-y-4">
                      {/* Переключатель-кнопка */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Тема</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Выберите между светлой, темной или системной темой
                          </p>
                        </div>
                        <ThemeToggle variant="dropdown" size="md" showLabel={true} />
                      </div>

                      {/* Переключатель-переключатель */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Быстрое переключение</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Переключение между светлой и темной темой
                          </p>
                        </div>
                        <ThemeToggle variant="switch" size="md" showLabel={false} />
                      </div>

                      {/* Индикатор текущей темы */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <ThemeIndicator />
                      </div>
                    </div>
                  </div>

                  {/* Язык интерфейса */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Язык интерфейса</h3>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Выберите язык
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option>Русский</option>
                        <option>English</option>
                        <option>Қазақша</option>
                      </select>
                    </div>
                  </div>

                  {/* Дополнительные настройки внешнего вида */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Дополнительные настройки</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Компактный режим</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Уменьшить отступы и размеры элементов
                          </p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-600 transition-colors">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Анимации</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Включить плавные переходы и анимации
                          </p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Предварительный просмотр */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Предварительный просмотр</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Пример того, как будет выглядеть интерфейс с выбранными настройками
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Карточка примера */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Пример карточки</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Это пример того, как будет выглядеть контент
                        </p>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          Кнопка
                        </button>
                      </div>

                      {/* Форма примера */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Пример формы</h4>
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Поле ввода" 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                          <button className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            Вторичная кнопка
                          </button>
                        </div>
                      </div>
                    </div>
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
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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

      {/* Модальное окно изменения пароля */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          // Обновляем информацию о пользователе после успешного изменения пароля
          if (refreshUser) {
            refreshUser()
          }
        }}
      />
    </PageLayout>
  )
}