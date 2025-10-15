'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { PageLayout } from '@/components/layout';
import AdminPanelV3 from '@/src/components/features/admin/AdminPanelV3';

const AdminV3Page = () => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  // Проверяем права доступа
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Показываем загрузку или редирект
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <PageLayout title="Админ панель v3">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Админ панель v3">
      <AdminPanelV3 />
    </PageLayout>
  );
};

export default AdminV3Page;
