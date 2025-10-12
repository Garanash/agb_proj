/**
 * Главная админ панель v3 с новой системой управления
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Shield, Mail, Key, Bell, 
  BarChart3, Activity, Database, Zap
} from 'lucide-react';
import UserManagementV3 from './UserManagementV3';
import RoleManagementV3 from './RoleManagementV3';
import EmailSettingsV3 from './EmailSettingsV3';
import ApiKeySettingsV3 from './ApiKeySettingsV3';
import SystemNotificationsV3 from './SystemNotificationsV3';
import SystemSettingsV3 from './SystemSettingsV3';
import { useAuth } from '@/hooks';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  pendingNotifications: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

const AdminPanelV3: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    pendingNotifications: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      // TODO: Загрузить статистику через API v3
      setStats({
        totalUsers: 45,
        activeUsers: 42,
        totalRoles: 8,
        pendingNotifications: 3,
        systemHealth: 'healthy'
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (health: string) => {
    const variants = {
      healthy: { className: 'bg-green-100 text-green-800', text: 'Здорово' },
      warning: { className: 'bg-yellow-100 text-yellow-800', text: 'Предупреждение' },
      error: { className: 'bg-red-100 text-red-800', text: 'Ошибка' }
    };
    
    const config = variants[health as keyof typeof variants] || variants.healthy;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Админ панель v3</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Расширенное управление системой и пользователями
          </p>
        </div>
        {getHealthBadge(stats.systemHealth)}
      </div>

      <div className="space-y-4">
        {/* Навигация по вкладкам */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Users className="h-4 w-4" />
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Shield className="h-4 w-4" />
              Роли
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'email'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api-keys'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Key className="h-4 w-4" />
              API ключи
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Bell className="h-4 w-4" />
              Уведомления
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="h-4 w-4" />
              Настройки
            </button>
          </nav>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Всего пользователей</h3>
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Активных: {stats.activeUsers}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Ролей в системе</h3>
                  <Shield className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRoles}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Включая системные
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Уведомления</h3>
                  <Bell className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingNotifications}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ожидают обработки
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Состояние системы</h3>
                  <Activity className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {getHealthBadge(stats.systemHealth)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Мониторинг в реальном времени
                </p>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Быстрые действия</h3>
                <div className="space-y-2">
                  <button 
                    className="w-full flex items-center justify-start px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Управление пользователями
                  </button>
                  <button 
                    className="w-full flex items-center justify-start px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setActiveTab('roles')}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Настройка ролей
                  </button>
                  <button 
                    className="w-full flex items-center justify-start px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setActiveTab('email')}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Настройки почты
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Системная информация</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Версия API:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">v3.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">База данных:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Подключена</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email сервис:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Не настроен</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Последнее обновление:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">2 минуты назад</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Приветственное сообщение */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Добро пожаловать в админ панель v3!
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Здесь вы можете управлять пользователями, настраивать роли и разрешения, 
                    конфигурировать email уведомления и многое другое.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagementV3 />}
        {activeTab === 'roles' && <RoleManagementV3 />}
        {activeTab === 'email' && <EmailSettingsV3 />}
        {activeTab === 'api-keys' && <ApiKeySettingsV3 />}
        {activeTab === 'notifications' && <SystemNotificationsV3 />}
        {activeTab === 'settings' && <SystemSettingsV3 />}
      </div>
    </div>
  );
};

export default AdminPanelV3;