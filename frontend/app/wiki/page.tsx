'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks'
import { 
  BookOpenIcon, 
  PlayIcon, 
  QuestionMarkCircleIcon, 
  ChartBarIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  CogIcon,
  UserGroupIcon,
  DocumentIcon,
  ShieldCheckIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import ProcessDiagram, { ProcessGraph } from '@/components/ProcessDiagram'
import InteractiveDemo from '@/components/InteractiveDemo'
import VideoDemo from '@/components/VideoDemo'
import VideoPlaceholder from '@/components/VideoPlaceholder'

interface WikiSection {
  id: string
  title: string
  icon: any
  description: string
  content: React.ReactNode
}

export default function WikiPage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  // Проверяем доступ к Wiki (исключаем заказчиков и исполнителей)
  if (!user || ['customer', 'contractor'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Доступ ограничен</h2>
          <p className="mt-1 text-sm text-gray-500">
            Wiki доступен только для администраторов, менеджеров, сотрудников и других ролей.
          </p>
        </div>
      </div>
    )
  }

  const sections: WikiSection[] = [
    {
      id: 'getting-started',
      title: 'Быстрый старт',
      icon: RocketLaunchIcon,
      description: 'Начало работы с платформой',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Добро пожаловать в Felix!</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Корпоративная платформа для управления проектами, заявками и документами компании Алмазгеобур.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Команда</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Управление пользователями и ролями</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <DocumentIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Документы</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Работа с паспортами ВЭД</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Отчеты</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Аналитика и мониторинг</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Первые шаги</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Настройте профиль</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Заполните информацию о себе в разделе "Настройки" → "Профиль"
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Изучите интерфейс</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ознакомьтесь с навигацией и основными разделами платформы
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Начните работу</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Создайте первую заявку или изучите доступные функции согласно вашей роли
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'usage',
      title: 'Руководство пользователя',
      icon: BookOpenIcon,
      description: 'Подробное руководство по работе с системой',
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Основы работы с платформой</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">1. Навигация по системе</h4>
                <p className="text-gray-600 text-sm">
                  Используйте боковое меню для перехода между разделами. Каждый раздел адаптирован под вашу роль в системе.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">2. Работа с заявками</h4>
                <p className="text-gray-600 text-sm">
                  Создавайте, отслеживайте и управляйте заявками через соответствующие разделы в зависимости от вашей роли.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">3. Коммуникация</h4>
                <p className="text-gray-600 text-sm">
                  Используйте рабочий чат для общения с коллегами и обсуждения рабочих вопросов.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Роли и права доступа</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-blue-600 mb-2">Администратор</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Полный доступ ко всем функциям</li>
                  <li>• Управление пользователями</li>
                  <li>• Настройка системы</li>
                  <li>• Просмотр всех отчетов</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2">Менеджер</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Управление проектами</li>
                  <li>• Просмотр отчетов</li>
                  <li>• Создание новостей</li>
                  <li>• Координация работы</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-purple-600 mb-2">Сотрудник</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Работа с заявками</li>
                  <li>• Участие в чатах</li>
                  <li>• Просмотр проектов</li>
                  <li>• Обновление профиля</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-orange-600 mb-2">ВЭД Паспорт</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Создание паспортов ВЭД</li>
                  <li>• Управление документами</li>
                  <li>• Работа с архивами</li>
                  <li>• Специализированные функции</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'demo',
      title: 'Видео демонстрации',
      icon: PlayIcon,
      description: 'Видео-руководства по работе с платформой',
      content: (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Видео-руководства</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Смотрите реальные демонстрации работы с платформой Felix. Все видео содержат пошаговые инструкции и практические примеры.
            </p>
          </div>

          {/* Демо создания заявки */}
          <VideoPlaceholder
            title="Создание заявки в системе"
            description="Полное руководство по созданию новой заявки от авторизации до отправки на рассмотрение"
            duration="3:45"
            steps={[
              "Авторизация в системе с учетными данными",
              "Переход в раздел создания заявки",
              "Заполнение всех обязательных полей формы",
              "Прикрепление необходимых документов",
              "Отправка заявки на рассмотрение"
            ]}
          />

          {/* Демо работы с паспортами ВЭД */}
          <VideoPlaceholder
            title="Работа с паспортами ВЭД"
            description="Создание, редактирование и управление паспортами ВЭД в системе"
            duration="5:20"
            steps={[
              "Выбор номенклатуры для паспорта",
              "Заполнение данных заказа",
              "Создание паспорта ВЭД",
              "Просмотр и редактирование паспорта",
              "Архивирование готового паспорта"
            ]}
          />

          {/* Демо управления пользователями */}
          <VideoPlaceholder
            title="Управление пользователями"
            description="Добавление новых пользователей, назначение ролей и управление доступом"
            duration="4:15"
            steps={[
              "Добавление нового пользователя",
              "Назначение роли и прав доступа",
              "Настройка профиля пользователя",
              "Активация и деактивация аккаунта",
              "Просмотр статистики пользователя"
            ]}
          />

          {/* Демо работы с отчетами */}
          <VideoPlaceholder
            title="Создание и просмотр отчетов"
            description="Генерация отчетов, настройка фильтров и экспорт данных"
            duration="3:30"
            steps={[
              "Выбор типа отчета",
              "Настройка параметров и фильтров",
              "Генерация отчета",
              "Просмотр результатов",
              "Экспорт в Excel/PDF"
            ]}
          />

          {/* Демо работы с чатом */}
          <VideoPlaceholder
            title="Работа с корпоративным чатом"
            description="Создание чатов, общение с коллегами и управление беседами"
            duration="2:45"
            steps={[
              "Создание нового чата",
              "Добавление участников",
              "Отправка сообщений",
              "Прикрепление файлов",
              "Управление настройками чата"
            ]}
          />

          {/* Демо настроек профиля */}
          <VideoPlaceholder
            title="Настройка профиля и системы"
            description="Персонализация профиля, изменение пароля и настройка уведомлений"
            duration="2:20"
            steps={[
              "Редактирование личной информации",
              "Изменение пароля",
              "Настройка уведомлений",
              "Выбор темы оформления",
              "Управление безопасностью"
            ]}
          />

          {/* Рекомендации по ролям */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Рекомендуемые демонстрации по ролям</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Администратор</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Управление пользователями</li>
                  <li>• Настройка системы</li>
                  <li>• Просмотр отчетов</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Менеджер</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Создание заявок</li>
                  <li>• Работа с отчетами</li>
                  <li>• Управление проектами</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">ВЭД Паспорт</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Работа с паспортами ВЭД</li>
                  <li>• Создание заявок</li>
                  <li>• Управление документами</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Технические требования */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Технические требования</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700 dark:text-yellow-300">
              <div>
                <h4 className="font-medium mb-2">Браузеры:</h4>
                <ul className="space-y-1">
                  <li>• Chrome 90+</li>
                  <li>• Firefox 88+</li>
                  <li>• Safari 14+</li>
                  <li>• Edge 90+</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Интернет:</h4>
                <ul className="space-y-1">
                  <li>• Скорость от 5 Мбит/с</li>
                  <li>• Стабильное соединение</li>
                  <li>• Поддержка HTML5 видео</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Часто задаваемые вопросы',
      icon: QuestionMarkCircleIcon,
      description: 'Ответы на популярные вопросы пользователей',
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Общие вопросы</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Как изменить пароль?</h4>
                  <p className="text-gray-600 text-sm">
                    Перейдите в раздел "Настройки" → "Безопасность" → "Изменить пароль". 
                    Введите текущий пароль и новый пароль дважды для подтверждения.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Как создать новую заявку?</h4>
                  <p className="text-gray-600 text-sm">
                    В главном меню выберите "Новая заявка", заполните все обязательные поля 
                    и прикрепите необходимые документы. После создания заявка будет отправлена на рассмотрение.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Как отследить статус заявки?</h4>
                  <p className="text-gray-600 text-sm">
                    В разделе "Мои заявки" вы можете видеть все ваши заявки с их текущим статусом. 
                    Статус обновляется автоматически при изменении состояния заявки.
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Как связаться с поддержкой?</h4>
                  <p className="text-gray-600 text-sm">
                    Используйте рабочий чат для связи с коллегами или обратитесь к администратору системы. 
                    Для технических вопросов создайте заявку с типом "Техническая поддержка".
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Технические вопросы</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Система работает медленно</h4>
                  <p className="text-gray-600 text-sm">
                    Попробуйте обновить страницу (F5) или очистить кэш браузера. 
                    Если проблема сохраняется, обратитесь к администратору системы.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Не загружаются файлы</h4>
                  <p className="text-gray-600 text-sm">
                    Проверьте размер файла (максимум 10 МБ) и формат (PDF, DOC, DOCX, JPG, PNG). 
                    Убедитесь, что у вас стабильное интернет-соединение.
                  </p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Ошибка авторизации</h4>
                  <p className="text-gray-600 text-sm">
                    Проверьте правильность ввода логина и пароля. Если проблема повторяется, 
                    обратитесь к администратору для сброса пароля.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'processes',
      title: 'Схемы бизнес-процессов',
      icon: ChartBarIcon,
      description: 'Визуальные схемы рабочих процессов',
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные бизнес-процессы</h3>
            
            <div className="space-y-6">
              <div>
                <ProcessDiagram
                  title="Процесс обработки заявки"
                  steps={[
                    {
                      id: 'create',
                      title: 'Создание заявки',
                      description: 'Клиент создает заявку',
                      status: 'completed',
                      duration: '2 мин'
                    },
                    {
                      id: 'review',
                      title: 'Рассмотрение',
                      description: 'Менеджер рассматривает заявку',
                      status: 'active',
                      duration: '15 мин'
                    },
                    {
                      id: 'assign',
                      title: 'Назначение исполнителя',
                      description: 'Назначение подходящего исполнителя',
                      status: 'pending',
                      duration: '5 мин'
                    },
                    {
                      id: 'execute',
                      title: 'Выполнение',
                      description: 'Исполнитель выполняет работу',
                      status: 'pending',
                      duration: '2 часа'
                    },
                    {
                      id: 'complete',
                      title: 'Завершение',
                      description: 'Проверка и закрытие заявки',
                      status: 'pending',
                      duration: '10 мин'
                    }
                  ]}
                  isInteractive={true}
                />
              </div>

              <div>
                <ProcessGraph
                  title="Процесс управления пользователями"
                  nodes={[
                    { id: 'start', title: 'Начало', type: 'start', x: 50, y: 200 },
                    { id: 'register', title: 'Регистрация', type: 'process', x: 200, y: 200 },
                    { id: 'verify', title: 'Проверка данных', type: 'decision', x: 350, y: 200 },
                    { id: 'activate', title: 'Активация', type: 'process', x: 500, y: 150 },
                    { id: 'assign_role', title: 'Назначение роли', type: 'process', x: 500, y: 250 },
                    { id: 'end', title: 'Завершение', type: 'end', x: 650, y: 200 }
                  ]}
                  connections={[
                    { from: 'start', to: 'register' },
                    { from: 'register', to: 'verify' },
                    { from: 'verify', to: 'activate', label: 'Данные корректны' },
                    { from: 'verify', to: 'assign_role', label: 'Требуется проверка' },
                    { from: 'activate', to: 'end' },
                    { from: 'assign_role', to: 'end' }
                  ]}
                />
              </div>

              <div>
                <ProcessDiagram
                  title="Процесс работы с документами"
                  steps={[
                    {
                      id: 'upload',
                      title: 'Загрузка',
                      description: 'Загрузка документа в систему',
                      status: 'completed',
                      duration: '1 мин'
                    },
                    {
                      id: 'check',
                      title: 'Проверка',
                      description: 'Автоматическая проверка формата',
                      status: 'active',
                      duration: '30 сек'
                    },
                    {
                      id: 'approve',
                      title: 'Одобрение',
                      description: 'Ручная проверка и одобрение',
                      status: 'pending',
                      duration: '5 мин'
                    },
                    {
                      id: 'archive',
                      title: 'Архив',
                      description: 'Сохранение в архив',
                      status: 'pending',
                      duration: '10 сек'
                    }
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Схемы по ролям</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-blue-600 mb-2">Администратор</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Управление пользователями</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Настройка системы</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Мониторинг процессов</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2">Менеджер</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Координация проектов</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Анализ отчетов</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Управление ресурсами</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Безопасность и доступы',
      icon: ShieldCheckIcon,
      description: 'Политики безопасности и управления доступом',
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Политика безопасности</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Пароли</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Минимум 8 символов</li>
                  <li>• Обязательно: заглавные и строчные буквы, цифры</li>
                  <li>• Смена пароля каждые 90 дней</li>
                  <li>• Запрещено использовать простые пароли</li>
                </ul>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Сессии</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Автоматический выход через 8 часов неактивности</li>
                  <li>• Один активный сеанс на пользователя</li>
                  <li>• Уведомления о входе с новых устройств</li>
                </ul>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Данные</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Шифрование всех передаваемых данных</li>
                  <li>• Резервное копирование каждые 24 часа</li>
                  <li>• Логирование всех действий пользователей</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Уровни доступа</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Критический</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Доступ только к административным функциям</p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <li>• Управление пользователями</li>
                  <li>• Настройки системы</li>
                  <li>• Просмотр логов</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">Ограниченный</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Доступ к рабочим функциям</p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <li>• Создание заявок</li>
                  <li>• Просмотр проектов</li>
                  <li>• Работа с документами</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Решение проблем',
      icon: ExclamationTriangleIcon,
      description: 'Частые проблемы и способы их решения',
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Технические проблемы</h3>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Страница не загружается</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Возможные причины:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li>• Проблемы с интернет-соединением</li>
                    <li>• Блокировка антивирусом</li>
                    <li>• Устаревший браузер</li>
                  </ul>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Решение:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li>• Проверьте подключение к интернету</li>
                    <li>• Обновите браузер до последней версии</li>
                    <li>• Очистите кэш браузера (Ctrl+F5)</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Файлы не загружаются</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Проверьте:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li>• Размер файла (максимум 10 МБ)</li>
                    <li>• Формат файла (PDF, DOC, DOCX, JPG, PNG)</li>
                    <li>• Наличие вирусов в файле</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Медленная работа</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Рекомендации:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li>• Закройте неиспользуемые вкладки</li>
                    <li>• Перезагрузите страницу</li>
                    <li>• Проверьте скорость интернета</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Когда обращаться в поддержку</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Проблема не решается стандартными способами</li>
              <li>• Ошибки в работе системы</li>
              <li>• Потеря данных</li>
              <li>• Подозрение на взлом аккаунта</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Лучшие практики',
      icon: AcademicCapIcon,
      description: 'Рекомендации по эффективной работе',
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Эффективная работа с заявками</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Создание заявок</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Используйте понятные заголовки</li>
                  <li>• Подробно описывайте проблему</li>
                  <li>• Прикрепляйте скриншоты</li>
                  <li>• Указывайте приоритет корректно</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Обработка заявок</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Отвечайте в течение 2 часов</li>
                  <li>• Обновляйте статус регулярно</li>
                  <li>• Комментируйте свои действия</li>
                  <li>• Закрывайте только после решения</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Работа с документами</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Правильное именование</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Используйте формат: "Тип_Дата_Номер_Описание.pdf"
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Категоризация</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Всегда указывайте правильную категорию и теги
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Версионность</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    При обновлении документа создавайте новую версию
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Командная работа</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <ClockIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Время</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Соблюдайте дедлайны</p>
              </div>
              <div className="text-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Коммуникация</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Используйте чат для обсуждений</p>
              </div>
              <div className="text-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Документирование</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Ведите записи о работе</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Wiki платформы</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Полное руководство по использованию корпоративной платформы Алмазгеобур
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Боковое меню */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Разделы</h2>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 dark:border-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{section.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                {sections.find(section => section.id === activeSection)?.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
