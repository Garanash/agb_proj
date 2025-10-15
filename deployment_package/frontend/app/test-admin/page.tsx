'use client'

import AdminDashboard from '@/src/components/features/admin/AdminDashboard'

export default function TestAdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Тест дашборда администратора
        </h1>
        <AdminDashboard />
      </div>
    </div>
  )
}
