'use client'

import React from 'react'
import { AuthProvider } from './AuthContext'
import { AuthGuard } from '@/components'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  )
}
