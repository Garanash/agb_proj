'use client'

import { useState } from 'react'
import { 
  BookOpenIcon, 
  PlayIcon, 
  QuestionMarkCircleIcon, 
  ChartBarIcon,
  ChevronRightIcon,
  ChevronDownIcon,
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

interface WikiSection {
  id: string
  title: string
  icon: any
  description: string
  subsections?: WikiSubsection[]
}

interface WikiSubsection {
  id: string
  title: string
  icon: any
}

interface WikiSidebarProps {
  activeSection: string
  activeSubsection?: string
  onSectionChange: (section: string, subsection?: string) => void
}

export default function WikiSidebar({ activeSection, activeSubsection, onSectionChange }: WikiSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started', 'user-guide'])

  const sections: WikiSection[] = [
    {
      id: 'getting-started',
      title: 'Быстрый старт',
      icon: RocketLaunchIcon,
      description: 'Начало работы с платформой',
      subsections: [
        { id: 'welcome', title: 'Добро пожаловать', icon: HomeIcon },
        { id: 'first-steps', title: 'Первые шаги', icon: CheckCircleIcon },
        { id: 'interface', title: 'Интерфейс', icon: CogIcon }
      ]
    },
    {
      id: 'user-guide',
      title: 'Руководство пользователя',
      icon: BookOpenIcon,
      description: 'Подробное руководство по использованию',
      subsections: [
        { id: 'navigation', title: 'Навигация', icon: ChartBarIcon },
        { id: 'projects', title: 'Проекты', icon: DocumentTextIcon },
        { id: 'documents', title: 'Документы', icon: DocumentIcon },
        { id: 'reports', title: 'Отчеты', icon: ChartBarIcon },
        { id: 'chat', title: 'Чат', icon: UserGroupIcon }
      ]
    },
    {
      id: 'video-demos',
      title: 'Видео демонстрации',
      icon: VideoCameraIcon,
      description: 'Видеоуроки и демонстрации',
      subsections: [
        { id: 'platform-overview', title: 'Обзор платформы', icon: PlayIcon },
        { id: 'project-creation', title: 'Создание проекта', icon: DocumentTextIcon },
        { id: 'document-workflow', title: 'Работа с документами', icon: DocumentIcon },
        { id: 'report-generation', title: 'Генерация отчетов', icon: ChartBarIcon }
      ]
    },
    {
      id: 'faq',
      title: 'Часто задаваемые вопросы',
      icon: QuestionMarkCircleIcon,
      description: 'Ответы на популярные вопросы',
      subsections: [
        { id: 'general', title: 'Общие вопросы', icon: InformationCircleIcon },
        { id: 'technical', title: 'Технические вопросы', icon: WrenchScrewdriverIcon },
        { id: 'troubleshooting', title: 'Решение проблем', icon: ExclamationTriangleIcon }
      ]
    },
    {
      id: 'business-processes',
      title: 'Бизнес-процессы',
      icon: ChartBarIcon,
      description: 'Схемы и диаграммы процессов',
      subsections: [
        { id: 'user-management', title: 'Управление пользователями', icon: UserGroupIcon },
        { id: 'project-workflow', title: 'Рабочие процессы', icon: DocumentTextIcon },
        { id: 'automation', title: 'Автоматизация', icon: CogIcon },
        { id: 'role-schemes', title: 'Схемы по ролям', icon: ShieldCheckIcon }
      ]
    },
    {
      id: 'security',
      title: 'Безопасность и доступы',
      icon: ShieldCheckIcon,
      description: 'Политики безопасности и управления доступом',
      subsections: [
        { id: 'access-control', title: 'Контроль доступа', icon: ShieldCheckIcon },
        { id: 'password-policy', title: 'Политика паролей', icon: LockClosedIcon },
        { id: 'data-protection', title: 'Защита данных', icon: DocumentIcon }
      ]
    },
    {
      id: 'best-practices',
      title: 'Лучшие практики',
      icon: LightBulbIcon,
      description: 'Рекомендации по эффективному использованию',
      subsections: [
        { id: 'efficiency', title: 'Повышение эффективности', icon: ClockIcon },
        { id: 'collaboration', title: 'Совместная работа', icon: UserGroupIcon },
        { id: 'data-management', title: 'Управление данными', icon: DocumentIcon }
      ]
    }
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const isSectionExpanded = (sectionId: string) => expandedSections.includes(sectionId)

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpenIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Wiki</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">База знаний</p>
          </div>
        </div>

        <nav className="space-y-2">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => {
                  if (section.subsections && section.subsections.length > 0) {
                    toggleSection(section.id)
                  } else {
                    onSectionChange(section.id)
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  activeSection === section.id && !activeSubsection
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <section.icon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {section.description}
                    </div>
                  </div>
                </div>
                {section.subsections && section.subsections.length > 0 && (
                  isSectionExpanded(section.id) ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )
                )}
              </button>

              {section.subsections && isSectionExpanded(section.id) && (
                <div className="ml-6 mt-2 space-y-1">
                  {section.subsections.map((subsection) => (
                    <button
                      key={subsection.id}
                      onClick={() => onSectionChange(section.id, subsection.id)}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id && activeSubsection === subsection.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <subsection.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{subsection.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
