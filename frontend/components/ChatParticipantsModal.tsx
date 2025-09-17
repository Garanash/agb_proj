'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

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
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{[key: number]: string}>({});
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Загрузка пользователей и отделов, обработка Escape
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !isOpen) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const [usersResponse, departmentsResponse] = await Promise.all([
          fetch(`${getApiUrl()}/api/v1/users/chat-users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${getApiUrl()}/api/v1/departments/list`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Исключаем текущего пользователя и уже добавленных участников
          const filteredUsers = usersData.filter((u: User) => 
            u.id !== user?.id && 
            !participants.some((p: ChatRoomParticipant) => p.user?.id === u.id)
          );
          setUsers(filteredUsers);
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

        // Дополнительно загружаем полную информацию об участниках чата
        if (roomId) {
          try {
            const roomResponse: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${roomId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (roomResponse.status >= 200 && roomResponse.status < 300) {
              const roomData = await roomResponse.json();
              console.log('Полная информация о чате:', roomData);
              console.log('Участники чата:', roomData.participants);
              
              // Обновляем участников с полной информацией
              if (roomData.participants && roomData.participants.length > 0) {
                // Вызываем callback для обновления участников в родительском компоненте
                onParticipantsUpdated();
              }
            }
          } catch (error) {
            console.error('Ошибка загрузки деталей чата:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Не удалось загрузить данные');
      } finally {
        setIsLoading(false);
      }
    };

  const handleEscape = (e: any) => {
    if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      (window as any).document.addEventListener('keydown', handleEscape);
      // Блокируем скролл body
      (window as any).document.body.style.overflow = 'hidden';
    }

    fetchData();

    return () => {
      (window as any).document.removeEventListener('keydown', handleEscape);
      // Восстанавливаем скролл body
      (window as any).document.body.style.overflow = 'unset';
    };
  }, [token, isOpen, roomId, participants, user?.id, onParticipantsUpdated]);

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Добавляем каждого пользователя по отдельности
      const addPromises = selectedUsers.map(userId =>
        fetch(`${getApiUrl()}/api/v1/chat/rooms/${roomId}/participants/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: userId }),
        })
      );

      const responses = await Promise.all(addPromises);
      const failedResponses = responses.filter((r: any) => !(r.status >= 200 && r.status < 300));
      
      if (failedResponses.length > 0) {
        throw new Error(`Не удалось добавить ${failedResponses.length} участников`);
      }

      setSelectedUsers([]);
      onParticipantsUpdated();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при добавлении участников');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого участника?')) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${roomId}/participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status >= 200 && response.status < 300) {
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
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${roomId}/participants/${participant.id}/toggle-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_admin: !participant.is_admin
        })
      });

      if (response.status >= 200 && response.status < 300) {
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

  // Функция для отображения аватара пользователя
  const renderUserAvatar = (user: User, size: string = "w-10 h-10") => {
    if (user.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt={`${user.first_name} ${user.last_name}`}
          className={`${size} rounded-full object-cover`}
        />
      );
    } else {
      return (
        <div className={`${size} rounded-full bg-gray-300 flex items-center justify-center`}>
          <span className="text-sm font-medium text-gray-600">
            {user.first_name[0]}
            {user.last_name[0]}
          </span>
        </div>
      );
    }
  };

  // Функция для отображения аватара бота
  const renderBotAvatar = (bot: ChatBot, size: string = "w-10 h-10") => {
    return (
      <div className={`${size} rounded-full bg-blue-100 flex items-center justify-center`}>
        <span className="text-sm font-medium text-blue-600">
          🤖
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Заголовок */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Управление участниками
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto">
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
                        renderUserAvatar(participant.user)
                      ) : participant.bot ? (
                        renderBotAvatar(participant.bot)
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
                            : participant.bot?.name || 'Загрузка...'
                          }
                        </p>
                        {participant.is_admin && (
                          <span className="text-sm text-blue-600">Администратор</span>
                        )}
                        {participant.user && participant.user.department_id && (
                          <p className="text-sm text-gray-500">
                            {departments[participant.user.department_id] || 'Без отдела'}
                          </p>
                        )}
                        {!participant.user && !participant.bot && (
                          <p className="text-sm text-gray-400">
                            ID: {participant.id}
                          </p>
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
                            <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  onChange={(e: any) => {
                    const selectedOptions = Array.from(e.target.selectedOptions);
                    const selectedIds = selectedOptions.map((option: any) => parseInt(option.value));
                    setSelectedUsers(selectedIds);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                >
                  {Object.entries(departments).map(([deptId, deptName]) => {
                    const deptUsers = users.filter(user => user.department_id === parseInt(deptId));
                    if (deptUsers.length === 0) return null;
                    
                    return (
                      <optgroup key={deptId} label={deptName}>
                        {deptUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  {users.filter(user => !user.department_id).length > 0 && (
                    <optgroup label="Без отдела">
                      {users
                        .filter(user => !user.department_id)
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))
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
                type={"button" as const}
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Закрыть
              </button>
              {isAdmin && selectedUsers.length > 0 && (
                <button
                  type={"button" as const}
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
    </div>
  );
};

export default ChatParticipantsModal;

