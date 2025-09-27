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
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Админ панель</h1>
        
        {/* Отладочная информация */}
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Отладочная информация:</h3>
          <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Новая админ панель v3 - временно отключена */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">🚀 Новая админ панель v3</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Расширенная система управления с ролями, настройками email, API ключами и уведомлениями
              </p>
              <div className="flex gap-2">
                <Link
                  href="/admin/v3"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Открыть панель v3
                </Link>
                <Link
                  href="/api/v3/health"
                  target="_blank"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  API v3
                </Link>
              </div>
            </div>
            <div className="text-6xl">⚡</div>
          </div>
        </div>

        {/* Навигация */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                👥
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 ml-4">Управление пользователями</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Создание, редактирование и управление пользователями системы</p>
          </Link>

          <Link
            href="/admin/bots"
            className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-xl">
                🤖
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 ml-4">Управление ботами</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Настройка и управление чат-ботами</p>
          </Link>

          <Link
            href="/admin/ved-passports"
            className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xl">
                📄
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 ml-4">Паспорта ВЭД</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Управление паспортами ВЭД, архив и номенклатура</p>
          </Link>

          <Link
            href="/ved-passports"
            className="p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xl">
                📋
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 ml-4">Создание паспортов</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Создание новых паспортов ВЭД</p>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminPage;
