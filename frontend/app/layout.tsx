import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/components/providers'
import AppLayout from '@/components/AppLayout'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Felix - Алмазгеобур Platform',
  description: 'Корпоративная платформа для компании Алмазгеобур',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          <AppLayout>
            {children}
          </AppLayout>
        </ClientProviders>
      </body>
    </html>
  )
}
