'use client'

import { 
  BookOpenIcon, 
  PlayIcon, 
  QuestionMarkCircleIcon, 
  ChartBarIcon,
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
  RocketLaunchIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import ProcessDiagram, { ProcessGraph } from '@/components/ProcessDiagram'
import VideoPlaceholder from '@/components/VideoPlaceholder'

interface WikiContentProps {
  activeSection: string
  activeSubsection?: string
}

export default function WikiContent({ activeSection, activeSubsection }: WikiContentProps) {
  const renderContent = () => {
    // Быстрый старт
    if (activeSection === 'getting-started') {
      if (activeSubsection === 'welcome') {
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Добро пожаловать в Felix!</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Корпоративная платформа для управления проектами, заявками и документами компании Алмазгеобур.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Управление командой</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Создавайте проекты и назначайте ответственных</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <DocumentIcon className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Работа с документами</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Загружайте и организуйте документы проекта</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Аналитика и отчеты</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Отслеживайте прогресс и генерируйте отчеты</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      if (activeSubsection === 'first-steps') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Первые шаги</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Настройка профиля</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Заполните личную информацию</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Загрузите фотографию профиля</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Настройте уведомления</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Изучение интерфейса</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Ознакомьтесь с главной панелью</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Изучите боковое меню</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Настройте рабочий стол</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      }
      
      if (activeSubsection === 'interface') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Интерфейс платформы</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Основные элементы</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Верхняя панель навигации</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Боковое меню</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Основная рабочая область</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Панель уведомлений</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Быстрые действия</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Настройки пользователя</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    }

    // Руководство пользователя
    if (activeSection === 'user-guide') {
      if (activeSubsection === 'navigation') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Навигация по платформе</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Главное меню</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <HomeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                    <span>Главная - обзор и статистика</span>
                  </li>
                  <li className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                    <span>Проекты - управление проектами</span>
                  </li>
                  <li className="flex items-center">
                    <DocumentIcon className="h-5 w-5 text-purple-500 dark:text-purple-400 mr-2" />
                    <span>Документы - работа с файлами</span>
                  </li>
                  <li className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-orange-500 dark:text-orange-400 mr-2" />
                    <span>Отчеты - аналитика и отчеты</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Боковая панель</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                    <span>Пользователи - управление командой</span>
                  </li>
                  <li className="flex items-center">
                    <CogIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                    <span>Настройки - конфигурация</span>
                  </li>
                  <li className="flex items-center">
                    <BookOpenIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                    <span>Wiki - база знаний</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      }

      if (activeSubsection === 'projects') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Работа с проектами</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Создание проекта</h3>
                <ol className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>1. Перейдите в раздел "Проекты"</li>
                  <li>2. Нажмите кнопку "Создать проект"</li>
                  <li>3. Заполните основную информацию о проекте</li>
                  <li>4. Назначьте участников и роли</li>
                  <li>5. Установите сроки и приоритеты</li>
                  <li>6. Сохраните проект</li>
                </ol>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Управление задачами</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Создавайте задачи с четкими описаниями</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Назначайте ответственных и сроки</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Отслеживайте прогресс выполнения</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      }
    }

    // Видео демонстрации
    if (activeSection === 'video-demos') {
      if (activeSubsection === 'platform-overview') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Обзор платформы</h2>
            <VideoPlaceholder
              title="Общий обзор платформы Felix"
              description="Краткий обзор основных возможностей и интерфейса платформы"
              duration="5:30"
              steps={[
                "Главная панель и навигация",
                "Создание и управление проектами",
                "Работа с документами",
                "Система уведомлений",
                "Настройки профиля"
              ]}
            />
          </div>
        )
      }
      
      if (activeSubsection === 'project-creation') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Создание проекта</h2>
            <VideoPlaceholder
              title="Как создать новый проект"
              description="Пошаговая инструкция по созданию и настройке проекта"
              duration="8:15"
              steps={[
                "Переход в раздел проектов",
                "Заполнение основной информации",
                "Назначение участников",
                "Настройка этапов и сроков",
                "Загрузка начальных документов"
              ]}
            />
          </div>
        )
      }

      if (activeSubsection === 'document-workflow') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Работа с документами</h2>
            <VideoPlaceholder
              title="Документооборот в платформе"
              description="Процесс загрузки, обработки и управления документами"
              duration="6:45"
              steps={[
                "Загрузка документов в проект",
                "Категоризация и тегирование",
                "Назначение ответственных за документы",
                "Версионирование и история изменений",
                "Экспорт и печать документов"
              ]}
            />
          </div>
        )
      }

      if (activeSubsection === 'report-generation') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Генерация отчетов</h2>
            <VideoPlaceholder
              title="Создание отчетов и аналитики"
              description="Настройка и генерация различных типов отчетов"
              duration="7:20"
              steps={[
                "Выбор типа отчета",
                "Настройка параметров и фильтров",
                "Выбор периода и данных",
                "Настройка визуализации",
                "Экспорт и отправка отчета"
              ]}
            />
          </div>
        )
      }
    }

    // Бизнес-процессы
    if (activeSection === 'business-processes') {
      if (activeSubsection === 'user-management') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Процесс управления пользователями</h2>
            <ProcessGraph
              title="Процесс управления пользователями"
              nodes={[
                { id: 'start', title: 'Начало', type: 'start', x: 80, y: 150 },
                { id: 'register', title: 'Регистрация', type: 'process', x: 200, y: 150 },
                { id: 'verify', title: 'Проверка данных', type: 'decision', x: 320, y: 150 },
                { id: 'activate', title: 'Активация', type: 'process', x: 440, y: 100 },
                { id: 'assign_role', title: 'Назначение роли', type: 'process', x: 440, y: 200 },
                { id: 'end', title: 'Завершение', type: 'end', x: 560, y: 150 }
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
        )
      }

      if (activeSubsection === 'project-workflow') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Рабочие процессы</h2>
            <ProcessDiagram
              title="Процесс создания паспорта ВЭД"
              steps={[
                { id: 'select_nomenclature', title: 'Выбор номенклатуры', description: 'Выбор товара из справочника', status: 'completed' },
                { id: 'fill_data', title: 'Заполнение данных', description: 'Ввод информации о товаре', status: 'completed' },
                { id: 'validation', title: 'Проверка', description: 'Валидация введенных данных', status: 'active' },
                { id: 'generate', title: 'Генерация', description: 'Создание паспорта ВЭД', status: 'pending' },
                { id: 'approval', title: 'Согласование', description: 'Проверка и утверждение', status: 'pending' },
                { id: 'archive', title: 'Архивирование', description: 'Сохранение в архиве', status: 'pending' }
              ]}
            />
          </div>
        )
      }

      if (activeSubsection === 'automation') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Автоматизация через n8n</h2>
            <ProcessGraph
              title="Процесс автоматизации через n8n"
              nodes={[
                { id: 'trigger', title: 'Триггер', type: 'start', x: 80, y: 150 },
                { id: 'webhook', title: 'Webhook', type: 'process', x: 200, y: 150 },
                { id: 'process_data', title: 'Обработка данных', type: 'process', x: 320, y: 150 },
                { id: 'decision', title: 'Условие', type: 'decision', x: 440, y: 150 },
                { id: 'send_email', title: 'Отправка email', type: 'process', x: 560, y: 100 },
                { id: 'update_db', title: 'Обновление БД', type: 'process', x: 560, y: 200 },
                { id: 'end', title: 'Завершение', type: 'end', x: 680, y: 150 }
              ]}
              connections={[
                { from: 'trigger', to: 'webhook' },
                { from: 'webhook', to: 'process_data' },
                { from: 'process_data', to: 'decision' },
                { from: 'decision', to: 'send_email', label: 'Успешно' },
                { from: 'decision', to: 'update_db', label: 'Ошибка' },
                { from: 'send_email', to: 'end' },
                { from: 'update_db', to: 'end' }
              ]}
            />
          </div>
        )
      }

      if (activeSubsection === 'role-schemes') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Схемы по ролям</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Администратор</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Полный доступ ко всем функциям</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Управление пользователями и ролями</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Настройка системы и интеграций</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Менеджер</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Управление проектами и задачами</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Просмотр отчетов и аналитики</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Назначение участников проектов</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      }
    }

    // FAQ
    if (activeSection === 'faq') {
      if (activeSubsection === 'general') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Общие вопросы</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Как изменить пароль?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Перейдите в раздел "Настройки" → "Безопасность" → "Изменить пароль". 
                  Введите текущий пароль и новый пароль, затем подтвердите изменения.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Как создать новый проект?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  В главном меню выберите "Проекты" → "Создать проект". 
                  Заполните необходимую информацию и нажмите "Сохранить".
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Как загрузить документ?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  В разделе "Документы" нажмите "Загрузить файл", выберите файл с компьютера 
                  и заполните необходимую информацию о документе.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Как пригласить пользователя в проект?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Откройте проект, перейдите в "Участники" → "Пригласить пользователя". 
                  Введите email пользователя и выберите роль в проекте.
                </p>
              </div>
            </div>
          </div>
        )
      }

      if (activeSubsection === 'technical') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Технические вопросы</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Какие браузеры поддерживаются?</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Платформа поддерживает современные браузеры:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Google Chrome (рекомендуется)</li>
                  <li>Mozilla Firefox</li>
                  <li>Safari</li>
                  <li>Microsoft Edge</li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Максимальный размер файла</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Максимальный размер загружаемого файла составляет 50 МБ. 
                  Для файлов большего размера обратитесь к администратору.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Поддерживаемые форматы файлов</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Документы: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Изображения: JPG, PNG, GIF, WEBP
                </p>
              </div>
            </div>
          </div>
        )
      }

      if (activeSubsection === 'troubleshooting') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Решение проблем</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Страница не загружается</h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>1. Проверьте подключение к интернету</p>
                  <p>2. Обновите страницу (F5 или Ctrl+R)</p>
                  <p>3. Очистите кэш браузера</p>
                  <p>4. Попробуйте другой браузер</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Файл не загружается</h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>1. Проверьте размер файла (максимум 50 МБ)</p>
                  <p>2. Убедитесь, что формат файла поддерживается</p>
                  <p>3. Проверьте стабильность интернет-соединения</p>
                  <p>4. Попробуйте загрузить файл позже</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Не приходят уведомления</h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>1. Проверьте настройки уведомлений в профиле</p>
                  <p>2. Убедитесь, что браузер разрешает уведомления</p>
                  <p>3. Проверьте папку "Спам" в email</p>
                  <p>4. Обратитесь к администратору</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    }

    // Безопасность и доступы
    if (activeSection === 'security') {
      if (activeSubsection === 'access-control') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Контроль доступа</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Система ролей</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Администратор</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• Полный доступ ко всем функциям</li>
                      <li>• Управление пользователями</li>
                      <li>• Настройка системы</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Менеджер</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• Управление проектами</li>
                      <li>• Просмотр отчетов</li>
                      <li>• Назначение задач</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    }

    // Лучшие практики
    if (activeSection === 'best-practices') {
      if (activeSubsection === 'efficiency') {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Повышение эффективности</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Организация работы</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Используйте четкие названия для проектов и задач</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Регулярно обновляйте статусы задач</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Используйте теги для категоризации</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      }
    }

    // По умолчанию показываем приветствие
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Выберите раздел</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Используйте боковое меню для навигации по разделам Wiki
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {renderContent()}
    </div>
  )
}
