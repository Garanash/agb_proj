'use client'

import React, { useState, useEffect } from 'react'
import moment from 'moment'
import axios from 'axios'
import AddEventModal from './AddEventModal'
import EditEventModal from './EditEventModal'
import { useAuth } from './AuthContext'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import 'moment/locale/ru'

// Настройка moment для русского языка
moment.locale('ru')

interface Event {
  id: string
  title: string
  start_datetime: string
  end_datetime: string
  description?: string
  event_type: 'event' | 'measurement' | 'installation'
  creator_id: number
  is_active: boolean
  created_at: string
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
  const [addEventType, setAddEventType] = useState<'event' | 'measurement' | 'installation'>('event')

  // Загрузка событий с backend
  const fetchEvents = async () => {
    try {
      const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD')
      const endOfMonth = moment(currentDate).endOf('month').format('YYYY-MM-DD')
      
      const response = await axios.get(`http://localhost:8000/api/events/`, {
        params: {
          start_date: startOfMonth,
          end_date: endOfMonth
        }
      })
      setEvents(response.data)
    } catch (error) {
      console.error('Ошибка загрузки событий:', error)
      // Fallback к моковым данным
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Встреча с клиентом',
          start_datetime: moment().add(1, 'day').hour(10).minute(0).toISOString(),
          end_datetime: moment().add(1, 'day').hour(12).minute(0).toISOString(),
          description: 'Обсуждение нового проекта бурения',
          event_type: 'event',
          creator_id: 1,
          is_active: true,
          created_at: moment().toISOString()
        },
        {
          id: '2',
          title: 'Заявка на измерение',
          start_datetime: moment().add(3, 'days').hour(9).minute(0).toISOString(),
          end_datetime: moment().add(3, 'days').hour(13).minute(0).toISOString(),
          description: 'Измерение глубины скважины №157',
          event_type: 'measurement',
          creator_id: 1,
          is_active: true,
          created_at: moment().toISOString()
        },
        {
          id: '3',
          title: 'Установка оборудования',
          start_datetime: moment().add(5, 'days').hour(8).minute(0).toISOString(),
          end_datetime: moment().add(5, 'days').hour(14).minute(0).toISOString(),
          description: 'Монтаж нового бурового станка',
          event_type: 'installation',
          creator_id: 1,
          is_active: true,
          created_at: moment().toISOString()
        }
      ]
      setEvents(mockEvents)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  // Получение событий для определенной даты
  const getEventsForDate = (date: moment.Moment) => {
    return events.filter(event => {
      const eventDate = moment(event.start_datetime)
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
    setSelectedDate(date)
    setShowDayModal(true)
  }

  const handleCloseDayModal = () => {
    setShowDayModal(false)
    setSelectedDate(null)
  }

  const handleAddEvent = (eventType: 'event' | 'measurement' | 'installation') => {
    setAddEventType(eventType)
    setShowDayModal(false)
    setShowAddModal(true)
  }

  const handleEventAdded = () => {
    fetchEvents() // Перезагружаем события
    setShowAddModal(false)
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowEditModal(true)
    setShowDayModal(false)
  }

  const handleEventUpdated = () => {
    fetchEvents() // Перезагружаем события
    setShowEditModal(false)
    setSelectedEvent(null)
  }

  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`Вы уверены, что хотите удалить событие "${event.title}"?`)) return

    try {
      await axios.delete(`http://localhost:8000/api/events/${event.id}`)
      fetchEvents() // Перезагружаем события
      setShowDayModal(false)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Ошибка при удалении события')
    }
  }

  // Проверка прав на редактирование/удаление события
  const canEditEvent = (event: Event) => {
    if (!user) return false
    return user.role === 'admin' || event.creator_id === user.id
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
  const days = []
  let day = moment(startDate)
  
  while (day.isBefore(endDate, 'day') || day.isSame(endDate, 'day')) {
    days.push(moment(day))
    day = day.clone().add(1, 'day')
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Заголовок календаря */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Календарь</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={goToPrevMonth}
              className="p-2 rounded hover:bg-gray-100"
            >
              ←
            </button>
            <button 
              onClick={goToToday}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Сегодня
            </button>
            <button 
              onClick={goToNextMonth}
              className="p-2 rounded hover:bg-gray-100"
            >
              →
            </button>
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {currentDate.format('MMMM YYYY')}
          </div>
        </div>
      </div>

      {/* Кнопки быстрого добавления */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleAddEvent('event')}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Добавить событие
        </button>
        <button
          onClick={() => handleAddEvent('measurement')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Заявка на измерение
        </button>
        <button
          onClick={() => handleAddEvent('installation')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Заявка на монтаж
        </button>
      </div>

      {/* Сетка календаря */}
      <div className="space-y-4">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 gap-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-gray-600">
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
                className={`min-h-[120px] p-2 border border-gray-200 transition-colors cursor-pointer ${
                  isPastDay ? 'bg-gray-100' : 'hover:bg-gray-50'
                } ${isTodayDay ? 'bg-blue-50 border-blue-300' : ''} ${
                  !isCurrentMonthDay ? 'text-gray-400' : ''
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`text-sm font-medium ${isTodayDay ? 'text-blue-600' : ''}`}>
                  {day.format('D')}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded text-white truncate ${
                        event.event_type === 'measurement' ? 'bg-green-600' :
                        event.event_type === 'installation' ? 'bg-blue-600' :
                        'bg-purple-600'
                      }`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
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
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedDate.format('DD MMMM YYYY, dddd')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    События и планы на день
                  </p>
                </div>
                <button
                  onClick={handleCloseDayModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* События дня */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">События на этот день</h4>
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          event.event_type === 'measurement' ? 'bg-green-50 border-green-500' :
                          event.event_type === 'installation' ? 'bg-blue-50 border-blue-500' :
                          'bg-purple-50 border-purple-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">{event.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {moment(event.start_datetime).format('HH:mm')} - {moment(event.end_datetime).format('HH:mm')}
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.event_type === 'measurement' ? 'bg-green-100 text-green-800' :
                              event.event_type === 'installation' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {event.event_type === 'measurement' ? 'Измерение' :
                               event.event_type === 'installation' ? 'Монтаж' : 'Событие'}
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
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>На этот день событий не запланировано</p>
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseDayModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Закрыть
                </button>
                <button 
                  onClick={() => handleAddEvent('event')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Добавить событие
                </button>
                <button 
                  onClick={() => handleAddEvent('measurement')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Заявка на измерение
                </button>
                <button 
                  onClick={() => handleAddEvent('installation')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Заявка на монтаж
                </button>
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