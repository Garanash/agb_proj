'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import PageLayout from '@/components/PageLayout';

import CreateChatRoomModal from '@/components/CreateChatRoomModal';
import ChatParticipantsModal from '@/components/ChatParticipantsModal';
import ChatFoldersModal from '@/components/ChatFoldersModal';

interface ChatFolder {
  id: number;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string | null;
}

interface ChatRoom {
  id: number;
  name: string;
  creator: User;
  participants: ChatRoomParticipant[];
  messages: ChatMessage[];
  is_active: boolean;
  folders: ChatRoomFolder[];
}

interface ChatRoomListItem {
  id: number;
  name: string;
  description?: string;
  creator_id: number;
  is_private: boolean;
  created_at: string;
  updated_at: string | null;
  folders: ChatRoomFolder[];
}

interface ChatRoomParticipant {
  id: number;
  user?: User;
  bot?: ChatBot;
  is_admin: boolean;
}

interface ChatMessage {
  id: number;
  content: string;
  sender?: User;
  bot?: ChatBot;
  created_at: string;
  is_edited: boolean;
}

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

interface ChatFolder {
  id: number;
  name: string;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

interface ChatRoomFolder {
  id: number;
  folder_id: number;
  room_id: number;
  created_at: string;
}

const ChatPage = () => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isFoldersModalOpen, setIsFoldersModalOpen] = useState(false);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ChatFolder | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Показываем загрузку, пока не получим данные пользователя
  if (isLoading || !user) {
    return (
      <PageLayout title="Рабочий чат">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка чата...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Загрузка списка бесед, пользователей и папок
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        const [roomsResponse, usersResponse, foldersResponse] = await Promise.all([
          fetch('http://localhost:8000/api/chat/rooms/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('http://localhost:8000/api/users/chat-users/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('http://localhost:8000/api/chat/folders/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
        } else {
          console.error('Error fetching rooms:', roomsResponse.status);
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          console.error('Error fetching users:', usersResponse.status);
        }

        if (foldersResponse.ok) {
          const foldersData = await foldersResponse.json();
          setFolders(foldersData);
        } else {
          console.error('Error fetching folders:', foldersResponse.status);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [token]);

  // WebSocket подключение
  useEffect(() => {
    if (selectedRoom && token && selectedRoom.id) {
      try {
        const ws = new WebSocket(`ws://localhost:8000/api/chat/ws/${selectedRoom.id}?token=${token}`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
              setSelectedRoom(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  messages: [...prev.messages, data.data]
                };
              });
            } else if (data.type === 'system_message') {
              setSelectedRoom(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  messages: [...prev.messages, data.data]
                };
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
        };

        setWs(ws);

        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
      }
    }
  }, [selectedRoom, token]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRoom?.messages]);

  const handleRoomSelect = async (room: ChatRoomListItem) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/rooms/${room.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedRoom(data);
      } else {
        console.error('Error fetching room details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRoom) return;

    // Отправляем сообщение через WebSocket для мгновенного отображения
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        content: message
      }));
      setMessage('');
    } else {
      // Fallback на HTTP API если WebSocket недоступен
      try {
        const response = await fetch(`http://localhost:8000/api/chat/rooms/${selectedRoom.id}/messages/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: message })
        });

        if (response.ok) {
          setMessage('');
          // Перезагружаем сообщения
          const roomResponse = await fetch(`http://localhost:8000/api/chat/rooms/${selectedRoom.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (roomResponse.ok) {
            const roomData = await roomResponse.json();
            setSelectedRoom(roomData);
          }
        } else {
          console.error('Error sending message:', response.status);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;

    try {
      const response = await fetch(`http://localhost:8000/api/chat/rooms/${selectedRoom.id}/participants/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Удаляем комнату из списка
        setRooms(prev => prev.filter(room => room.id !== selectedRoom.id));
        setSelectedRoom(null);
        // Закрываем WebSocket
        if (ws) {
          ws.close();
          setWs(null);
        }
      } else {
        console.error('Error leaving room:', response.status);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <PageLayout title="Рабочий чат">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Список бесед */}
        <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Рабочий чат</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Создать
              </button>
            </div>
          </div>
          {/* Папки */}
          <div className="divide-y divide-gray-200">
            {folders.map(folder => (
              <div key={folder.id}>
                <div
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedFolder?.id === folder.id ? 'bg-gray-100' : ''}`}
                  onClick={() => setSelectedFolder(selectedFolder?.id === folder.id ? null : folder)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">📁</span>
                      <h3 className="font-medium">{folder.name}</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {rooms.filter(room => room.folders.some(f => f.folder_id === folder.id)).length}
                    </span>
                  </div>
                </div>
                {selectedFolder?.id === folder.id && (
                  <div className="pl-8 divide-y divide-gray-200">
                    {rooms
                      .filter(room => room.folders.some(f => f.folder_id === folder.id))
                      .map(room => (
                        <div
                          key={room.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedRoom?.id === room.id ? 'bg-gray-100' : ''}`}
                          onClick={() => handleRoomSelect(room)}
                        >
                          <h3 className="font-medium">{room.name}</h3>
                          <p className="text-sm text-gray-500">
                            Беседа создана {new Date(room.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Чаты без папок */}
          <div className="mt-4">
            <h3 className="px-4 py-2 text-sm font-medium text-gray-500">Чаты без папки</h3>
            <div className="divide-y divide-gray-200">
              {rooms
                .filter(room => !room.folders.length)
                .map(room => (
                  <div
                    key={room.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedRoom?.id === room.id ? 'bg-gray-100' : ''}`}
                    onClick={() => handleRoomSelect(room)}
                  >
                    <h3 className="font-medium">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      Беседа создана {new Date(room.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Область чата */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedRoom ? (
            <>
              {/* Заголовок беседы */}
              <div className="p-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{selectedRoom.name}</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsParticipantsModalOpen(true)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Участники ({selectedRoom.participants.length})
                    </button>
                    <button
                      onClick={() => setIsFoldersModalOpen(true)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      В папку
                    </button>
                    <button
                      onClick={handleLeaveRoom}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Покинуть беседу
                    </button>
                  </div>
                </div>
              </div>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {selectedRoom.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex ${message.sender?.id === user?.id ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                        <div className={`flex-shrink-0 ${message.sender?.id === user?.id ? 'ml-2' : 'mr-2'}`}>
                          {message.sender ? (
                            message.sender.avatar_url ? (
                              <img
                                src={message.sender.avatar_url}
                                alt={`${message.sender.first_name} ${message.sender.last_name}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {message.sender.first_name[0]}
                                  {message.sender.last_name[0]}
                                </span>
                              </div>
                            )
                          ) : message.bot ? (
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
                        </div>
                        <div className={`max-w-md ${
                          message.sender?.id === user?.id 
                            ? 'bg-blue-500 text-white' 
                            : message.bot 
                              ? 'bg-blue-100 text-blue-900' 
                              : message.sender_id === null && message.bot_id === null
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-white'
                        } rounded-lg p-3 shadow`}>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {message.sender 
                                ? `${message.sender.first_name} ${message.sender.last_name}`
                                : message.bot?.name || (message.sender_id === null && message.bot_id === null ? 'Система' : 'Неизвестный отправитель')
                              }
                            </span>
                            <span className="text-xs opacity-75">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                          <p className="mt-1">{message.content}</p>
                          {message.is_edited && (
                            <span className="text-xs opacity-75 italic">изменено</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Поле ввода */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Введите сообщение..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Выберите беседу для начала общения</p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно создания беседы */}
      <CreateChatRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={async () => {
          // Перезагружаем список бесед
          try {
            const response = await fetch('http://localhost:8000/api/chat/rooms/', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const data = await response.json();
              setRooms(data);
            }
          } catch (error) {
            console.error('Error refreshing rooms:', error);
          }
        }}
      />

      {/* Модальное окно управления участниками */}
      {selectedRoom && (
        <ChatParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => setIsParticipantsModalOpen(false)}
          roomId={selectedRoom.id}
          participants={selectedRoom.participants}
          onParticipantsUpdated={async () => {
            // Перезагружаем информацию о комнате
            try {
              const response = await fetch(`http://localhost:8000/api/chat/rooms/${selectedRoom.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (response.ok) {
                const data = await response.json();
                setSelectedRoom(data);
              }
            } catch (error) {
              console.error('Error refreshing room:', error);
            }
          }}
          isAdmin={selectedRoom.participants.some(p => p.user?.id === user?.id && p.is_admin)}
        />
      )}

      {/* Модальное окно управления папками */}
      {selectedRoom && (
        <ChatFoldersModal
          isOpen={isFoldersModalOpen}
          onClose={() => setIsFoldersModalOpen(false)}
          roomId={selectedRoom.id}
          onFolderSelected={async (folderId) => {
            // Перезагружаем список бесед
            try {
              const response = await fetch('http://localhost:8000/api/chat/rooms/', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (response.ok) {
                const data = await response.json();
                setRooms(data);
              }
            } catch (error) {
              console.error('Error refreshing rooms:', error);
            }
          }}
        />
      )}
    </PageLayout>
  );
};

export default ChatPage;
