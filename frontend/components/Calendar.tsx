'use client'

import React, { useState, useEffect } from 'react'
import { getApiEndpoint, getApiUrl } from '@/utils';
import moment from 'moment'
import axios from 'axios'
import { formatApiError } from '@/utils'
import AddEventModal from './AddEventModal'
import EditEventModal from './EditEventModal'
import { useAuth } from '@/hooks'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import 'moment/locale/ru'

// Настройка moment для русского языка
moment.locale('ru')

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
  user: User
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

const Calendar: React.FC = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(moment())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [addEventType, setAddEventType] = useState<'meeting' | 'call' | 'briefing' | 'conference' | 'other'>('meeting')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('Calendar rendered:', { user: !!user, eventsCount: events.length })

  // Загрузка событий с backend
  const fetchEvents = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD')
      const endOfMonth = moment(currentDate).endOf('month').format('YYYY-MM-DD')
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token')
      
      const response = await axios.get(getApiEndpoint('/events/'), {
        params: {
          start_date: startOfMonth,
          end_date: endOfMonth
        },
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
      setEvents(response.data)
    } catch (error) {
      console.error('Ошибка загрузки событий:', error)
      setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке событий')
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  // Получение событий для определенной даты
  const getEventsForDate = (date: moment.Moment) => {
    return events.filter(event => {
      const eventDate = moment(event.start_date)
      return eventDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    })
  }

  // Навигация по месяцам
  const goToPrevMonth = () => {
    setCurrentDate(moment(currentDate).subtract(1, 'month'))
  }

  const goToNextMonth = () => {
    setCurrentDate(moment(currentDate).add(1, 'month'))
  }

  const goToToday = () => {
    setCurrentDate(moment())
  }

  const handleDateClick = (date: moment.Moment) => {
    // Проверяем, не является ли дата прошедшей
    if (isPast(date)) {
      alert('Нельзя создавать события в прошедшие даты')
      return
    }
    setSelectedDate(date)
    setShowDayModal(true)
  }

  const handleCloseDayModal = () => {
    setShowDayModal(false)
    setSelectedDate(null)
  }

  const handleAddEvent = (eventType?: 'meeting' | 'call' | 'briefing' | 'conference' | 'other') => {
    if (eventType) {
      setAddEventType(eventType)
    } else {
      setAddEventType('meeting') // По умолчанию
    }
    setShowDayModal(false)
    setShowAddModal(true)
  }

  const handleEventAdded = () => {
    // Добавляем небольшую задержку перед обновлением, чтобы бэкенд успел обработать запрос
    setTimeout(() => {
      fetchEvents() // Перезагружаем события
    }, 500)
    setShowAddModal(false)
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowEditModal(true)
    setShowDayModal(false)
  }

  const handleEventUpdated = () => {
    // Добавляем небольшую задержку перед обновлением, чтобы бэкенд успел обработать запрос
    setTimeout(() => {
      fetchEvents() // Перезагружаем события
    }, 500)
    setShowEditModal(false)
    setSelectedEvent(null)
  }

  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`Вы уверены, что хотите удалить событие "${event.title}"?`)) return

    try {
      await axios.delete(`${getApiUrl()}/api/v1/events/${event.id}`)
      fetchEvents() // Перезагружаем события
      setShowDayModal(false)
    } catch (error: any) {
              alert(formatApiError(error, 'Ошибка при удалении события'))
    }
  }

  // Проверка прав на редактирование/удаление события
  const canEditEvent = (event: Event) => {
    if (!user) return false
    return user.role === 'admin' || event.organizer_id === user.id
  }

  // Функции для определения дат в календаре
  const startDate = moment(currentDate).startOf('month').startOf('week')
  const endDate = moment(currentDate).endOf('month').endOf('week')
  const today = moment()

  const isToday = (date: moment.Moment) => {
    return date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD')
  }

  const isPast = (date: moment.Moment) => {
    return date.isBefore(today, 'day')
  }

  const isCurrentMonth = (date: moment.Moment) => {
    return date.month() === currentDate.month()
  }

  // Генерируем дни для отображения
  const days: moment.Moment[] = []
  let day = moment(startDate)
  
  while (day.isBefore(endDate, 'day') || day.isSame(endDate, 'day')) {
    days.push(moment(day))
    day = day.clone().add(1, 'day')
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Заголовок календаря */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Календарь</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={goToPrevMonth}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              ←
            </button>
            <button 
              onClick={goToToday}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Сегодня
            </button>
            <button 
              onClick={goToNextMonth}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              →
            </button>
          </div>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {currentDate.format('MMMM YYYY')}
          </div>
        </div>
      </div>



      {/* Сетка календаря */}
      <div className="space-y-4">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 gap-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day)
            const isPastDay = isPast(day)
            const isTodayDay = isToday(day)
            const isCurrentMonthDay = isCurrentMonth(day)

            return (
              <div
                key={index}
                className={`min-h-[90px] p-2 border border-gray-200 dark:border-gray-600 transition-colors ${
                  isPastDay ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                } ${isTodayDay ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600' : ''} ${
                  !isCurrentMonthDay ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                }`}
                onClick={isPastDay ? undefined : () => handleDateClick(day)}
                title={isPastDay ? 'Нельзя создавать события в прошедшие даты' : 'Нажмите для просмотра событий'}
              >
                <div className={`text-sm font-medium ${isTodayDay ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  {day.format('D')}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded text-white truncate ${
                        event.event_type === 'call' ? 'bg-green-600' :
                        event.event_type === 'briefing' ? 'bg-blue-600' :
                        event.event_type === 'conference' ? 'bg-orange-600' :
                        event.event_type === 'other' ? 'bg-gray-600' :
                        'bg-purple-600'
                      } ${event.is_public ? 'ring-2 ring-yellow-300' : ''}`}
                      title={`${event.title}${event.is_public ? ' (Общее событие)' : ''}`}
                    >
                      {event.is_public && '🌍 '}
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayEvents.length - 3} еще
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Модальное окно для дня */}
      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedDate.format('DD MMMM YYYY, dddd')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    События и планы на день
                  </p>
                </div>
                <button
                  onClick={handleCloseDayModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* События дня */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">События на этот день</h4>
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          event.event_type === 'call' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400' :
                          event.event_type === 'briefing' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400' :
                          event.event_type === 'conference' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 dark:border-orange-400' :
                          event.event_type === 'other' ? 'bg-gray-50 dark:bg-gray-700 border-gray-500 dark:border-gray-400' :
                          'bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-400'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</h5>
                              {event.is_public && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                                  🌍 Общее событие
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {moment(event.start_date).format('HH:mm')} - {moment(event.end_date).format('HH:mm')}
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{event.description}</p>
                            )}
                            {event.participants.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Участники:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {event.participants.map(participant => (
                                    <span
                                      key={participant.id}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                                    >
                                      {participant.user?.first_name || ''} {participant.user?.last_name || ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.event_type === 'call' ? 'bg-green-100 text-green-800' :
                              event.event_type === 'briefing' ? 'bg-blue-100 text-blue-800' :
                              event.event_type === 'conference' ? 'bg-orange-100 text-orange-800' :
                              event.event_type === 'other' ? 'bg-gray-100 text-gray-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {event.event_type === 'meeting' ? 'Встреча' :
                               event.event_type === 'call' ? 'Созвон' :
                               event.event_type === 'briefing' ? 'Планерка' :
                               event.event_type === 'conference' ? 'Совещание' : 'Другое'}
                            </span>
                            {canEditEvent(event) && (
                              <>
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Редактировать"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title="Удалить"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>На этот день событий не запланировано</p>
                  </div>
                )}
              </div>

              {/* Кнопки быстрого добавления событий */}
              {!isPast(selectedDate) && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Быстрое добавление события</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleAddEvent('meeting')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      📅 Встреча
                    </button>
                    <button
                      onClick={() => handleAddEvent('call')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      📞 Созвон
                    </button>
                    <button
                      onClick={() => handleAddEvent('briefing')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📋 Планерка
                    </button>
                    <button
                      onClick={() => handleAddEvent('conference')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      🏢 Совещание
                    </button>
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseDayModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Закрыть
                </button>
                {selectedDate && isPast(selectedDate) ? (
                  <button 
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
                    title="Нельзя создавать события в прошедшие даты"
                  >
                    Создать событие
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAddEvent('other')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Создать событие (Другое)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления события */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedDate={selectedDate}
        onEventAdded={handleEventAdded}
        initialEventType={addEventType}
      />

      {/* Модальное окно редактирования события */}
      <EditEventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        event={selectedEvent}
        onEventUpdated={handleEventUpdated}
      />
    </div>
  )
}

export default Calendar