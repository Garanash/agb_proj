'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  department_id: number | null;
}

interface Department {
  id: number;
  name: string;
  description: string | null;
  head_id: number | null;
  is_active: boolean;
}

interface ChatBot {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface ChatRoomParticipant {
  id: number;
  user?: User;
  bot?: ChatBot;
  is_admin: boolean;
}

interface ChatParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  participants: ChatRoomParticipant[];
  onParticipantsUpdated: () => void;
  isAdmin: boolean;
}

const ChatParticipantsModal: React.FC<ChatParticipantsModalProps> = ({
  isOpen,
  onClose,
  roomId,
  participants,
  onParticipantsUpdated,
  isAdmin
}) => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{[key: number]: string}>({});
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Загрузка пользователей и отделов
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !isOpen) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const [usersResponse, departmentsResponse] = await Promise.all([
          fetch('http://localhost:8000/api/users/chat-users/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('http://localhost:8000/api/departments/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          throw new Error('Не удалось загрузить пользователей');
        }

        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          const deptMap: {[key: number]: string} = {};
          departmentsData.forEach((dept: Department) => {
            deptMap[dept.id] = dept.name;
          });
          setDepartments(deptMap);
        } else {
          throw new Error('Не удалось загрузить отделы');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке данных');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, isOpen]);

  const handleAddParticipants = async () => {
    if (!selectedUsers.length) return;
    
    setIsLoading(true);
    setError('');

    try {
      const promises = selectedUsers.map(userId =>
        fetch(`http://localhost:8000/api/chat/rooms/${roomId}/participants/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            is_admin: false
          })
        })
      );

      await Promise.all(promises);
      onParticipantsUpdated();
      setSelectedUsers([]);
    } catch (error) {
      setError('Не удалось добавить участников');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8000/api/chat/rooms/${roomId}/participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onParticipantsUpdated();
      } else {
        throw new Error('Не удалось удалить участника');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при удалении участника');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (participant: ChatRoomParticipant) => {
    if (!participant.user) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8000/api/chat/rooms/${roomId}/participants/${participant.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_admin: !participant.is_admin
        })
      });

      if (response.ok) {
        onParticipantsUpdated();
      } else {
        throw new Error('Не удалось изменить права администратора');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при изменении прав администратора');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Управление участниками
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Текущие участники */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Текущие участники</h4>
            <div className="space-y-3">
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {participant.user ? (
                      participant.user.avatar_url ? (
                        <img
                          src={participant.user.avatar_url}
                          alt={`${participant.user.first_name} ${participant.user.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {participant.user.first_name[0]}
                            {participant.user.last_name[0]}
                          </span>
                        </div>
                      )
                    ) : participant.bot ? (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          🤖
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          ?
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {participant.user 
                          ? `${participant.user.first_name} ${participant.user.last_name}`
                          : participant.bot?.name || 'Неизвестный участник'
                        }
                      </p>
                      {participant.is_admin && (
                        <span className="text-sm text-blue-600">Администратор</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      {participant.user && (
                        <button
                          onClick={() => handleToggleAdmin(participant)}
                          className={`px-3 py-1 rounded text-sm ${
                            participant.is_admin
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {participant.is_admin ? 'Снять админа' : 'Сделать админом'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Удалить"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Добавление новых участников */}
          {isAdmin && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Добавить участников</h4>
              <select
                multiple
                value={selectedUsers.map(String)}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions);
                  const selectedIds = selectedOptions.map(option => parseInt(option.value));
                  setSelectedUsers(selectedIds);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              >
                {Object.entries(departments).map(([deptId, deptName]) => {
                  const deptUsers = users.filter(user => user.department_id === parseInt(deptId));
                  if (deptUsers.length === 0) return null;
                  
                  return (
                    <optgroup key={deptId} label={deptName}>
                      {deptUsers.map(user => {
                        // Не показываем уже добавленных пользователей
                        if (participants.some(p => p.user?.id === user.id)) return null;
                        
                        return (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        );
                      })}
                    </optgroup>
                  );
                })}
                {users.filter(user => !user.department_id).length > 0 && (
                  <optgroup label="Без отдела">
                    {users
                      .filter(user => !user.department_id)
                      .map(user => {
                        // Не показываем уже добавленных пользователей
                        if (participants.some(p => p.user?.id === user.id)) return null;
                        
                        return (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        );
                      })
                    }
                  </optgroup>
                )}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Зажмите Ctrl (Cmd на Mac) для выбора нескольких участников
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Закрыть
            </button>
            {isAdmin && selectedUsers.length > 0 && (
              <button
                type="button"
                onClick={handleAddParticipants}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Добавление...' : 'Добавить выбранных'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatParticipantsModal;
