'use client'

import React, { useState } from 'react'
import moment from 'moment'
import axios from 'axios'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: moment.Moment | null
  onEventAdded: () => void
  initialEventType?: 'meeting' | 'call' | 'briefing' | 'conference' | 'other'
}

const AddEventModal: React.FC<AddEventModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onEventAdded,
  initialEventType = 'meeting'
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '09:00',
    end_time: '10:00',
    event_type: initialEventType
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    setIsLoading(true)
    setError('')

    try {
      // Формируем даты и время
      const startDateTime = moment(selectedDate)
        .hour(parseInt(formData.start_time.split(':')[0]))
        .minute(parseInt(formData.start_time.split(':')[1]))
        .toISOString()

      const endDateTime = moment(selectedDate)
        .hour(parseInt(formData.end_time.split(':')[0]))
        .minute(parseInt(formData.end_time.split(':')[1]))
        .toISOString()

      const eventData = {
        title: formData.title,
        description: formData.description || null,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        event_type: formData.event_type
      }

      await axios.post('http://localhost:8000/api/events/', eventData)
      
      onEventAdded()
      onClose()
      
      // Сбрасываем форму
      setFormData({
        title: '',
        description: '',
        start_time: '09:00',
        end_time: '10:00',
        event_type: initialEventType
      })
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Произошла ошибка при создании события')
    } finally {
      setIsLoading(false)
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Встреча'
      case 'call':
        return 'Созвон'
      case 'briefing':
        return 'Планерка'
      case 'conference':
        return 'Совещание'
      case 'other':
        return 'Другое'
      default:
        return type
    }
  }

  if (!isOpen || !selectedDate) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Добавить событие
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
          <p className="text-sm text-gray-600 mt-2">
            {selectedDate.format('DD MMMM YYYY, dddd')}
          </p>
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
                Название события *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название события"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите описание события (необязательно)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Время начала *
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Время окончания *
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип события *
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="meeting">Встреча</option>
                <option value="call">Созвон</option>
                <option value="briefing">Планерка</option>
                <option value="conference">Совещание</option>
                <option value="other">Другое</option>
              </select>
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
              {isLoading ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEventModal
