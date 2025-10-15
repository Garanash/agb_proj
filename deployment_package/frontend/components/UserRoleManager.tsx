'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api'
import { useAuth } from '@/hooks'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  roles: string[]
  is_active: boolean
}

interface Role {
  value: string
  label: string
  description: string
}

interface UserRoleManagerProps {
  user: User
  onRolesUpdated?: (user: User) => void
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  user,
  onRolesUpdated
}) => {
  const { token } = useAuth()
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<string[]>(user.roles || [])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchAvailableRoles()
  }, [])

  const fetchAvailableRoles = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/v1/roles/available-roles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAvailableRoles(response.data)
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const assignRole = async (role: string) => {
    setLoading(true)
    try {
      const apiUrl = getApiUrl()
      await axios.post(
        `${apiUrl}/api/v1/roles/users/${user.id}/roles`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUserRoles(prev => [...prev, role])
      if (onRolesUpdated) {
        onRolesUpdated({ ...user, roles: [...userRoles, role] })
      }
    } catch (error) {
      console.error('Error assigning role:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeRole = async (role: string) => {
    setLoading(true)
    try {
      const apiUrl = getApiUrl()
      await axios.delete(`${apiUrl}/api/v1/roles/users/${user.id}/roles/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUserRoles(prev => prev.filter(r => r !== role))
      if (onRolesUpdated) {
        onRolesUpdated({ ...user, roles: userRoles.filter(r => r !== role) })
      }
    } catch (error) {
      console.error('Error removing role:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (roleValue: string) => {
    const role = availableRoles.find(r => r.value === roleValue)
    return role ? role.label : roleValue
  }

  const getRoleDescription = (roleValue: string) => {
    const role = availableRoles.find(r => r.value === roleValue)
    return role ? role.description : ''
  }

  const availableRolesToAssign = availableRoles.filter(
    role => !userRoles.includes(role.value) && role.value !== user.role
  )

  return (
    <div className="user-role-manager">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Управление ролями пользователя</h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Назначить роль
        </button>
      </div>

      {/* Текущие роли */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Текущие роли:</h4>
        <div className="flex flex-wrap gap-2">
          {/* Основная роль */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            {getRoleLabel(user.role)} (основная)
          </span>

          {/* Дополнительные роли */}
          {userRoles.map(role => (
            <span
              key={role}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {getRoleLabel(role)}
              <button
                onClick={() => removeRole(role)}
                disabled={loading}
                className="ml-2 text-red-600 hover:text-red-800"
                title="Удалить роль"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Модальное окно для назначения ролей */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Назначить новую роль</h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableRolesToAssign.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Нет доступных ролей для назначения
                </p>
              ) : (
                availableRolesToAssign.map(role => (
                  <div
                    key={role.value}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-gray-600">{role.description}</div>
                    </div>
                    <button
                      onClick={() => {
                        assignRole(role.value)
                        setShowModal(false)
                      }}
                      disabled={loading}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      Назначить
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserRoleManager
