'use client'

import React, { useState, useEffect } from 'react';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalLogins: number;
  systemUptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  apiRequests: number;
  errorRate: number;
  totalDocuments: number;
  totalEvents: number;
  totalNews: number;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'warning' | 'error';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

export default function DemoAdminPage() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalLogins: 0,
    systemUptime: '0d 0h 0m',
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    apiRequests: 0,
    errorRate: 0,
    totalDocuments: 0,
    totalEvents: 0,
    totalNews: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Имитация загрузки данных с API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Загружаем статистику
      setStats({
        totalUsers: 156,
        activeUsers: 23,
        totalLogins: 1247,
        systemUptime: '15d 8h 32m',
        memoryUsage: 68,
        cpuUsage: 23,
        diskUsage: 45,
        apiRequests: 8942,
        errorRate: 0.3,
        totalDocuments: 342,
        totalEvents: 28,
        totalNews: 15
      });

      // Загружаем последнюю активность
      setRecentActivity([
        {
          id: '1',
          user: 'admin',
          action: 'Вход в систему',
          timestamp: '2025-09-27 19:45:23',
          ip: '192.168.1.100',
          status: 'success'
        },
        {
          id: '2',
          user: 'user123',
          action: 'Создание документа',
          timestamp: '2025-09-27 19:44:12',
          ip: '192.168.1.101',
          status: 'success'
        },
        {
          id: '3',
          user: 'manager',
          action: 'Ошибка авторизации',
          timestamp: '2025-09-27 19:43:45',
          ip: '192.168.1.102',
          status: 'error'
        },
        {
          id: '4',
          user: 'editor',
          action: 'Публикация новости',
          timestamp: '2025-09-27 19:42:30',
          ip: '192.168.1.103',
          status: 'success'
        },
        {
          id: '5',
          user: 'admin',
          action: 'Изменение настроек',
          timestamp: '2025-09-27 19:41:15',
          ip: '192.168.1.100',
          status: 'success'
        }
      ]);
      
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'users',
      title: 'Управление пользователями',
      description: 'Просмотр и редактирование пользователей',
      icon: '👥',
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      id: 'settings',
      title: 'Настройки системы',
      description: 'Конфигурация приложения',
      icon: '⚙️',
      href: '/admin/settings',
      color: 'bg-gray-500'
    },
    {
      id: 'logs',
      title: 'Системные логи',
      description: 'Просмотр логов и событий',
      icon: '📋',
      href: '/admin/logs',
      color: 'bg-green-500'
    },
    {
      id: 'backup',
      title: 'Резервные копии',
      description: 'Управление бэкапами',
      icon: '💾',
      href: '/admin/backup',
      color: 'bg-purple-500'
    },
    {
      id: 'v3',
      title: 'Админ панель v3',
      description: 'Новая расширенная панель',
      icon: '🚀',
      href: '/admin/v3',
      color: 'bg-indigo-500'
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      description: 'Отчеты и статистика',
      icon: '📊',
      href: '/admin/analytics',
      color: 'bg-orange-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка дашборда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Приветствие */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Добро пожаловать, Администратор! 👋
          </h1>
          <p className="text-blue-100">
            Панель управления системой Алмазгеобур Platform
          </p>
        </div>

        {/* Основная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Активные пользователи</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Документы</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Новости</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Производительность системы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Производительность системы</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Использование памяти</span>
                  <span>{stats.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.memoryUsage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Загрузка CPU</span>
                  <span>{stats.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.cpuUsage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Использование диска</span>
                  <span>{stats.diskUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.diskUsage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Статистика</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего запросов</span>
                <span className="font-semibold text-gray-900">{stats.apiRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ошибки</span>
                <span className="font-semibold text-red-600">{stats.errorRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Успешные запросы</span>
                <span className="font-semibold text-green-600">{100 - stats.errorRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Время работы</span>
                <span className="font-semibold text-gray-900">{stats.systemUptime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.id}
                href={action.href}
                className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <span className="text-xl">{action.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Последняя активность */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Последняя активность</h3>
            <button 
              onClick={loadDashboardData}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Обновить
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-xs text-gray-600">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  <p className="text-xs text-gray-500">{activity.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Статус системы */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <h4 className="text-green-800 font-medium">Система работает нормально</h4>
              <p className="text-green-600 text-sm">
                Все сервисы функционируют в штатном режиме. Время работы: {stats.systemUptime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
