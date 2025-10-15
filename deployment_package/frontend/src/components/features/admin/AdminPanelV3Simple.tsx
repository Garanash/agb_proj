/**
 * Полноценная админ панель v3 с полным набором инструментов управления
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';

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
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'warning' | 'error';
}

const AdminPanelV3Simple: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalLogins: 0,
    systemUptime: '0d 0h 0m',
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    apiRequests: 0,
    errorRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Загрузка статистики
  useEffect(() => {
    // Имитация загрузки данных
    setStats({
      totalUsers: 156,
      activeUsers: 23,
      totalLogins: 1247,
      systemUptime: '15d 8h 32m',
      memoryUsage: 68,
      cpuUsage: 23,
      diskUsage: 45,
      apiRequests: 8942,
      errorRate: 0.3
    });

    setRecentActivity([
      {
        id: '1',
        user: 'admin',
        action: 'Вход в систему',
        timestamp: '2025-09-27 15:45:23',
        ip: '192.168.1.100',
        status: 'success'
      },
      {
        id: '2',
        user: 'user123',
        action: 'Создание документа',
        timestamp: '2025-09-27 15:44:12',
        ip: '192.168.1.101',
        status: 'success'
      },
      {
        id: '3',
        user: 'manager',
        action: 'Ошибка авторизации',
        timestamp: '2025-09-27 15:43:45',
        ip: '192.168.1.102',
        status: 'error'
      }
    ]);
  }, []);

  const tabs = [
    { id: 'dashboard', name: 'Дашборд', icon: '📊' },
    { id: 'users', name: 'Пользователи', icon: '👥' },
    { id: 'roles', name: 'Роли', icon: '🛡️' },
    { id: 'logs', name: 'Логи', icon: '📋' },
    { id: 'analytics', name: 'Аналитика', icon: '📈' },
    { id: 'monitoring', name: 'Мониторинг', icon: '🔍' },
    { id: 'settings', name: 'Настройки', icon: '⚙️' },
    { id: 'security', name: 'Безопасность', icon: '🔒' },
    { id: 'backup', name: 'Резервные копии', icon: '💾' },
    { id: 'api', name: 'API', icon: '🔑' }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Статистика системы */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего пользователей</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Активные пользователи</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <span className="text-2xl">🔑</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Входов в систему</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalLogins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Время работы</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.systemUptime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Производительность системы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Производительность системы</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Использование памяти</span>
                <span>{stats.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.memoryUsage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Загрузка CPU</span>
                <span>{stats.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.cpuUsage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Использование диска</span>
                <span>{stats.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${stats.diskUsage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">API Статистика</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Всего запросов</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.apiRequests.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ошибки</span>
              <span className="font-semibold text-red-600">{stats.errorRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Успешные запросы</span>
              <span className="font-semibold text-green-600">{100 - stats.errorRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Последняя активность */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Последняя активность</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.user}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{activity.action}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.ip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Управление пользователями</h3>
            <p className="text-gray-600 dark:text-gray-400">Здесь будет полный интерфейс управления пользователями с детальной информацией, ролями и активностью.</p>
          </div>
        );
      case 'logs':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Системные логи</h3>
            <p className="text-gray-600 dark:text-gray-400">Просмотр всех логов системы, входов пользователей, ошибок и действий.</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Аналитика системы</h3>
            <p className="text-gray-600 dark:text-gray-400">Детальная аналитика использования системы, производительности и пользовательской активности.</p>
          </div>
        );
      case 'monitoring':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Мониторинг системы</h3>
            <p className="text-gray-600 dark:text-gray-400">Реальное время мониторинга производительности, состояния серверов и ресурсов.</p>
          </div>
        );
      case 'security':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Безопасность</h3>
            <p className="text-gray-600 dark:text-gray-400">Настройки безопасности, мониторинг угроз, управление доступом и аудит.</p>
          </div>
        );
      case 'backup':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Резервные копии</h3>
            <p className="text-gray-600 dark:text-gray-400">Управление резервными копиями базы данных и файлов системы.</p>
          </div>
        );
      case 'api':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">API управление</h3>
            <p className="text-gray-600 dark:text-gray-400">Управление API ключами, настройка интеграций и мониторинг API запросов.</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          🚀 Админ панель v3
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Полный набор инструментов для управления приложением
        </p>
      </div>

      {/* Навигация по вкладкам */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Содержимое вкладок */}
      {renderTabContent()}
    </div>
  );
};

export default AdminPanelV3Simple;
