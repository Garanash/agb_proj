'use client'

import React from 'react'
import { getApiUrl } from '@/utils/api';
import TextLogo from './TextLogo'

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
  console.log('PageLayout rendered with title:', title)
  
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок страницы */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <TextLogo size="sm" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 mt-2">{subtitle}</p>
                )}
              </div>
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
