'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import moment from 'moment'
import axios from 'axios'
import { formatApiError } from '@/utils/errorHandler'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks'

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  department_id: number | null
}

interface EventParticipant {
  id: number
  event_id: number
  user_id: number
  created_at: string
}

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  description?: string
  event_type: 'meeting' | 'call' | 'briefing' | 'conference' | 'other'
  organizer_id: number
  is_public: boolean
  is_active: boolean
  created_at: string
  participants: EventParticipant[]
}

interface EditEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventUpdated: () => void
  event: Event | null
}

const EditEventModal: React.FC<EditEventModalProps> = ({ 
  isOpen, 
  onClose, 
  onEventUpdated, 
  event 
}) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    event_type: 'meeting' as 'meeting' | 'call' | 'briefing' | 'conference' | 'other',
    is_public: false,
    participants: [] as number[]
  })
  
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<{[key: number]: string}>({})
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('EditEventModal rendered:', { isOpen, event: !!event })

  // Загрузка пользователей и отделов
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const [usersResponse, departmentsResponse] = await Promise.all([
          axios.get(`${getApiUrl()}/api/v1/users/chat-users`),
          axios.get(`${getApiUrl()}/api/v1/departments/list`)
        ])
        
        setUsers(usersResponse.data)
        
        // Создаем словарь отделов
        const deptMap: {[key: number]: string} = {}
        departmentsResponse.data.forEach((dept: any) => {
          deptMap[dept.id] = dept.name
        })
        setDepartments(deptMap)
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  // Заполняем форму данными события при открытии
  useEffect(() => {
    if (event && isOpen) {
      const startMoment = moment(event.start_date)
      const endMoment = moment(event.end_date)

      // Убеждаемся, что создатель события всегда в списке участников
      const participants = event.participants.map(p => p.user_id)
      if (!participants.includes(event.organizer_id)) {
        participants.push(event.organizer_id)
      }
      
      setFormData({
        title: event.title,
        description: event.description || '',
        start_date: startMoment.format('YYYY-MM-DD'),
        start_time: startMoment.format('HH:mm'),
        end_date: endMoment.format('YYYY-MM-DD'),
        end_time: endMoment.format('HH:mm'),
        event_type: event.event_type,
        is_public: event.is_public,
        participants: participants
      })
      setError('')
    }
  }, [event, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'participants') {
      const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions)
      const selectedIds = selectedOptions.map(option => parseInt(option.value))
      setFormData(prev => ({
        ...prev,
        participants: selectedIds
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
    if (!event) return

    setIsLoading(true)
    setError('')

    try {
      // Формируем даты и время
      const startDateTime = moment(`${formData.start_date} ${formData.start_time}`).toISOString()
      const endDateTime = moment(`${formData.end_date} ${formData.end_time}`).toISOString()

      // Подготавливаем данные для обновления
      const updateData: any = {}
      
      if (formData.title !== event.title) updateData.title = formData.title
      if ((formData.description || '') !== (event.description || '')) updateData.description = formData.description || null
      if (startDateTime !== event.start_date) updateData.start_date = startDateTime
      if (endDateTime !== event.end_date) updateData.end_date = endDateTime
      if (formData.event_type !== event.event_type) updateData.event_type = formData.event_type
      if (formData.is_public !== event.is_public) updateData.is_public = formData.is_public
      
      // Сравниваем списки участников
      const currentParticipants = event.participants.map(p => p.user_id).sort()
      const newParticipants = [...formData.participants].sort()
      if (JSON.stringify(currentParticipants) !== JSON.stringify(newParticipants)) {
        updateData.participants = formData.participants
      }

      await axios.put(`${getApiUrl()}/api/v1/events/${event.id}`, updateData)
      
      onEventUpdated()
      onClose()
    } catch (error: any) {
      setError(formatApiError(error, 'Произошла ошибка при обновлении события'))
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

  if (!isOpen || !event) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактировать событие" maxWidth="2xl">
      <div className="p-6">
        <form onSubmit={handleSubmit}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата начала *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  Дата окончания *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
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

            {/* Поле для общих событий - только для админов */}
            {user?.role === 'admin' && (
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        is_public: e.target.checked
                      }))
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    🌍 Общее событие для всех пользователей
                  </span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Общие события будут видны всем пользователям в календаре
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Участники
              </label>
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Информация:</strong> Создатель события автоматически остается участником и не может быть удален.
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                {Object.entries(departments).map(([deptId, deptName]) => {
                  const deptUsers = users.filter(user => user.department_id === parseInt(deptId))
                  if (deptUsers.length === 0) return null
                  
                  return (
                    <div key={deptId} className="mb-3">
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">{deptName}</h4>
                      <div className="space-y-2">
                        {deptUsers.map(user => (
                          <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.participants.includes(user.id)}
                              disabled={user.id === event?.organizer_id}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    participants: [...prev.participants, user.id]
                                  }))
                                } else {
                                  // Не позволяем удалить создателя события
                                  if (user.id === event?.organizer_id) {
                                    return
                                  }
                                  setFormData(prev => ({
                                    ...prev,
                                    participants: prev.participants.filter(id => id !== user.id)
                                  }))
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={`text-sm ${user.id === event?.organizer_id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                              {user.first_name} {user.last_name}
                              {user.id === event?.organizer_id && ' (создатель)'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {users.filter(user => !user.department_id).length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">Без отдела</h4>
                    <div className="space-y-2">
                                              {users
                          .filter(user => !user.department_id)
                          .map(user => (
                            <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.participants.includes(user.id)}
                                disabled={user.id === event?.organizer_id}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      participants: [...prev.participants, user.id]
                                    }))
                                  } else {
                                    // Не позволяем удалить создателя события
                                    if (user.id === event?.organizer_id) {
                                      return
                                    }
                                    setFormData(prev => ({
                                      ...prev,
                                      participants: prev.participants.filter(id => id !== user.id)
                                    }))
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={`text-sm ${user.id === event?.organizer_id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                                {user.first_name} {user.last_name}
                                {user.id === event?.organizer_id && ' (создатель)'}
                              </span>
                            </label>
                          ))
                        }
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Отметьте чекбоксы для выбора участников
              </p>
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
    </Modal>
  )
}

export default EditEventModal
