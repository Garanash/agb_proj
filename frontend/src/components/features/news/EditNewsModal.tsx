'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import axios from 'axios'
import { formatApiError } from '@/utils/errorHandler'

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

interface EditNewsModalProps {
  isOpen: boolean
  onClose: () => void
  onNewsUpdated: () => void
  news: News | null
}

const EditNewsModal: React.FC<EditNewsModalProps> = ({ 
  isOpen, 
  onClose, 
  onNewsUpdated, 
  news 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as 'general' | 'technical' | 'event',
    is_published: true
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('EditNewsModal rendered:', { isOpen, news: !!news })

  // Заполняем форму данными новости при открытии
  useEffect(() => {
    if (news && isOpen) {
      setFormData({
        title: news.title,
        content: news.content,
        category: news.category as 'general' | 'technical' | 'event',
        is_published: news.is_published
      })
      setError('')
    }
  }, [news, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!news) return

    setIsLoading(true)
    setError('')

    try {
      // Подготавливаем данные для обновления (отправляем только изменённые поля)
      const updateData: any = {}
      
      if (formData.title !== news.title) updateData.title = formData.title
      if (formData.content !== news.content) updateData.content = formData.content
      if (formData.category !== news.category) updateData.category = formData.category
      if (formData.is_published !== news.is_published) updateData.is_published = formData.is_published

      await axios.put(`${getApiUrl()}/api/news/${news.id}`, updateData)
      
      onNewsUpdated()
    } catch (error: any) {
      setError(formatApiError(error, 'Произошла ошибка при обновлении новости'))
    } finally {
      setIsLoading(false)
    }
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

  if (!isOpen || !news) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Редактировать новость
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок новости *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите заголовок новости"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Содержание *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите содержание новости"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категория *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Общие</option>
                <option value="technical">Технические</option>
                <option value="event">События</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
                id="is_published_edit"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published_edit" className="ml-2 block text-sm text-gray-700">
                Опубликована
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Отменить
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditNewsModal
