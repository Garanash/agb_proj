'use client'

import React from 'react'
import { PlayIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface VideoPlaceholderProps {
  title: string
  description: string
  duration?: string
  steps?: string[]
  className?: string
}

export default function VideoPlaceholder({
  title,
  description,
  duration,
  steps,
  className = ""
}: VideoPlaceholderProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
        {duration && (
          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>Длительность: {duration}</span>
          </div>
        )}
      </div>

      {/* Заглушка видео */}
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 text-white rounded-full p-6 mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <PlayIcon className="h-8 w-8" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Видео в разработке</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Демонстрация будет доступна в ближайшее время
          </p>
          <div className="flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span className="text-xs">Скоро</span>
          </div>
        </div>
      </div>

      {/* Шаги демонстрации */}
      {steps && steps.length > 0 && (
        <div className="p-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Что будет показано в демонстрации:</h4>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
