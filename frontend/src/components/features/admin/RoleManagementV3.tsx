/**
 * Компонент для управления ролями и разрешениями v3
 */

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Input, Badge, Checkbox,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Alert, AlertDescription, Textarea,
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui';
import { 
  Shield, Plus, Edit, Trash2, Copy, Users, 
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { useForm } from 'react-hook-form';

interface Permission {
  value: string;
  name: string;
  description: string;
}

interface RolePermission {
  id: number;
  permission: string;
  granted: boolean;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  permissions: RolePermission[];
}

interface RoleFormData {
  name: string;
  displayName: string;
  description: string;
  color: string;
  permissions: string[];
}

export const RoleManagementV3: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<RoleFormData>({
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      color: '#3b82f6',
      permissions: []
    }
  });

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      // TODO: Загрузить роли через API v3
      setRoles([
        {
          id: 1,
          name: 'super_admin',
          displayName: 'Супер администратор',
          description: 'Полный доступ ко всем функциям системы',
          color: '#dc2626',
          isSystem: true,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          permissions: [
            { id: 1, permission: 'admin.full_access', granted: true }
          ]
        },
        {
          id: 2,
          name: 'admin',
          displayName: 'Администратор',
          description: 'Управление пользователями и основными настройками',
          color: '#ea580c',
          isSystem: true,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          permissions: [
            { id: 2, permission: 'user.create', granted: true },
            { id: 3, permission: 'user.read', granted: true },
            { id: 4, permission: 'user.update', granted: true },
            { id: 5, permission: 'settings.read', granted: true }
          ]
        },
        {
          id: 3,
          name: 'manager',
          displayName: 'Менеджер',
          description: 'Управление пользователями в своем подразделении',
          color: '#2563eb',
          isSystem: true,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          permissions: [
            { id: 6, permission: 'user.read', granted: true },
            { id: 7, permission: 'user.update', granted: true }
          ]
        }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      // TODO: Загрузить разрешения через API v3
      setPermissions([
        { value: 'user.create', name: 'user.create', description: 'Создание пользователей' },
        { value: 'user.read', name: 'user.read', description: 'Просмотр пользователей' },
        { value: 'user.update', name: 'user.update', description: 'Редактирование пользователей' },
        { value: 'user.delete', name: 'user.delete', description: 'Удаление пользователей' },
        { value: 'user.manage_roles', name: 'user.manage_roles', description: 'Управление ролями пользователей' },
        { value: 'role.create', name: 'role.create', description: 'Создание ролей' },
        { value: 'role.read', name: 'role.read', description: 'Просмотр ролей' },
        { value: 'role.update', name: 'role.update', description: 'Редактирование ролей' },
        { value: 'role.delete', name: 'role.delete', description: 'Удаление ролей' },
        { value: 'settings.read', name: 'settings.read', description: 'Просмотр настроек' },
        { value: 'settings.update', name: 'settings.update', description: 'Изменение настроек' },
        { value: 'settings.manage_api_keys', name: 'settings.manage_api_keys', description: 'Управление API ключами' },
        { value: 'settings.manage_email', name: 'settings.manage_email', description: 'Управление настройками почты' },
        { value: 'notifications.send', name: 'notifications.send', description: 'Отправка уведомлений' },
        { value: 'notifications.manage', name: 'notifications.manage', description: 'Управление уведомлениями' },
        { value: 'analytics.read', name: 'analytics.read', description: 'Просмотр аналитики' },
        { value: 'logs.read', name: 'logs.read', description: 'Просмотр логов' },
        { value: 'admin.full_access', name: 'admin.full_access', description: 'Полный доступ администратора' },
        { value: 'system.maintenance', name: 'system.maintenance', description: 'Системное обслуживание' }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки разрешений:', error);
    }
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsEditing(false);
    form.reset({
      name: '',
      displayName: '',
      description: '',
      color: '#3b82f6',
      permissions: []
    });
    setShowRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditing(true);
    form.reset({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      color: role.color || '#3b82f6',
      permissions: role.permissions.filter(p => p.granted).map(p => p.permission)
    });
    setShowRoleDialog(true);
  };

  const handleCloneRole = (role: Role) => {
    setSelectedRole(null);
    setIsEditing(false);
    form.reset({
      name: `${role.name}_copy`,
      displayName: `${role.displayName} (Копия)`,
      description: `Копия роли '${role.displayName}'`,
      color: role.color || '#3b82f6',
      permissions: role.permissions.filter(p => p.granted).map(p => p.permission)
    });
    setShowRoleDialog(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (isEditing && selectedRole) {
        // TODO: Обновить роль через API
        console.log('Обновление роли:', data);
      } else {
        // TODO: Создать роль через API
        console.log('Создание роли:', data);
      }
      setShowRoleDialog(false);
      loadRoles();
    } catch (error) {
      console.error('Ошибка сохранения роли:', error);
    }
  };

  const confirmDelete = async () => {
    if (!selectedRole) return;
    
    try {
      // TODO: Удалить роль через API
      console.log('Удаление роли:', selectedRole.id);
      setShowDeleteDialog(false);
      loadRoles();
    } catch (error) {
      console.error('Ошибка удаления роли:', error);
    }
  };

  const getRoleBadge = (role: Role) => (
    <Badge 
      variant="secondary" 
      style={{ backgroundColor: role.color + '20', color: role.color }}
    >
      {role.displayName}
    </Badge>
  );

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.value.split('.')[0];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(permission);
    });
    
    return categories;
  };

  const categoryNames: Record<string, string> = {
    user: 'Пользователи',
    role: 'Роли',
    settings: 'Настройки',
    notifications: 'Уведомления',
    analytics: 'Аналитика',
    logs: 'Логи',
    admin: 'Администрирование',
    system: 'Система'
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Управление ролями
              </CardTitle>
              <CardDescription>
                Создание и настройка ролей с детальными разрешениями
              </CardDescription>
            </div>
            <Button onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-2" />
              Создать роль
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map(role => (
              <Card key={role.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRoleBadge(role)}
                      <div>
                        <h4 className="font-semibold">{role.displayName}</h4>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      {role.isSystem && (
                        <Badge variant="outline" className="text-xs">
                          Системная
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCloneRole(role)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Разрешения:</div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.filter(p => p.granted).map(permission => {
                        const perm = permissions.find(p => p.value === permission.permission);
                        return (
                          <Badge key={permission.id} variant="outline" className="text-xs">
                            {perm?.description || permission.permission}
                          </Badge>
                        );
                      })}
                    </div>
                    {role.permissions.filter(p => p.granted).length === 0 && (
                      <p className="text-sm text-muted-foreground">Нет разрешений</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Диалог создания/редактирования роли */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Редактирование роли' : 'Создание новой роли'}
            </DialogTitle>
            <DialogDescription>
              Настройте основную информацию о роли и выберите разрешения
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="basic">Основное</TabsTrigger>
                  <TabsTrigger value="permissions">Разрешения</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: 'Имя роли обязательно' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя роли</FormLabel>
                          <FormControl>
                            <Input placeholder="admin" {...field} />
                          </FormControl>
                          <FormDescription>
                            Уникальное имя роли (латинские буквы и подчеркивания)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="displayName"
                      rules={{ required: 'Отображаемое имя обязательно' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Отображаемое имя</FormLabel>
                          <FormControl>
                            <Input placeholder="Администратор" {...field} />
                          </FormControl>
                          <FormDescription>
                            Имя роли для отображения в интерфейсе
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Описание роли и её назначения"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Подробное описание роли для администраторов
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Цвет</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input type="color" className="w-20" {...field} />
                            <Input 
                              placeholder="#3b82f6" 
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Цвет для отображения роли в интерфейсе
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="permissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Разрешения</FormLabel>
                        <FormDescription>
                          Выберите разрешения для этой роли
                        </FormDescription>
                        <div className="space-y-6">
                          {Object.entries(getPermissionsByCategory()).map(([category, perms]) => (
                            <div key={category} className="space-y-3">
                              <h4 className="font-medium text-sm">
                                {categoryNames[category] || category}
                              </h4>
                              <div className="grid grid-cols-1 gap-2 ml-4">
                                {perms.map(permission => (
                                  <div key={permission.value} className="flex items-start space-x-2">
                                    <Checkbox
                                      id={permission.value}
                                      checked={field.value.includes(permission.value)}
                                      onCheckedChange={(checked) => {
                                        const updatedPermissions = checked
                                          ? [...field.value, permission.value]
                                          : field.value.filter(p => p !== permission.value);
                                        field.onChange(updatedPermissions);
                                      }}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                      <label
                                        htmlFor={permission.value}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {permission.description}
                                      </label>
                                      <p className="text-xs text-muted-foreground">
                                        {permission.value}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRoleDialog(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {isEditing ? 'Сохранить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Подтверждение удаления
            </DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить роль "{selectedRole?.displayName}"?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Убедитесь, что эта роль не назначена ни одному пользователю перед удалением.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
