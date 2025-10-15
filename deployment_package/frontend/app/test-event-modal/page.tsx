'use client'

import React, { useState } from 'react'
import moment from 'moment'

// Простой тестовый компонент для проверки чекбоксов
const TestParticipantsSection = () => {
  const [participants, setParticipants] = useState<number[]>([1]) // Текущий пользователь

  // Тестовые данные
  const departments = {
    21: 'Отдел разработки',
    22: 'Отдел бурения'
  }

  const users = [
    { id: 11, first_name: 'Администратор', last_name: 'Системы', department_id: 21 },
    { id: 12, first_name: 'Тестовый', last_name: 'Пользователь', department_id: 22 },
    { id: 13, first_name: 'Тест', last_name: 'Заказчик', department_id: null },
    { id: 14, first_name: 'Алексей', last_name: 'Исполнитель', department_id: null },
    { id: 15, first_name: 'Иванов', last_name: 'Иван', department_id: null }
  ]

  const handleParticipantChange = (userId: number, checked: boolean) => {
    if (checked) {
      setParticipants(prev => [...prev, userId])
    } else {
      setParticipants(prev => prev.filter(id => id !== userId))
    }
  }

  return (
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
                    checked={participants.includes(user.id)}
                    onChange={(e: any) => handleParticipantChange(user.id, e.target.checked)}
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
                    checked={participants.includes(user.id)}
                    onChange={(e: any) => handleParticipantChange(user.id, e.target.checked)}
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
      <div className="mt-2 text-xs text-gray-500">
        Выбранные участники: {participants.join(', ')}
      </div>
    </div>
  )
}

export default function TestEventModalPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Тест чекбоксов участников</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Секция участников (тестовые данные)</h2>
          <TestParticipantsSection />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Что должно работать</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Чекбоксы должны отображаться для каждого пользователя</li>
            <li>Пользователи должны быть сгруппированы по отделам</li>
            <li>Должна быть секция "Без отдела"</li>
            <li>Чекбоксы должны менять состояние при клике</li>
            <li>Список выбранных участников должен обновляться</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
