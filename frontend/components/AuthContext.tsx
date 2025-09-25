'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import axios from 'axios'
import ForcePasswordChangeModal from '@/components/ForcePasswordChangeModal'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  role: 'admin' | 'manager' | 'employee' | 'ved_passport' | 'customer' | 'contractor' | 'service_engineer'
  is_active: boolean
  is_password_changed: boolean
  created_at: string
  avatar_url?: string | null
  department_id?: number | null
  phone?: string | null
  position?: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Настройка axios для автоматического добавления токена
  useEffect(() => {
    console.log('AuthContext useEffect started')
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') {
      console.log('Not on client side, setting isLoading to false')
      setIsLoading(false)
      setHasInitialized(true)
      return
    }

    const storedToken = localStorage.getItem('access_token')
    console.log('Stored token found:', !!storedToken)
    if (storedToken) {
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      // Проверяем валидность токена в фоне
      console.log('Token found, checking validity in background')
      checkTokenValidity()
    } else {
      // Если токена нет, завершаем инициализацию
      console.log('No token found, completing initialization')
      setIsLoading(false)
      setHasInitialized(true)
    }
  }, [])

  // Таймаут для предотвращения бесконечного ожидания
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasInitialized) {
        console.log('Auth initialization timeout, forcing completion')
        setIsLoading(false)
        setHasInitialized(true)
      }
    }, 3000) // 3 секунды таймаут

    return () => clearTimeout(timeout)
  }, [hasInitialized])

  // Дополнительный таймаут для принудительного завершения
  useEffect(() => {
    const forceTimeout = setTimeout(() => {
      console.log('Force timeout reached, completing initialization')
      setIsLoading(false)
      setHasInitialized(true)
    }, 5000) // 5 секунд принудительный таймаут

    return () => clearTimeout(forceTimeout)
  }, [])

  const checkTokenValidity = async () => {
    try {
      const apiUrl = 'http://localhost:8000/api/v1/auth/me'
      console.log('API URL for token validation:', apiUrl)
      console.log('Making request to:', apiUrl)
      
      // Добавляем таймаут для запроса
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут
      
      const response = await axios.get(apiUrl, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('Response received:', response.status, response.data)
      const userData = response.data
      setUser(userData)
      console.log('User loaded:', userData)
      
      // Проверяем, нужно ли сменить пароль
      if (userData && !userData.is_password_changed) {
        setShowPasswordChangeModal(true)
      }
    } catch (error: any) {
      console.error('Token validation error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      // Токен невалиден, удаляем его
      localStorage.removeItem('access_token')
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
    } finally {
      console.log('Setting isLoading to false and hasInitialized to true')
      setIsLoading(false)
      setHasInitialized(true)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const apiUrl = 'http://localhost:8000/api/v1/auth/login'
      console.log('Login attempt:', { username, apiUrl })
      const response = await axios.post(apiUrl, {
        username,
        password
      })

      const { access_token, user: userData } = response.data
      console.log('Login successful:', { user: userData, hasToken: !!access_token })

      // Сохраняем токен
      localStorage.setItem('access_token', access_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setUser(userData)
      
      // Проверяем, нужно ли сменить пароль
      if (userData && !userData.is_password_changed) {
        setShowPasswordChangeModal(true)
      }
      
      return true
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Login error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      return false
    }
  }

  const logout = async () => {
    try {
      const apiUrl = getApiUrl()
      console.log('Logout attempt:', { apiUrl })
      await axios.post(`${apiUrl}/api/v1/auth/logout`)
      console.log('Logout successful')
    } catch (error: any) {
      console.error('Logout error:', error)
      console.error('Logout error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
    } finally {
      // Удаляем токен и пользователя в любом случае
      console.log('Clearing auth data')
      localStorage.removeItem('access_token')
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const apiUrl = getApiUrl()
      console.log('Refresh user attempt:', { apiUrl })
      const response = await axios.get(`${apiUrl}/api/v1/auth/me`)
      console.log('Refresh user successful:', response.data)
      setUser(response.data)
    } catch (error: any) {
      console.error('Refresh user error:', error)
      console.error('Refresh user error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
    }
  }

  const handlePasswordChanged = async () => {
    console.log('Password changed, refreshing user')
    setShowPasswordChangeModal(false)
    // Обновляем информацию о пользователе
    await refreshUser()
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    refreshUser,
    isLoading: isLoading || !hasInitialized,
    isAuthenticated: !!user || !!token
  }

  console.log('AuthContext value:', { 
    user: !!user, 
    token: !!token, 
    isLoading, 
    isAuthenticated: !!user,
    hasInitialized,
    timestamp: new Date().toISOString()
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ForcePasswordChangeModal 
        isOpen={showPasswordChangeModal}
        onPasswordChanged={handlePasswordChanged}
      />
    </AuthContext.Provider>
  )
}
