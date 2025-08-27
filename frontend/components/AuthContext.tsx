'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  role: 'admin' | 'manager' | 'employee' | 'ved_passport'
  is_active: boolean
  created_at: string
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

  // Настройка axios для автоматического добавления токена
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    if (storedToken) {
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      // Проверяем валидность токена при загрузке
      checkTokenValidity()
    } else {
      setIsLoading(false)
    }
  }, [])

  const checkTokenValidity = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/auth/me')
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
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        username,
        password
      })

      const { access_token, user: userData } = response.data

      // Сохраняем токен
      localStorage.setItem('access_token', access_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setUser(userData)
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await axios.post('http://localhost:8000/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Удаляем токен и пользователя в любом случае
      localStorage.removeItem('access_token')
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/auth/me')
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
