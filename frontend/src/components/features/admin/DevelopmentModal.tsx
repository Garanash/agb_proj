'use client'

import React from 'react'

import { getApiUrl } from '@/utils/api';
interface DevelopmentModalProps {
  isOpen: boolean
  onClose: () => void
  pageName: string
}

const DevelopmentModal: React.FC<DevelopmentModalProps> = ({ 
  isOpen, 
  onClose, 
  pageName 
}) => {
  console.log('DevelopmentModal rendered:', { isOpen, pageName })
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Иконка */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
            <svg 
              className="w-8 h-8 text-yellow-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          {/* Заголовок */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Страница в разработке
          </h3>

          {/* Описание */}
          <p className="text-gray-600 text-center mb-6">
            Раздел <span className="font-medium">"{pageName}"</span> находится в разработке. 
            Данный функционал будет доступен в ближайшем обновлении.
          </p>

          {/* Дополнительная информация */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Что будет доступно:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  {pageName === 'Проекты' ? (
                    <>
                      <li>Управление проектами</li>
                      <li>Трекинг задач</li>
                      <li>Календарь проектов</li>
                      <li>Отчеты по проектам</li>
                    </>
                  ) : (
                    <>
                      <li>Аналитические отчеты</li>
                      <li>Экспорт данных</li>
                      <li>Графики и диаграммы</li>
                      <li>Автоматическая генерация</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  )
}

export default DevelopmentModal
