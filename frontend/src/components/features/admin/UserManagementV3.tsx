/**
 * Компонент для детального управления пользователями v3
 */

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Input, Badge, Avatar, AvatarFallback, AvatarImage,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Alert, AlertDescription
} from '@/components/ui/index';
import { 
  Search, Plus, Edit, Trash2, Shield, Mail, Phone, 
  Calendar, Activity, Eye, UserCheck, UserX, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/hooks';

interface UserV3 {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  position?: string;
  avatarUrl?: string;
  isActive: boolean;
  isPasswordChanged: boolean;
  createdAt: string;
  updatedAt?: string;
  roles: UserRole[];
  customerProfile?: any;
  contractorProfile?: any;
  lastLogin?: string;
  loginCount: number;
}

interface UserRole {
  id: number;
  role: {
    id: number;
    name: string;
    displayName: string;
    color?: string;
  };
  assignedBy?: number;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
}

const UserManagementV3: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserV3 | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      // TODO: Загрузить пользователей через API v3
      setUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@agb.com',
          firstName: 'Администратор',
          lastName: 'Системы',
          isActive: true,
          isPasswordChanged: true,
          createdAt: '2024-01-01T00:00:00Z',
          roles: [
            {
              id: 1,
              role: {
                id: 1,
                name: 'super_admin',
                displayName: 'Супер администратор',
                color: '#dc2626'
              },
              assignedAt: '2024-01-01T00:00:00Z',
              isActive: true
            }
          ],
          loginCount: 150,
          lastLogin: '2024-01-15T10:30:00Z'
        }
        // Добавить больше пользователей...
      ]);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      // TODO: Загрузить роли через API v3
      setRoles([
        {
          id: 1,
          name: 'super_admin',
          displayName: 'Супер администратор',
          description: 'Полный доступ к системе',
          color: '#dc2626',
          isSystem: true,
          isActive: true
        },
        {
          id: 2,
          name: 'admin',
          displayName: 'Администратор',
          description: 'Управление пользователями',
          color: '#ea580c',
          isSystem: true,
          isActive: true
        }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      user.roles.some((ur: any) => ur.role.id.toString() === roleFilter);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserClick = async (userId: number) => {
    try {
      // TODO: Загрузить детальную информацию о пользователе
      const user = users.find(u => u.id === userId);
      setSelectedUser(user || null);
      setShowUserDialog(true);
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      // TODO: Активировать/деактивировать пользователя через API
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isActive } : u
      ));
    } catch (error) {
      console.error('Ошибка изменения статуса пользователя:', error);
    }
  };

  const handleAssignRole = async (userId: number, roleId: number) => {
    try {
      // TODO: Назначить роль через API
      console.log('Назначение роли', roleId, 'пользователю', userId);
    } catch (error) {
      console.error('Ошибка назначения роли:', error);
    }
  };

  const getRoleBadge = (role: UserRole['role']) => (
    <Badge 
      variant="secondary" 
      style={{ backgroundColor: role.color + '20', color: role.color }}
      className="text-xs"
    >
      {role.displayName}
    </Badge>
  );

  const getUserInitials = (user: UserV3) => {
    const firstName = user.firstName || user.username.charAt(0).toUpperCase();
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Управление пользователями
          </CardTitle>
          <CardDescription>
            Детальное управление пользователями с системой ролей и разрешений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Все роли</option>
              {roles.map(role => (
                <option key={role.id} value={role.id.toString()}>
                  {role.displayName}
                </option>
              ))}
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Роли</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Активность</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow 
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} alt={user.username} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.filter((ur: any) => ur.isActive).map((userRole: any) => (
                          <div key={userRole.id}>
                            {getRoleBadge(userRole.role)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          Входов: {user.loginCount}
                        </div>
                        {user.lastLogin && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(user.lastLogin).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </Badge>
                        {!user.isPasswordChanged && (
                          <Badge variant="destructive" className="text-xs">
                            Пароль не изменен
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(user.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleUserStatus(user.id, !user.isActive);
                          }}
                        >
                          {user.isActive ? (
                            <UserX className="h-4 w-4 text-red-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Пользователи не найдены</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог детальной информации о пользователе */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedUser && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.username} />
                    <AvatarFallback>
                      {getUserInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-lg">
                      {selectedUser.firstName && selectedUser.lastName 
                        ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                        : selectedUser.username
                      }
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">
                      @{selectedUser.username}
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Детальная информация о пользователе и управление ролями
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Информация</TabsTrigger>
                <TabsTrigger value="roles">Роли</TabsTrigger>
                <TabsTrigger value="activity">Активность</TabsTrigger>
                <TabsTrigger value="profiles">Профили</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Телефон</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.phone || 'Не указан'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Должность</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.position || 'Не указана'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Дата регистрации</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="roles" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Текущие роли</h4>
                  {selectedUser.roles.filter(ur => ur.isActive).map(userRole => (
                    <div key={userRole.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRoleBadge(userRole.role)}
                        <div>
                          <p className="font-medium">{userRole.role.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            Назначена: {new Date(userRole.assignedAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Назначить роль
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">{selectedUser.loginCount}</div>
                      <div className="text-sm text-muted-foreground">Всего входов</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {selectedUser.lastLogin ? 
                          new Date(selectedUser.lastLogin).toLocaleDateString('ru-RU') : 
                          'Никогда'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Последний вход</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">
                        <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                          {selectedUser.isActive ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Статус</div>
                    </div>
                  </div>
                  
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Детальная история активности будет доступна в следующих версиях.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="profiles" className="space-y-4">
                <div className="space-y-4">
                  {selectedUser.customerProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Профиль заказчика</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Информация о компании заказчика...</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {selectedUser.contractorProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Профиль исполнителя</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Информация об исполнителе...</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!selectedUser.customerProfile && !selectedUser.contractorProfile && (
                    <Alert>
                      <AlertDescription>
                        У пользователя нет дополнительных профилей.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Закрыть
            </Button>
            <Button>
              Редактировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementV3;
