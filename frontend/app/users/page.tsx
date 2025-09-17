'use client'

import { useState, useEffect } from 'react'
import { UserPlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils';
import { PageLayout } from '@/components/layout'
import { CreateUserModal } from '@/components/features/users'
import { EditUserModal } from '@/components/features/users'
import { useAuth } from '@/hooks'
import axios from 'axios'
import { formatApiError } from '@/utils'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  full_name: string
  role: string
  is_active: boolean
  phone?: string
  department_id?: number
  position?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
}

export default function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [deactivatedUsers, setDeactivatedUsers] = useState<User[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'deactivated'>('active')
  const [userPasswords, setUserPasswords] = useState<{[key: number]: string}>({})
  const [showPasswords, setShowPasswords] = useState<{[key: number]: boolean}>({})
  const [regeneratingPasswords, setRegeneratingPasswords] = useState<{[key: number]: boolean}>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
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
      const [activeResponse, deactivatedResponse] = await Promise.all([
        axios.get(`${getApiUrl()}/api/v1/users/list`),
        axios.get(`${getApiUrl()}/api/v1/users/deactivated/`)
      ])
      setUsers(activeResponse.data)
      setDeactivatedUsers(deactivatedResponse.data)
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserCreated = (newUser: any) => {
    if (newUser.generated_password) {
      setUserPasswords(prev => ({ ...prev, [newUser.id]: newUser.generated_password }))
      setShowPasswords(prev => ({ ...prev, [newUser.id]: true }))
    }
    fetchUsers()
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите деактивировать этого пользователя?')) return

    try {
      await axios.delete(`${getApiUrl()}/api/v1/users/${userId}`)
      fetchUsers() // Перезагружаем список
    } catch (error: any) {
      alert(formatApiError(error, 'Ошибка при деактивации пользователя'))
    }
  }

  const handleActivateUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите активировать этого пользователя?')) return

    try {
      await axios.post(`${getApiUrl()}/api/v1/users/${userId}/activate`)
      fetchUsers() // Перезагружаем список
    } catch (error: any) {
      alert(formatApiError(error, 'Ошибка при активации пользователя'))
    }
  }

  const handleRegeneratePassword = async (userId: number) => {
    try {
      setRegeneratingPasswords(prev => ({ ...prev, [userId]: true }))
      const response = await axios.post(`${getApiUrl()}/api/v1/users/${userId}/reset-password`)
      
      if (response.data.generated_password) {
        setUserPasswords(prev => ({ ...prev, [userId]: response.data.generated_password }))
        setShowPasswords(prev => ({ ...prev, [userId]: true }))
      }
    } catch (error) {
      console.error('Ошибка перегенерации пароля:', error)
      alert('Не удалось перегенерировать пароль')
    } finally {
      setRegeneratingPasswords(prev => ({ ...prev, [userId]: false }))
    }
  }

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  const handleShowPassword = (userId: number) => {
    // Если пароль уже есть в текущей сессии, переключаем видимость
    if (userPasswords[userId]) {
      togglePasswordVisibility(userId)
    } else {
      // Если пароля нет, показываем сообщение
      alert('Пароль не был сгенерирован в текущей сессии. Сначала сгенерируйте пароль с помощью кнопки 🔑')
    }
  }

  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password)
      alert('Пароль скопирован в буфер обмена!')
    } catch (err) {
      console.error('Ошибка копирования:', err)
      alert('Не удалось скопировать пароль')
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
      case 'ved_passport':
        return 'ВЭД Паспорт'
      case 'contractor':
        return 'Исполнитель'
      case 'customer':
        return 'Заказчик'
      case 'service_engineer':
        return 'Сервисный инженер'
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

  // Функция фильтрации пользователей по поисковому запросу
  const filterUsers = (usersList: User[]) => {
    if (!searchQuery.trim()) {
      return usersList
    }
    
    const query = searchQuery.toLowerCase()
    return usersList.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.first_name && user.first_name.toLowerCase().includes(query)) ||
      (user.last_name && user.last_name.toLowerCase().includes(query)) ||
      (user.middle_name && user.middle_name.toLowerCase().includes(query)) ||
      (user.phone && user.phone.includes(query)) ||
      (user.position && user.position.toLowerCase().includes(query)) ||
      user.role.toLowerCase().includes(query)
    )
  }

  // Получаем отфильтрованных пользователей для текущей вкладки
  const getFilteredUsers = () => {
    const currentUsers = activeTab === 'active' 
      ? users.filter(u => u.is_active) 
      : deactivatedUsers.filter(u => !u.is_active)
    return filterUsers(currentUsers)
  }

  // Получаем пользователей для текущей страницы
  const getPaginatedUsers = () => {
    const filteredUsers = getFilteredUsers()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }

  // Общее количество страниц
  const totalPages = Math.ceil(getFilteredUsers().length / itemsPerPage)

  // Сброс страницы при изменении поиска или вкладки
  const resetPagination = () => {
    setCurrentPage(1)
  }

  // Обработчики для пагинации
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <>
      <PageLayout 
        title="Управление пользователями"
        subtitle="Создание, редактирование и управление статусом учетных записей пользователей"
        headerActions={
          activeTab === 'active' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <UserPlusIcon className="h-5 w-5" />
              <span>Добавить пользователя</span>
            </button>
          )
        }
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Вкладки */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('active')
                  resetPagination()
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Активные пользователи
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {searchQuery ? getFilteredUsers().length : users.filter(u => u.is_active).length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('deactivated')
                  resetPagination()
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'deactivated'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Деактивированные пользователи
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {searchQuery ? getFilteredUsers().length : deactivatedUsers.filter(u => !u.is_active).length}
                </span>
              </button>
            </nav>
          </div>
          
          {/* Поле поиска */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск по пользователям..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      resetPagination()
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Очистить
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                Найдено: {getFilteredUsers().length} пользователей
                {totalPages > 1 && ` (страница ${currentPage} из ${totalPages})`}
              </div>
            )}
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка пользователей...</p>
              </div>
            ) : getFilteredUsers().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `По запросу "${searchQuery}" ничего не найдено. Попробуйте изменить поисковый запрос.`
                    : 'В данной категории пока нет пользователей.'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Очистить поиск
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Пользователь</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 w-48">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 w-32">Телефон</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Должность</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Роль</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Пароль</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        {activeTab === 'active' ? 'Действия' : 'Действия'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedUsers().map((userItem) => (
                      <tr key={userItem.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${getAvatarColor(userItem.username)} rounded-full flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0`}>
                              {userItem.avatar_url ? (
                                <img 
                                  src={`${getApiUrl()}/uploads/${userItem.avatar_url}`} 
                                  alt={`${userItem.last_name} ${userItem.first_name}`} 
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    console.log('Avatar load error:', userItem.avatar_url);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                getInitials(userItem)
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {userItem.full_name || `${userItem.last_name} ${userItem.first_name} ${userItem.middle_name || ''}`.trim()}
                              </div>
                              <div className="text-sm text-gray-600">@{userItem.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900 w-48 truncate" title={userItem.email}>{userItem.email}</td>
                        <td className="py-3 px-4 text-gray-900 w-32">{userItem.phone || '-'}</td>
                        <td className="py-3 px-4 text-gray-900">{userItem.position || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                            userItem.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            userItem.role === 'ved_passport' ? 'bg-purple-100 text-purple-800' :
                            userItem.role === 'contractor' ? 'bg-green-100 text-green-800' :
                            userItem.role === 'customer' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getRoleName(userItem.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {userPasswords[userItem.id] && showPasswords[userItem.id] ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={userPasswords[userItem.id]}
                                  readOnly
                                  className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded font-mono w-24"
                                />
                                <button
                                  onClick={() => copyPassword(userPasswords[userItem.id])}
                                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="Копировать пароль"
                                >
                                  📋
                                </button>
                                <button
                                  onClick={() => togglePasswordVisibility(userItem.id)}
                                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                  title="Скрыть пароль"
                                >
                                  👁️
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleRegeneratePassword(userItem.id)}
                                  disabled={regeneratingPasswords[userItem.id]}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  title="Сгенерировать пароль"
                                >
                                  {regeneratingPasswords[userItem.id] ? '⏳' : '🔑'}
                                </button>
                                <button
                                  onClick={() => handleShowPassword(userItem.id)}
                                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="Показать пароль"
                                >
                                  👁️
                                </button>
                              </div>
                            )}
                          </div>
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
                                  <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-700">
                      <span>
                        Показано {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getFilteredUsers().length)} из {getFilteredUsers().length} пользователей
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Назад
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Показываем только несколько страниц вокруг текущей
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                  page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (
                            page === currentPage - 3 ||
                            page === currentPage + 3
                          ) {
                            return (
                              <span key={page} className="px-3 py-2 text-sm text-gray-500">
                                ...
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>
                      
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Вперед
                      </button>
                    </div>
                  </div>
                )}
                
                {(activeTab === 'active' ? users.filter(u => u.is_active) : deactivatedUsers.filter(u => !u.is_active)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{activeTab === 'active' ? 'Активные пользователи не найдены' : 'Деактивированные пользователи не найдены'}</p>
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
        onUserCreated={handleUserCreated}
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
