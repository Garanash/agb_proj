'use client'

import { useState } from 'react'
import Calendar from '@/components/Calendar'
import NewsWidget from '@/components/NewsWidget'
import PageLayout from '@/components/PageLayout'
import { useAuth } from '@/components/AuthContext'

export default function Home() {
  const { user } = useAuth()

  console.log('Home page rendered:', { user: !!user })

  return (
    <PageLayout 
      title={`Добро пожаловать, ${user ? `${user.last_name} ${user.first_name}` : 'Пользователь'}!`}
      subtitle="Главная страница корпоративной платформы Felix"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Календарь */}
        <div className="lg:col-span-2">
          <Calendar />
        </div>
        
        {/* Новости компании */}
        <div className="lg:col-span-1">
          <NewsWidget />
        </div>
      </div>
    </PageLayout>
  )
}