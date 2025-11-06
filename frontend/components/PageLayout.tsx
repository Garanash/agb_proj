'use client'

import React from 'react'
import { getApiUrl } from '@/utils/api';

interface PageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  headerActions?: React.ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  title, 
  subtitle, 
  children, 
  headerActions 
}) => {
  
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок страницы */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center space-x-4">
                {headerActions}
              </div>
            )}
          </div>
        </div>

        {/* Основной контент */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default PageLayout
