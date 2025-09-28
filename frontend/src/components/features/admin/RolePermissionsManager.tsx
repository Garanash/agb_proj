'use client'

import React, { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils'
import { useAuth } from '@/hooks'

interface Role {
  id: number
  name: string
  display_name: string
  description?: string
  color?: string
  is_active: boolean
  is_system: boolean
  created_at: string
  permissions: Permission[]
}

interface Permission {
  id: number
  permission: string
  granted: boolean
  role_id: number
  created_at: string
}

interface UserRole {
  id: number
  user_id: number
  role_id: number
  assigned_at: string
  expires_at?: string
  is_active: boolean
  role: Role
}

const RolePermissionsManager: React.FC = () => {
  const { user } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignments'>('roles')
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const permissionCategories = {
    'user': 'Управление пользователями',
    'role': 'Управление ролями',
    'settings': 'Настройки системы',
    'notifications': 'Уведомления',
    'analytics': 'Аналитика',
    'logs': 'Логи',
    'admin': 'Администрирование',
    'system': 'Система'
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadRoles(),
        loadPermissions(),
        loadUsers(),
        loadUserRoles()
      ])
    } catch (err) {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки ролей:', err)
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.map((p: any) => p.value))
      }
    } catch (err) {
      console.error('Ошибка загрузки разрешений:', err)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err)
    }
  }

  const loadUserRoles = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/user-roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUserRoles(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки ролей пользователей:', err)
    }
  }

  const createRole = async (roleData: Partial<Role>) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      })
      
      if (response.ok) {
        await loadRoles()
        setShowCreateRole(false)
      }
    } catch (err) {
      console.error('Ошибка создания роли:', err)
    }
  }

  const updateRole = async (roleId: number, roleData: Partial<Role>) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      })
      
      if (response.ok) {
        await loadRoles()
        setEditingRole(null)
      }
    } catch (err) {
      console.error('Ошибка обновления роли:', err)
    }
  }

  const deleteRole = async (roleId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) return
    
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await loadRoles()
      }
    } catch (err) {
      console.error('Ошибка удаления роли:', err)
    }
  }

  const assignRoleToUser = async (userId: number, roleId: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role_id: roleId })
      })
      
      if (response.ok) {
        await loadUserRoles()
      }
    } catch (err) {
      console.error('Ошибка назначения роли:', err)
    }
  }

  const removeRoleFromUser = async (userRoleId: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/v3/permissions/user-roles/${userRoleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await loadUserRoles()
      }
    } catch (err) {
      console.error('Ошибка удаления роли:', err)
    }
  }

  const getPermissionCategory = (permission: string) => {
    const category = permission.split('.')[0]
    return permissionCategories[category as keyof typeof permissionCategories] || category
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = getPermissionCategory(permission)
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, string[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Вкладки */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'roles', name: 'Роли', icon: UserGroupIcon },
            { id: 'permissions', name: 'Разрешения', icon: ShieldCheckIcon },
            { id: 'assignments', name: 'Назначения', icon: UserGroupIcon }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Роли */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Управление ролями
            </h3>
            <button
              onClick={() => setShowCreateRole(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Создать роль</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color || '#6B7280' }}
                    ></div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {role.display_name}
                    </h4>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingRole(role)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={() => deleteRole(role.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {role.description || 'Без описания'}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    role.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {role.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                  {role.is_system && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      Системная
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Разрешений: {role.permissions.length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Разрешения */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Системные разрешения
          </h3>

          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {perms.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {permission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Назначения ролей */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Назначения ролей пользователям
          </h3>

          <div className="space-y-4">
            {users.map((user) => {
              const userRolesList = userRoles.filter(ur => ur.user_id === user.id && ur.is_active)
              return (
                <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          assignRoleToUser(user.id, parseInt(e.target.value))
                          e.target.value = ''
                        }
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Добавить роль</option>
                      {roles
                        .filter(role => !userRolesList.some(ur => ur.role_id === role.id))
                        .map(role => (
                          <option key={role.id} value={role.id}>
                            {role.display_name}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {userRolesList.map((userRole) => (
                      <div
                        key={userRole.id}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                      >
                        <span>{userRole.role.display_name}</span>
                        <button
                          onClick={() => removeRoleFromUser(userRole.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Модальное окно создания/редактирования роли */}
      {(showCreateRole || editingRole) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingRole ? 'Редактировать роль' : 'Создать роль'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const roleData = {
                name: formData.get('name'),
                display_name: formData.get('display_name'),
                description: formData.get('description'),
                color: formData.get('color'),
                is_active: formData.get('is_active') === 'on'
              }
              
              if (editingRole) {
                updateRole(editingRole.id, roleData)
              } else {
                createRole(roleData)
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Название роли
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingRole?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Отображаемое название
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    defaultValue={editingRole?.display_name || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingRole?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Цвет
                  </label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingRole?.color || '#6B7280'}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingRole?.is_active ?? true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Активна
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateRole(false)
                    setEditingRole(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Отменить
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingRole ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolePermissionsManager
