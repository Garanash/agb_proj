'use client'

import { useState, useEffect } from 'react'
import { UserPlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import PageLayout from '@/components/PageLayout'
import CreateUserModal from '@/components/CreateUserModal'
import EditUserModal from '@/components/EditUserModal'
import { useAuth } from '@/components/AuthContext'
import axios from 'axios'
import { formatApiError } from '@/utils/errorHandler'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  role: string
  is_active: boolean
  phone?: string
  department_id?: number
  position?: string
  avatar_url?: string
  created_at: string
}

export default function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Проверка доступа - только администраторы
  if (user?.role !== 'admin') {
    return (
      <PageLayout title="Доступ запрещен">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Недостаточно прав</h2>
          <p className="text-red-700">Данная страница доступна только администраторам.</p>
        </div>
      </PageLayout>
    )
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('http://localhost:8000/api/users/')
      setUsers(response.data)
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите деактивировать этого пользователя?')) return

    try {
      await axios.delete(`http://localhost:8000/api/users/${userId}`)
      fetchUsers() // Перезагружаем список
    } catch (error: any) {
      alert(formatApiError(error, 'Ошибка при деактивации пользователя'))
    }
  }

  const handleActivateUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите активировать этого пользователя?')) return

    try {
      await axios.post(`http://localhost:8000/api/users/${userId}/activate`)
      fetchUsers() // Перезагружаем список
    } catch (error: any) {
      alert(formatApiError(error, 'Ошибка при активации пользователя'))
    }
  }

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'manager':
        return 'Менеджер'
      case 'employee':
        return 'Сотрудник'
      default:
        return role
    }
  }

  const getInitials = (user: any) => {
    const parts = []
    if (user.last_name) parts.push(user.last_name)
    if (user.first_name) parts.push(user.first_name)
    if (user.middle_name) parts.push(user.middle_name)
    
    return parts
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500'
    ]
    const index = username.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <>
      <PageLayout 
        title="Управление пользователями"
        subtitle="Создание, редактирование и управление статусом учетных записей пользователей"
        headerActions={
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Добавить пользователя</span>
          </button>
        }
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка пользователей...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Пользователь</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Роль</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Статус</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${getAvatarColor(userItem.username)} rounded-full flex items-center justify-center text-white font-semibold`}>
                              {getInitials(userItem)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {userItem.last_name} {userItem.first_name} {userItem.middle_name || ''}
                              </div>
                              <div className="text-sm text-gray-600">{userItem.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{userItem.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                            userItem.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getRoleName(userItem.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditUser(userItem)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded" 
                              title="Редактировать"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {userItem.is_active ? (
                              <button 
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Деактивировать"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleActivateUser(userItem.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                title="Активировать"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Пользователи не найдены</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PageLayout>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={fetchUsers}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onUserUpdated={fetchUsers}
        user={selectedUser}
      />
    </>
  )
}
