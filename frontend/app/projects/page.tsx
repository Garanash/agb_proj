'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import PageLayout from '@/components/PageLayout'
import { useAuth } from '@/components/AuthContext'
import DevelopmentModal from '@/components/DevelopmentModal'
import { PlusIcon, FolderIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function Projects() {
  const { user } = useAuth()
  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false)

  // Показать модальное окно при загрузке страницы
  useEffect(() => {
    setShowDevelopmentModal(true)
  }, [])
  
  // Проверка доступа - только администраторы и менеджеры
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return (
      <PageLayout title="Доступ запрещен">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Недостаточно прав</h2>
          <p className="text-red-700">Данная страница доступна только администраторам и менеджерам.</p>
        </div>
      </PageLayout>
    )
  }

  const projects = [
    {
      id: 1,
      name: 'Северное месторождение',
      status: 'completed',
      progress: 100,
      startDate: '2024-01-15',
      endDate: '2024-08-20',
      manager: 'Горбунов Ю.В.',
      description: 'Геологоразведочные работы на Северном месторождении'
    },
    {
      id: 2,
      name: 'Восточный участок',
      status: 'in_progress',
      progress: 65,
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      manager: 'Петров А.И.',
      description: 'Бурение разведочных скважин на восточном участке'
    },
    {
      id: 3,
      name: 'Южная площадка',
      status: 'planning',
      progress: 0,
      startDate: '2024-10-01',
      endDate: '2025-03-31',
      manager: 'Сидоров В.П.',
      description: 'Планирование геологических исследований'
    }
  ]

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Завершен', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon }
      case 'in_progress':
        return { label: 'В работе', color: 'bg-blue-100 text-blue-800', icon: ClockIcon }
      case 'planning':
        return { label: 'Планирование', color: 'bg-yellow-100 text-yellow-800', icon: FolderIcon }
      default:
        return { label: 'Неизвестно', color: 'bg-gray-100 text-gray-800', icon: FolderIcon }
    }
  }

  return (
    <PageLayout 
      title="Проекты"
      subtitle="Управление проектами геологоразведочных работ"
      headerActions={
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Новый проект</span>
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const statusInfo = getStatusInfo(project.status)
          const StatusIcon = statusInfo.icon
          
          return (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Прогресс</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Начало:</span>
                      <span>{new Date(project.startDate).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Окончание:</span>
                      <span>{new Date(project.endDate).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Менеджер:</span>
                      <span>{project.manager}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Подробнее →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Модальное окно "В разработке" */}
      <DevelopmentModal
        isOpen={showDevelopmentModal}
        onClose={() => setShowDevelopmentModal(false)}
        pageName="Проекты"
      />
    </PageLayout>
  )
}
