'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname()
  
  // Если находимся на странице входа, не показываем сайдбар
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Для всех остальных страниц показываем основную раскладку с сайдбаром
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default AppLayout
