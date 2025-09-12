'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils';
import { PageLayout } from '@/components/layout'
import { useAuth } from '@/hooks'
import { DevelopmentModal } from '@/components/features/admin'
import { DocumentArrowDownIcon, ChartBarIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline'

export default function Reports() {
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

  const reportTypes = [
    {
      id: 1,
      title: 'Отчет по проектам',
      description: 'Сводная информация о ходе выполнения проектов',
      icon: ChartBarIcon,
      color: 'bg-blue-100 text-blue-600',
      lastGenerated: '2024-08-20'
    },
    {
      id: 2,
      title: 'Финансовый отчет',
      description: 'Анализ расходов и доходов по проектам',
      icon: DocumentTextIcon,
      color: 'bg-green-100 text-green-600',
      lastGenerated: '2024-08-15'
    },
    {
      id: 3,
      title: 'Отчет по персоналу',
      description: 'Загруженность сотрудников и распределение задач',
      icon: CalendarIcon,
      color: 'bg-purple-100 text-purple-600',
      lastGenerated: '2024-08-18'
    },
    {
      id: 4,
      title: 'Технический отчет',
      description: 'Состояние оборудования и техническая статистика',
      icon: DocumentArrowDownIcon,
      color: 'bg-orange-100 text-orange-600',
      lastGenerated: '2024-08-22'
    }
  ]

  return (
    <PageLayout 
      title="Отчеты"
      subtitle="Генерация и просмотр отчетов по различным аспектам деятельности"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon
          
          return (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{report.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Последнее обновление: {new Date(report.lastGenerated).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Просмотр
                      </button>
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Генерировать
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Быстрая аналитика */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Быстрая аналитика</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-sm text-gray-600">Активных проектов</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">85%</div>
            <div className="text-sm text-gray-600">Средний прогресс</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">47</div>
            <div className="text-sm text-gray-600">Сотрудников в работе</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-2">98%</div>
            <div className="text-sm text-gray-600">Готовность оборудования</div>
          </div>
        </div>
      </div>

      {/* Модальное окно "В разработке" */}
      <DevelopmentModal
        isOpen={showDevelopmentModal}
        onClose={() => setShowDevelopmentModal(false)}
        pageName="Отчеты"
      />
    </PageLayout>
  )
}
