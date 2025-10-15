'use client'

import React from 'react'
import { AuthProvider } from '@/contexts'
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
