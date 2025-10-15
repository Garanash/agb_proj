'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Определяем системную тему
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Вычисляем итоговую тему
  const computeResolvedTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme()
    }
    return currentTheme
  }

  // Применяем тему к документу
  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      
      // Удаляем предыдущие классы темы
      root.classList.remove('light', 'dark')
      
      // Добавляем новый класс темы
      root.classList.add(newTheme)
      
      // Сохраняем в localStorage
      localStorage.setItem('theme', newTheme)
    }
  }

  // Инициализация темы
  useEffect(() => {
    // Загружаем сохраненную тему из localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }

    // Вычисляем итоговую тему
    const newResolvedTheme = computeResolvedTheme(savedTheme || defaultTheme)
    setResolvedTheme(newResolvedTheme)
    applyTheme(newResolvedTheme)
  }, [])

  // Обработка изменения темы
  useEffect(() => {
    const newResolvedTheme = computeResolvedTheme(theme)
    setResolvedTheme(newResolvedTheme)
    applyTheme(newResolvedTheme)
    
    // Сохраняем выбор пользователя
    localStorage.setItem('theme', theme)
  }, [theme])

  // Обработка изменения системной темы
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        const newResolvedTheme = getSystemTheme()
        setResolvedTheme(newResolvedTheme)
        applyTheme(newResolvedTheme)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      switch (prev) {
        case 'light':
          return 'dark'
        case 'dark':
          return 'system'
        case 'system':
          return 'light'
        default:
          return 'light'
      }
    })
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
