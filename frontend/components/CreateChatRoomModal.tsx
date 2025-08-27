import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Department {
  id: number;
  name: string;
  description: string | null;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  department_id: number | null;
  avatar_url: string | null;
}

interface ChatBot {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface CreateChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
}

export default function CreateChatRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
}: CreateChatRoomModalProps) {
  const { token, user } = useAuth();
  const [name, setName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [selectedBots, setSelectedBots] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchUsers();
      fetchBots();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/departments/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Ошибка при загрузке отделов');
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError('Не удалось загрузить отделы');
      console.error('Error fetching departments:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/chat-users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Ошибка при загрузке пользователей');
      const data = await response.json();
      // Исключаем текущего пользователя из списка
      const filteredUsers = data.filter((u: User) => u.id !== user?.id);
      setUsers(filteredUsers);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
      console.error('Error fetching users:', err);
    }
  };

  const fetchBots = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/bots/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Ошибка при загрузке ботов');
      const data = await response.json();
      setBots(data.filter((bot: ChatBot) => bot.is_active));
    } catch (err) {
      setError('Не удалось загрузить ботов');
      console.error('Error fetching bots:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Создаем чат
      const createRoomResponse = await fetch('http://localhost:8000/api/chat/rooms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name,
          description: '', // Можно добавить поле для описания в будущем
          is_private: false
        }),
      });

      if (!createRoomResponse.ok) {
        const errorData = await createRoomResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка ${createRoomResponse.status}: ${createRoomResponse.statusText}`);
      }
      
      const roomData = await createRoomResponse.json();

      // Добавляем участников (если выбраны)
      if (selectedParticipants.size > 0) {
        const participantPromises = Array.from(selectedParticipants).map(userId =>
          fetch(`http://localhost:8000/api/chat/rooms/${roomData.id}/participants/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: userId }),
          })
        );

        const participantResponses = await Promise.all(participantPromises);
        const failedParticipants = participantResponses.filter(r => !r.ok);
        
        if (failedParticipants.length > 0) {
          console.warn(`Не удалось добавить ${failedParticipants.length} участников`);
        }
      }

      // Добавляем ботов (если выбраны)
      if (selectedBots.size > 0) {
        const botPromises = Array.from(selectedBots).map(botId =>
          fetch(`http://localhost:8000/api/chat/rooms/${roomData.id}/participants/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ bot_id: botId }),
          })
        );

        const botResponses = await Promise.all(botPromises);
        const failedBots = botResponses.filter(r => !r.ok);
        
        if (failedBots.length > 0) {
          console.warn(`Не удалось добавить ${failedBots.length} ботов`);
        }
      }

      onRoomCreated();
      onClose();
      setName('');
      setSelectedParticipants(new Set());
      setSelectedBots(new Set());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось создать чат';
      setError(errorMessage);
      console.error('Error creating chat room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleParticipant = (userId: number) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedParticipants(newSelected);
  };

  const toggleBot = (botId: number) => {
    const newSelected = new Set(selectedBots);
    if (newSelected.has(botId)) {
      newSelected.delete(botId);
    } else {
      newSelected.add(botId);
    }
    setSelectedBots(newSelected);
  };

  if (!isOpen) return null;

  const usersByDepartment = departments.map((dept: Department) => ({
    department: dept,
    users: users.filter((user: User) => user.department_id === dept.id),
  }));

  const usersWithoutDepartment = users.filter((user: User) => user.department_id === null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Создать новый чат</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Название чата
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Участники
            </label>
            
            {/* Информация о создателе */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Создатель чата:</strong> {user?.first_name} {user?.last_name}
                <br />
                <span className="text-blue-600">(автоматически добавлен как участник и администратор)</span>
              </p>
            </div>
            
            {/* Боты */}
            {bots.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">ИИ Боты</h3>
                <div className="space-y-2">
                  {bots.map(bot => (
                    <div key={bot.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`bot-${bot.id}`}
                        checked={selectedBots.has(bot.id)}
                        onChange={() => toggleBot(bot.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`bot-${bot.id}`} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <span className="text-sm">🤖</span>
                        </div>
                        <span>{bot.name}</span>
                        {bot.description && (
                          <span className="text-gray-500 text-sm ml-2">
                            ({bot.description})
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Пользователи по отделам */}
            {usersByDepartment.map(({ department, users }) => (
              users.length > 0 && (
                <div key={department.id} className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{department.name}</h3>
                  <div className="space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedParticipants.has(user.id)}
                          onChange={() => toggleParticipant(user.id)}
                          className="mr-2"
                        />
                        <label htmlFor={`user-${user.id}`} className="flex items-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="w-8 h-8 rounded-full object-cover mr-2"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                              <span className="text-sm font-medium text-gray-600">
                                {user.first_name[0]}
                                {user.last_name[0]}
                              </span>
                            </div>
                          )}
                          <span>
                            {user.first_name} {user.last_name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}

            {/* Пользователи без отдела */}
            {usersWithoutDepartment.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Без отдела</h3>
                <div className="space-y-2">
                  {usersWithoutDepartment.map(user => (
                    <div key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedParticipants.has(user.id)}
                        onChange={() => toggleParticipant(user.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`user-${user.id}`} className="flex items-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="w-8 h-8 rounded-full object-cover mr-2"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-gray-600">
                              {user.first_name[0]}
                              {user.last_name[0]}
                            </span>
                          </div>
                        )}
                        <span>
                          {user.first_name} {user.last_name}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={isLoading || !name}
            >
              {isLoading ? 'Создание...' : 'Создать чат'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}