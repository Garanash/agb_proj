'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getApiUrl } from '@/utils';
import type { User, AuthContextType } from '@/types';
import axios from 'axios'

// Типы импортированы из @/types

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// useAuth перенесен в @/hooks/useAuth

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Настройка axios для автоматического добавления токена
  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const storedToken = localStorage.getItem('access_token')
    if (storedToken) {
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      // Проверяем валидность токена при загрузке
      checkTokenValidity()
    } else {
      // Если токена нет, сразу завершаем загрузку
      setIsLoading(false)
    }
  }, [])

  const checkTokenValidity = async () => {
    try {
      const apiUrl = getApiUrl()
      console.log('API URL for token validation:', apiUrl)
      const response = await axios.get(`${apiUrl}/api/v1/auth/me`)
      setUser(response.data)
      console.log('User loaded:', response.data)
    } catch (error) {
      console.error('Token validation error:', error)
      // Токен невалиден, удаляем его
      localStorage.removeItem('access_token')
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setIsLoading(false)
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
    isLoading,
    isAuthenticated: !!user
  }

  console.log('AuthContext value:', { user: !!user, token: !!token, isLoading, isAuthenticated: !!user })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
