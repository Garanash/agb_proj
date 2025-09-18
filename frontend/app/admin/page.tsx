'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { PageLayout } from '@/components/layout';
import Link from 'next/link';

const AdminPage = () => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Проверяем права доступа
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      setDebugInfo({
        user: user,
        role: user.role,
        isAdmin: user.role === 'admin',
        timestamp: new Date().toISOString()
      });
    }
  }, [user]);

  // Показываем загрузку или редирект
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <PageLayout title="Админ панель">
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
    <PageLayout title="Админ панель">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Админ панель</h1>
        
        {/* Отладочная информация */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Отладочная информация:</h3>
          <pre className="text-sm text-gray-700 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Навигация */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                👥
              </div>
              <h3 className="text-lg font-semibold text-gray-800 ml-4">Управление пользователями</h3>
            </div>
            <p className="text-gray-600">Создание, редактирование и управление пользователями системы</p>
          </Link>

          <Link
            href="/admin/bots"
            className="p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-xl">
                🤖
              </div>
              <h3 className="text-lg font-semibold text-gray-800 ml-4">Управление ботами</h3>
            </div>
            <p className="text-gray-600">Настройка и управление чат-ботами</p>
          </Link>

          <Link
            href="/admin/ved-passports"
            className="p-6 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xl">
                📄
              </div>
              <h3 className="text-lg font-semibold text-gray-800 ml-4">Паспорта ВЭД</h3>
            </div>
            <p className="text-gray-600">Управление паспортами ВЭД, архив и номенклатура</p>
          </Link>

          <Link
            href="/ved-passports"
            className="p-6 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xl">
                📋
              </div>
              <h3 className="text-lg font-semibold text-gray-800 ml-4">Создание паспортов</h3>
            </div>
            <p className="text-gray-600">Создание новых паспортов ВЭД</p>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminPage;
