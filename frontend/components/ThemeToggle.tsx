'use client'

import { useState } from 'react'
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'switch'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function ThemeToggle({ 
  variant = 'button', 
  size = 'md',
  showLabel = true 
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    { value: 'light', label: 'Светлая', icon: SunIcon },
    { value: 'dark', label: 'Темная', icon: MoonIcon },
    { value: 'system', label: 'Системная', icon: ComputerDesktopIcon }
  ] as const

  const currentTheme = themes.find(t => t.value === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'lg':
        return 'px-4 py-3 text-base'
      default:
        return 'px-3 py-2 text-sm'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4'
      case 'lg':
        return 'h-6 w-6'
      default:
        return 'h-5 w-5'
    }
  }

  if (variant === 'switch') {
    return (
      <div className="flex items-center space-x-3">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Темная тема
          </span>
        )}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${resolvedTheme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center space-x-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
            ${getSizeClasses()}
          `}
        >
          <CurrentIcon className={getIconSize()} />
          {showLabel && <span>{currentTheme.label}</span>}
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-20">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon
                const isSelected = theme === themeOption.value
                
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value as any)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 text-left text-sm
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                      first:rounded-t-lg last:rounded-b-lg
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{themeOption.label}</span>
                    {isSelected && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // Default button variant
  return (
    <button
      onClick={() => {
        const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
        setTheme(nextTheme)
      }}
      className={`
        flex items-center space-x-2 rounded-lg border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
        ${getSizeClasses()}
      `}
      title={`Текущая тема: ${currentTheme.label}`}
    >
      <CurrentIcon className={getIconSize()} />
      {showLabel && <span>{currentTheme.label}</span>}
    </button>
  )
}

// Компонент для отображения текущей темы
export function ThemeIndicator() {
  const { resolvedTheme } = useTheme()
  
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <div className={`w-3 h-3 rounded-full ${
        resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-yellow-400'
      }`} />
      <span>
        {resolvedTheme === 'dark' ? 'Темная тема' : 'Светлая тема'}
      </span>
    </div>
  )
}
