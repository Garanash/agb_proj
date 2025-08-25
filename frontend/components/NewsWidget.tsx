'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
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

  const canManageNews = user && (user.role === 'admin' || user.role === 'manager')

  // Загрузка новостей с backend
  useEffect(() => {
    fetchNews()
  }, [selectedCategory])

  const fetchNews = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      params.append('limit', '10')

      const response = await fetch(`http://localhost:8000/api/news?${params}`)
      if (response.ok) {
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
        throw new Error('Failed to fetch news')
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      // Fallback к моковым данным при ошибке
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Новое оборудование поступило на склад',
          content: 'В нашу компанию поступила партия современного бурового оборудования последнего поколения. Это позволит повысить эффективность работ и качество услуг.',
          author: 'Кавецкий С.В.',
          publishedAt: moment().subtract(1, 'day').toDate(),
          category: 'equipment'
        },
        {
          id: '2',
          title: 'Успешное завершение проекта "Северный"',
          content: 'Команда Алмазгеобур успешно завершила геологоразведочные работы на объекте "Северный". Все поставленные задачи выполнены в срок и с высоким качеством.',
          author: 'Горбунов Ю.В.',
          publishedAt: moment().subtract(2, 'days').toDate(),
          category: 'projects'
        },
        {
          id: '3',
          title: 'Обновление правил техники безопасности',
          content: 'С 1 декабря вступают в силу обновленные правила техники безопасности. Все сотрудники должны пройти дополнительный инструктаж.',
          author: 'Данилова Г.Ю.',
          publishedAt: moment().subtract(3, 'days').toDate(),
          category: 'safety'
        },
        {
          id: '4',
          title: 'Корпоративное мероприятие',
          content: 'Приглашаем всех сотрудников на корпоративное мероприятие, посвященное Дню работника геологии. Мероприятие состоится 15 декабря в 18:00.',
          author: 'Ягодина Е.В.',
          publishedAt: moment().subtract(5, 'days').toDate(),
          category: 'general'
        },
        {
          id: '5',
          title: 'Новый контракт с международной компанией',
          content: 'Алмазгеобур заключил долгосрочный контракт с ведущей международной горнодобывающей компанией на выполнение геологоразведочных работ.',
          author: 'Свинарёв А.С.',
          publishedAt: moment().subtract(7, 'days').toDate(),
          category: 'projects'
        }
      ]
      setNews(mockNews)
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
    <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Новости компании</h2>
        <div className="text-sm text-gray-500">
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
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Список новостей */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {filteredNews.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Заголовок и категория */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800 text-sm leading-tight flex-1">
                {item.title}
              </h3>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                {getCategoryName(item.category)}
              </span>
            </div>

            {/* Содержимое */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {item.content}
            </p>

            {/* Мета-информация */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Автор: {item.author}</span>
              <span>{moment(item.publishedAt).format('DD MMMM, HH:mm')}</span>
            </div>
          </div>
        ))}
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
