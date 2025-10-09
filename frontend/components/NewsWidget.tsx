'use client'

import React, { useState, useEffect } from 'react'
import { getApiEndpoint } from '@/utils';
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks'
import moment from 'moment'
import 'moment/locale/ru'

moment.locale('ru')

interface NewsItem {
  id: string
  title: string
  content: string
  author: string
  publishedAt: Date
  category: 'general' | 'safety' | 'equipment' | 'projects'
}

const NewsWidget: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [news, setNews] = useState<NewsItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  const canManageNews = user && (user.role === 'admin' || user.role === 'manager')

  console.log('NewsWidget rendered:', { user: !!user, newsCount: news.length })

  // Загрузка новостей с backend
  useEffect(() => {
    fetchNews()
  }, [selectedCategory])

  const fetchNews = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      params.append('limit', '10')

      const response: any = await fetch(getApiEndpoint('/news/') + `?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (response.status >= 200 && response.status < 300) {
        const newsData = await response.json()
        const formattedNews = newsData.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          content: item.content,
          author: item.author_name,
          publishedAt: new Date(item.created_at),
          category: item.category
        }))
        setNews(formattedNews)
      } else {
        console.error('Failed to fetch news:', response.status)
        setNews([])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setNews([])
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'general':
        return 'Общие'
      case 'safety':
        return 'Безопасность'
      case 'equipment':
        return 'Оборудование'
      case 'projects':
        return 'Проекты'
      default:
        return 'Все'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general':
        return 'bg-blue-100 text-blue-800'
      case 'safety':
        return 'bg-red-100 text-red-800'
      case 'equipment':
        return 'bg-green-100 text-green-800'
      case 'projects':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => item.category === selectedCategory)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Новости компании</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {news.length} новостей
        </div>
      </div>

      {/* Фильтр по категориям */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Все
          </button>
          {['general', 'safety', 'equipment', 'projects'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {getCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Список новостей */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Загрузка новостей...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Нет новостей в этой категории.</p>
          </div>
        ) : (
          filteredNews.map((item) => (
            <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
              {/* Заголовок и категория */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight flex-1">
                  {item.title}
                </h3>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                  {getCategoryName(item.category)}
                </span>
              </div>

              {/* Содержимое */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                {item.content}
              </p>

              {/* Мета-информация */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Автор: {item.author}</span>
                <span>{moment(item.publishedAt).format('DD MMMM, HH:mm')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Кнопка управления новостями */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button 
          onClick={() => router.push('/news')}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {canManageNews ? 'Управление новостями' : 'Показать все новости'}
        </button>
      </div>
    </div>
  )
}

export default NewsWidget
