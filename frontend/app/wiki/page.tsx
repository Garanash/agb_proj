'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks'
import { BookOpenIcon } from '@heroicons/react/24/outline'
import WikiSidebar from '@/components/WikiSidebar'
import WikiContent from '@/components/WikiContent'

export default function WikiPage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('getting-started')
  const [activeSubsection, setActiveSubsection] = useState<string>('welcome')

  // Проверяем доступ к Wiki (исключаем заказчиков и исполнителей)
  if (!user || ['customer', 'contractor'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Доступ ограничен</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Wiki доступен только для администраторов, менеджеров, сотрудников и других ролей.
          </p>
        </div>
      </div>
    )
  }

  const handleSectionChange = (section: string, subsection?: string) => {
    setActiveSection(section)
    setActiveSubsection(subsection || '')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        <WikiSidebar 
          activeSection={activeSection}
          activeSubsection={activeSubsection}
          onSectionChange={handleSectionChange}
        />
        <WikiContent 
          activeSection={activeSection}
          activeSubsection={activeSubsection}
        />
      </div>
    </div>
  )
}