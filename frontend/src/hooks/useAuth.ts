/**
 * Хук для работы с аутентификацией
 */

import { useContext } from 'react'
import { AuthContext } from '../../components/AuthContext'
import type { AuthContextType } from '../types/index'

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
