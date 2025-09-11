'use client'

import React, { useState } from 'react'

interface SimpleLoginFormProps {
  onLogin?: (username: string, password: string) => void
}

const SimpleLoginForm: React.FC<SimpleLoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('SimpleLoginForm rendered')

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔥 SimpleLoginForm submit triggered!')
    e.preventDefault()
    
    console.log('📝 Form submitted with:', { username, password: '***' })
    
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🚀 Making API call...')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      })
      
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Login successful:', data)
        
        // Сохраняем токен в localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('user', JSON.stringify(data.user))
          console.log('💾 Data saved to localStorage')
        }
        
        // Перенаправляем на главную страницу
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
        
        console.log('🎉 Login completed successfully!')
      } else {
        const errorText = await response.text()
        console.error('❌ Login failed:', response.status, response.statusText, errorText)
        setError('Неверное имя пользователя или пароль')
      }
    } catch (error) {
      console.error('💥 Login error:', error)
      setError('Произошла ошибка при входе в систему')
    } finally {
      setIsLoading(false)
      console.log('🏁 Login attempt finished')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Имя пользователя
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите имя пользователя"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Пароль
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите пароль"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          onClick={() => console.log('🎯 Button clicked!')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Вход...' : 'Войти'}
        </button>

        {/* Ссылка "Забыли пароль?" */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => window.location.href = '/forgot-password'}
            className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
          >
            Забыли пароль?
          </button>
        </div>
      </form>
    </div>
  )
}

export default SimpleLoginForm
