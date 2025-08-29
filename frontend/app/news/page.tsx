'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import PageLayout from '../../components/PageLayout'
import CreateNewsModal from '../../components/CreateNewsModal'
import EditNewsModal from '../../components/EditNewsModal'
import { useAuth } from '../../components/AuthContext'
import axios from 'axios'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { formatApiError } from '../../utils/errorHandler'

interface News {
  id: number
  title: string
  content: string
  category: string
  author_id: number
  author_name: string
  is_published: boolean
  created_at: string
  updated_at: string | null
}

export default function NewsPage() {
  const { user } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)

  // Проверяем, может ли пользователь управлять новостями
  const canManageNews = user && (user.role === 'admin' || user.role === 'manager')

  useEffect(() => {
    if (canManageNews) {
      fetchAllNews()
    } else {
      fetchPublicNews()
    }
  }, [canManageNews])

  const fetchAllNews = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${getApiUrl()}/api/news/list`)
      setNews(response.data)
    } catch (error) {
      console.error('Ошибка загрузки всех новостей:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyNews = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${getApiUrl()}/api/news/my/`)
      setNews(response.data)
    } catch (error) {
      console.error('Ошибка загрузки моих новостей:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicNews = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${getApiUrl()}/api/news/list`)
      setNews(response.data)
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNews = () => {
    setSelectedNews(null)
    setShowCreateModal(true)
  }

  const handleEditNews = (newsItem: News) => {
    setSelectedNews(newsItem)
    setShowEditModal(true)
  }

  const handleDeleteNews = async (newsId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return

    try {
      await axios.delete(`${getApiUrl()}/api/news/${newsId}`)
      if (canManageNews) {
        fetchAllNews()
      } else {
        fetchPublicNews()
      }
    } catch (error: any) {
      alert(formatApiError(error, 'Ошибка при удалении новости'))
    }
  }

  const handleNewsCreated = () => {
    setShowCreateModal(false)
    if (canManageNews) {
      fetchAllNews()
    } else {
      fetchPublicNews()
    }
  }

  const handleNewsUpdated = () => {
    setShowEditModal(false)
    setSelectedNews(null)
    if (canManageNews) {
      fetchAllNews()
    } else {
      fetchPublicNews()
    }
  }

  const canEditNews = (newsItem: News) => {
    if (!user) return false
    return user.role === 'admin' || user.role === 'manager' || newsItem.author_id === user.id
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general':
        return 'Общие'
      case 'technical':
        return 'Технические'
      case 'event':
        return 'События'
      default:
        return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general':
        return 'bg-blue-100 text-blue-800'
      case 'technical':
        return 'bg-green-100 text-green-800'
      case 'event':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <PageLayout 
      title="Новости"
      subtitle="Последние новости компании"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {canManageNews ? 'Управление новостями' : 'Новости'}
          </h1>
          {canManageNews && (
            <button
              onClick={handleCreateNews}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Создать новость
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка новостей...</p>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                {canManageNews ? 'У вас пока нет новостей' : 'Новостей пока нет'}
              </p>
              {canManageNews && (
                <button
                  onClick={handleCreateNews}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Создать первую новость
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((newsItem) => (
              <div key={newsItem.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {newsItem.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(newsItem.category)}`}>
                        {getCategoryLabel(newsItem.category)}
                      </span>
                      {!newsItem.is_published && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Не опубликовано
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {newsItem.content}
                    </p>
                    <div className="text-sm text-gray-500">
                      <span>Автор: {newsItem.author_name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(newsItem.created_at)}</span>
                      {newsItem.updated_at && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Обновлено: {formatDate(newsItem.updated_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {canEditNews(newsItem) && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditNews(newsItem)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNews(newsItem.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модальное окно создания новости */}
        <CreateNewsModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onNewsCreated={handleNewsCreated}
        />

        {/* Модальное окно редактирования новости */}
        <EditNewsModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          news={selectedNews}
          onNewsUpdated={handleNewsUpdated}
        />
      </div>
    </PageLayout>
  )
}