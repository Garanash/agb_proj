'use client'

import React from 'react'
import { AuthProvider } from './AuthContext'
import { AuthGuard } from '@/components'
import { ThemeProvider } from '../contexts/ThemeContext'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          {children}
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  )
}
