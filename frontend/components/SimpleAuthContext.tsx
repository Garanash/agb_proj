'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Проверяем токен при загрузке
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        setToken(storedToken)
        setIsAuthenticated(true)
        // Здесь можно добавить проверку валидности токена
      }
      setIsLoading(false)
    }
  }, [])

  // Простая функция логина с реальным API вызовом
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 Login attempt started:', email)
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password
        })
      })
      
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Login successful:', data)
        
        setUser(data.user)
        setToken(data.access_token)
        setIsAuthenticated(true)
        
        // Сохраняем токен в localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access_token)
          console.log('💾 Token saved to localStorage')
        }
        
        console.log('🎉 Login completed successfully!')
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Login failed:', response.status, response.statusText, errorText)
        return false
      }
    } catch (error) {
      console.error('💥 Login error:', error)
      return false
    } finally {
      setIsLoading(false)
      console.log('🏁 Login attempt finished')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    
    // Очищаем токен из localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
  }

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}