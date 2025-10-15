'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/api';

const DashboardTestPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем токен администратора
        const apiUrl = getApiUrl();
        const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
          })
        });

        if (!loginResponse.ok) {
          throw new Error(`Ошибка входа: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.access_token;

        // Получаем статистику дашборда
        const statsResponse = await fetch(`${apiUrl}/api/v1/admin/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!statsResponse.ok) {
          throw new Error(`Ошибка получения статистики: ${statsResponse.status}`);
        }

        const statsData = await statsResponse.json();
        setData(statsData);
        
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка дашборда...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-lg mb-2">Ошибка загрузки</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🚀 Тестовый дашборд администратора (без аутентификации)
        </h1>

        {/* Основная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Активные пользователи</p>
                <p className="text-2xl font-bold text-gray-900">{data.active_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">События</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_events}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Новости</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_news}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика по ролям */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика по ролям</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.role_stats).map(([role, count]) => (
              <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{role}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Производительность системы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Производительность системы</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Использование памяти</span>
                  <span>{data.system_stats.memory_usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${data.system_stats.memory_usage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Загрузка CPU</span>
                  <span>{data.system_stats.cpu_usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${data.system_stats.cpu_usage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Использование диска</span>
                  <span>{data.system_stats.disk_usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${data.system_stats.disk_usage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Статистика</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего запросов</span>
                <span className="font-semibold text-gray-900">{data.system_stats.api_requests_today.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ошибки</span>
                <span className="font-semibold text-red-600">{data.system_stats.error_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Успешные запросы</span>
                <span className="font-semibold text-green-600">{100 - data.system_stats.error_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Время работы</span>
                <span className="font-semibold text-gray-900">{data.system_stats.uptime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Последние пользователи */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Последние пользователи</h3>
          <div className="space-y-3">
            {data.recent_users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.username}
                    </p>
                    <p className="text-xs text-gray-600">@{user.username} • {user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Никогда'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Информация о последнем обновлении */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Последнее обновление: {new Date(data.last_updated).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default DashboardTestPage;
