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
  CogIcon
} from '@heroicons/react/24/outline'
import ProcessDiagram, { ProcessGraph } from '@/components/ProcessDiagram'
import InteractiveDemo from '@/components/InteractiveDemo'

interface WikiSection {
  id: string
  title: string
  icon: any
  description: string
  content: React.ReactNode
}

export default function WikiPage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('usage')

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
      id: 'usage',
      title: 'Как пользоваться платформой',
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
      title: 'Демо работы',
      icon: PlayIcon,
      description: 'Интерактивные примеры использования функций',
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Интерактивные демонстрации</h3>
            
            {/* Демо создания заявки */}
            <div className="mb-8">
              <InteractiveDemo
                title="Создание заявки"
                description="Пошаговое руководство по созданию новой заявки в системе"
                steps={[
                  {
                    id: 'login',
                    title: 'Вход в систему',
                    description: 'Авторизуйтесь в системе, используя свои учетные данные',
                    isInteractive: true,
                    action: 'Нажмите кнопку "Войти"',
                    result: 'Вы успешно авторизованы в системе'
                  },
                  {
                    id: 'navigate',
                    title: 'Переход к созданию заявки',
                    description: 'Перейдите в раздел создания новой заявки',
                    isInteractive: true,
                    action: 'Нажмите "Новая заявка" в главном меню',
                    result: 'Открыта форма создания заявки'
                  },
                  {
                    id: 'fill_form',
                    title: 'Заполнение формы',
                    description: 'Заполните все обязательные поля формы заявки',
                    isInteractive: true,
                    action: 'Заполните поля: тип заявки, описание, приоритет',
                    result: 'Форма заполнена корректно'
                  },
                  {
                    id: 'upload_files',
                    title: 'Загрузка документов',
                    description: 'Прикрепите необходимые документы к заявке',
                    isInteractive: true,
                    action: 'Нажмите "Выбрать файлы" и загрузите документы',
                    result: 'Документы успешно загружены'
                  },
                  {
                    id: 'submit',
                    title: 'Отправка заявки',
                    description: 'Отправьте заявку на рассмотрение',
                    isInteractive: true,
                    action: 'Нажмите кнопку "Создать заявку"',
                    result: 'Заявка успешно создана и отправлена на рассмотрение'
                  }
                ]}
                onComplete={() => console.log('Демо создания заявки завершено')}
              />
            </div>

            {/* Демо работы с документами */}
            <div className="mb-8">
              <InteractiveDemo
                title="Работа с документами"
                description="Демонстрация загрузки и управления документами"
                steps={[
                  {
                    id: 'select_doc',
                    title: 'Выбор документа',
                    description: 'Выберите документ для загрузки в систему',
                    isInteractive: true,
                    action: 'Нажмите "Выбрать файл" и выберите документ',
                    result: 'Документ выбран для загрузки'
                  },
                  {
                    id: 'upload_doc',
                    title: 'Загрузка документа',
                    description: 'Загрузите документ в систему',
                    isInteractive: true,
                    action: 'Нажмите "Загрузить" для начала загрузки',
                    result: 'Документ успешно загружен'
                  },
                  {
                    id: 'verify_doc',
                    title: 'Проверка документа',
                    description: 'Система автоматически проверит формат и содержимое',
                    isInteractive: false,
                    action: 'Ожидание завершения проверки...',
                    result: 'Документ прошел проверку'
                  },
                  {
                    id: 'categorize',
                    title: 'Категоризация',
                    description: 'Назначьте категорию и теги документу',
                    isInteractive: true,
                    action: 'Выберите категорию и добавьте теги',
                    result: 'Документ успешно категоризирован'
                  }
                ]}
                onComplete={() => console.log('Демо работы с документами завершено')}
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Быстрый старт</h3>
            <p className="text-blue-800 text-sm mb-4">
              Выберите демонстрацию, соответствующую вашей роли, чтобы быстро освоить основные функции платформы.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                {user?.role === 'admin' && 'Административные функции'}
                {user?.role === 'manager' && 'Управленческие функции'}
                {user?.role === 'employee' && 'Рабочие функции'}
                {user?.role === 'ved_passport' && 'Функции ВЭД'}
                {user?.role === 'service_engineer' && 'Сервисные функции'}
              </span>
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
