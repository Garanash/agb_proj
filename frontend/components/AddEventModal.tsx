'use client'

import React, { useState, useEffect } from 'react'
import moment from 'moment'
import axios from 'axios'
import { formatApiError } from '../utils/errorHandler'
import Modal from './Modal'

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  department_id: number | null
}

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
    event_type: initialEventType,
    participants: [] as number[]
  })
  
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<{[key: number]: string}>({})
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('AddEventModal rendered:', { isOpen, selectedDate: !!selectedDate, initialEventType })



  // Загрузка пользователей и отделов
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        console.log('Загружаем пользователей и отделы...')
        const [usersResponse, departmentsResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/users/chat-users/'),
          axios.get('http://localhost:8000/api/departments/')
        ])
        
        console.log('Получено пользователей:', usersResponse.data.length)
        console.log('Получено отделов:', departmentsResponse.data.length)
        
        setUsers(usersResponse.data)
        
        // Создаем словарь отделов
        const deptMap: {[key: number]: string} = {}
        departmentsResponse.data.forEach((dept: any) => {
          deptMap[dept.id] = dept.name
        })
        setDepartments(deptMap)
        
        console.log('Словарь отделов:', deptMap)
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
        // Показываем ошибку пользователю
        if (error.response) {
          console.error('Статус ошибки:', error.response.status)
          console.error('Данные ошибки:', error.response.data)
        }
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'participants') {
      const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions)
      const selectedIds = selectedOptions.map(option => parseInt(option.value))
      setFormData(prev => ({
        ...prev,
        participants: selectedIds
      }))
    } else if (name === 'event_type') {
      setFormData(prev => ({
        ...prev,
        event_type: value as 'meeting' | 'call' | 'briefing' | 'conference' | 'other'
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
        event_type: formData.event_type,
        participants: formData.participants
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
        event_type: initialEventType,
        participants: []
      })
    } catch (error: any) {
      console.error('Ошибка создания события:', error)
      let errorMessage = 'Произошла ошибка при создании события'
      
      if (error.response) {
        // Ошибка от сервера
        if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.status === 400) {
          errorMessage = 'Некорректные данные события'
        } else if (error.response.status === 401) {
          errorMessage = 'Необходима авторизация'
        } else if (error.response.status === 403) {
          errorMessage = 'Недостаточно прав для создания события'
        } else if (error.response.status === 500) {
          errorMessage = 'Ошибка сервера при создании события'
        }
      } else if (error.request) {
        // Ошибка сети
        errorMessage = 'Ошибка соединения с сервером'
      } else {
        // Другие ошибки
        errorMessage = error.message || errorMessage
      }
      
      setError(errorMessage)
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
    <Modal isOpen={isOpen} onClose={onClose} title="Добавить событие" maxWidth="2xl">
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-6">
          {selectedDate.format('DD MMMM YYYY, dddd')}
        </p>

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
                Тип события
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
                Участники
              </label>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Загрузка пользователей...</span>
                </div>
              ) : (
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
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      participants: [...prev.participants, user.id]
                                    }))
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      participants: prev.participants.filter(id => id !== user.id)
                                    }))
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {user.first_name} {user.last_name}
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
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      participants: [...prev.participants, user.id]
                                    }))
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      participants: prev.participants.filter(id => id !== user.id)
                                    }))
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {user.first_name} {user.last_name}
                              </span>
                            </label>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              {isLoading ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default AddEventModal
