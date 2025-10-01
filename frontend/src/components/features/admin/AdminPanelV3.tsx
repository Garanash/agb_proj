/**
 * Главная админ панель v3 с новой системой управления
 */

import React, { useState, useEffect } from 'react';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Badge, Alert, AlertDescription
} from '@/components/ui';
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
      healthy: { variant: 'default' as const, text: 'Здорово' },
      warning: { variant: 'secondary' as const, text: 'Предупреждение' },
      error: { variant: 'destructive' as const, text: 'Ошибка' }
    };
    
    const config = variants[health as keyof typeof variants] || variants.healthy;
    return <Badge variant={config.variant}>{config.text}</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Админ панель v3</h1>
          <p className="text-muted-foreground">
            Расширенное управление системой и пользователями
          </p>
        </div>
        {getHealthBadge(stats.systemHealth)}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Роли
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API ключи
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Активных: {stats.activeUsers}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ролей в системе</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRoles}</div>
                <p className="text-xs text-muted-foreground">
                  Включая системные
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Уведомления</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingNotifications}</div>
                <p className="text-xs text-muted-foreground">
                  Требуют внимания
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Статус системы</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getHealthBadge(stats.systemHealth)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Все сервисы работают
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
                <CardDescription>
                  Часто используемые операции администрирования
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Управление пользователями
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('roles')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Настройка ролей
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('email')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Настройки почты
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Отправить уведомление
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Системная информация</CardTitle>
                <CardDescription>
                  Информация о текущем состоянии системы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Версия API:</span>
                  <span className="text-sm">v3.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">База данных:</span>
                  <Badge variant="default">Подключена</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Email сервис:</span>
                  <Badge variant="secondary">Не настроен</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Последнее обновление:</span>
                  <span className="text-sm">2 минуты назад</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Добро пожаловать в новую админ панель v3! Здесь вы можете управлять пользователями, 
              настраивать роли и разрешения, конфигурировать email уведомления и многое другое.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="users">
          <UserManagementV3 />
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagementV3 />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettingsV3 />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeySettingsV3 />
        </TabsContent>

        <TabsContent value="notifications">
          <SystemNotificationsV3 />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettingsV3 />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanelV3;
