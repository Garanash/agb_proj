/**
 * Хук для работы с аутентификацией
 */

import { useContext } from 'react'
import { AuthContext } from '../../components/AuthContext'

interface AuthContextType {
  user: any | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
