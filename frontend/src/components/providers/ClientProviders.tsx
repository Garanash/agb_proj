'use client'

import React from 'react'
import { AuthProvider } from '@/contexts'
import { AuthGuard, AppLayout } from '@/components'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppLayout>
          {children}
        </AppLayout>
      </AuthGuard>
    </AuthProvider>
  )
}
