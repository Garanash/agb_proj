'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import type { User, AuthContextType } from '../types/index';
import axios from 'axios'

// Типы импортированы из @/types

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// useAuth перенесен в @/hooks/useAuth
export const useAuth = (): AuthContextType => {
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
      // Проверяем валидность токена при загрузке
      console.log('Token found, checking validity')
      checkTokenValidity()
    } else {
      // Если токена нет, сразу завершаем загрузку
      console.log('No token found, setting isLoading to false')
      setIsLoading(false)
      setHasInitialized(true)
    }
  }, [])

  // Отдельный useEffect для проверки токена при его изменении
  useEffect(() => {
    if (token && !user) {
      console.log('Token available but no user, checking validity')
      checkTokenValidity()
    }
  }, [token])

  // Таймаут для предотвращения бесконечного ожидания
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasInitialized) {
        console.log('Auth initialization timeout, forcing completion')
        setIsLoading(false)
        setHasInitialized(true)
      }
    }, 5000) // 5 секунд таймаут

    return () => clearTimeout(timeout)
  }, [hasInitialized])

  const checkTokenValidity = async () => {
    try {
      const apiUrl = getApiUrl()
      console.log('🔍 API URL for token validation:', apiUrl)
      console.log('🔍 Making request to:', `${apiUrl}/api/v1/auth/me`)
      console.log('🔍 Current axios headers:', axios.defaults.headers.common)
      const response = await axios.get(`${apiUrl}/api/v1/auth/me`)
      console.log('✅ Response received:', response.status, response.data)
      setUser(response.data)
      console.log('✅ User loaded:', response.data)
    } catch (error: any) {
      console.error('❌ Token validation error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      // Токен невалиден, удаляем его
      localStorage.removeItem('access_token')
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
    } finally {
      console.log('🏁 Setting isLoading to false and hasInitialized to true')
      setIsLoading(false)
      setHasInitialized(true)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const apiUrl = getApiUrl()
      const response = await axios.post(`${apiUrl}/api/v1/auth/login`, {
        username,
        password
      })

      const { access_token, user: userData } = response.data

      // Сохраняем токен только на клиенте
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access_token)
      }
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setUser(userData)
      return true
    } catch (error: any) {
      console.error('Login error:', error.message)
      return false
    }
  }

  const logout = async () => {
    try {
      const apiUrl = getApiUrl()
      await axios.post(`${apiUrl}/api/v1/auth/logout`)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Удаляем токен и пользователя в любом случае
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/v1/auth/me`)
      setUser(response.data)
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    refreshUser,
    isLoading: isLoading || !hasInitialized,
    isAuthenticated: !!user
  }

  console.log('AuthContext value:', { user: !!user, token: !!token, isLoading, isAuthenticated: !!user })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
