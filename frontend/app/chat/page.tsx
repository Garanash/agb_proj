'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/hooks/useAuth';
import { getApiUrl, getWsUrl } from '../../src/utils/api';
import PageLayout from '../../src/components/layout/PageLayout';

import CreateChatRoomModal from '../../src/components/features/chat/CreateChatRoomModal';
import ChatParticipantsModal from '../../src/components/features/chat/ChatParticipantsModal';
import ChatFoldersModal from '../../src/components/features/chat/ChatFoldersModal';

interface ChatRoom {
  id: number;
  name: string;
  creator: User;
  participants: ChatRoomParticipant[];
  messages: ChatMessage[];
  is_active: boolean;
  folders: ChatRoomFolder[];
  unread_count?: number;
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
  unread_count?: number;
}

interface ChatRoomParticipant {
  id: number;
  user?: User;
  bot?: ChatBot;
  is_admin: boolean;
  last_read_at?: string;
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
  const [ws, setWs] = useState<typeof WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isFoldersModalOpen, setIsFoldersModalOpen] = useState(false);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ChatFolder | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [unreadSummary, setUnreadSummary] = useState<{[key: number]: number}>({});



  // Показываем загрузку, пока не получим данные пользователя
  if (isLoading || !user) {
    return (
      <PageLayout title="Рабочий чат">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Загрузка чата...</p>
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
        const [roomsResponse, usersResponse, foldersResponse, unreadResponse] = await Promise.all([
          fetch(`${getApiUrl()}/api/v1/chat/rooms/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${getApiUrl()}/api/v1/users/chat-users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${getApiUrl()}/api/v1/chat/folders/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${getApiUrl()}/api/v1/chat/unread-summary`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          console.log('📋 Полученные чаты:', roomsData);
          console.log('📊 Количество чатов:', roomsData.length);
          setRooms(roomsData);
        } else {
          console.error('❌ Ошибка загрузки чатов:', roomsResponse.status, roomsResponse.statusText);
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          console.error('Error fetching users:', usersResponse.status);
        }

        if (foldersResponse.ok) {
          const foldersData = await foldersResponse.json();
          console.log('Полученные папки:', foldersData);
          setFolders(foldersData);
        } else {
          console.error('Error fetching folders:', foldersResponse.status);
        }

        if (unreadResponse.ok) {
          const unreadData = await unreadResponse.json();
          console.log('Полученные непрочитанные сообщения:', unreadData);
          const unreadMap: {[key: number]: number} = {};
          unreadData.unread_summary.forEach((item: any) => {
            unreadMap[item.room_id] = item.unread_count;
          });
          setUnreadSummary(unreadMap);
        } else {
          console.error('Error fetching unread summary:', unreadResponse.status);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    
    // Обновляем непрочитанные сообщения каждые 30 секунд
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // WebSocket подключение
  useEffect(() => {
    if (selectedRoom && token && selectedRoom.id) {
      try {
        console.log(`🔌 Подключение к WebSocket для чата ${selectedRoom.id}`);
        const ws = new WebSocket(`${getWsUrl()}/api/v1/chat/ws/${selectedRoom.id}?token=${token}`);
        
        ws.onopen = () => {
          console.log(`✅ WebSocket подключен к чату ${selectedRoom.id}`);
        };

        ws.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket сообщение получено:', data);
            
            if (data.type === 'message') {
              // Мгновенно добавляем новое сообщение в чат
              setSelectedRoom(prev => {
                if (!prev) return null;
                
                // Простая проверка на дублирование по ID (быстрее)
                const messageExists = prev.messages.some(msg => msg.id === data.data.id);
                if (messageExists) {
                  console.log('📝 Сообщение уже существует, пропускаем:', data.data.id);
                  return prev;
                }
                
                console.log('📝 Добавляем новое сообщение:', data.data);
                return {
                  ...prev,
                  messages: [...prev.messages, data.data]
                };
              });
              
              // Обновляем счетчик непрочитанных сообщений для всех чатов (асинхронно)
              setTimeout(() => updateAllUnreadCounts(), 0);
              
              // Прокручиваем к последнему сообщению (максимально быстро)
              requestAnimationFrame(() => {
                const messagesContainer = (window as any).document.querySelector('.messages-container') as any;
                if (messagesContainer) {
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
              });
              
            } else if (data.type === 'system_message') {
              console.log('📢 Системное сообщение получено:', data.data);
              
              setSelectedRoom(prev => {
                if (!prev) return null;
                
                // Простая проверка на дублирование по ID
                const messageExists = prev.messages.some(msg => msg.id === data.data.id);
                if (messageExists) {
                  console.log('📢 Системное сообщение уже существует, пропускаем:', data.data.id);
                  return prev;
                }
                
                console.log('📢 Добавляем новое системное сообщение:', data.data);
                return {
                  ...prev,
                  messages: [...prev.messages, data.data]
                };
              });
              
              // Прокручиваем к последнему сообщению (максимально быстро)
              requestAnimationFrame(() => {
                const messagesContainer = (window as any).document.querySelector('.messages-container') as any;
                if (messagesContainer) {
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
              });
            } else if (data.type === 'notification') {
              console.log('📢 Уведомление получено:', data);
              // Обновляем счетчики при уведомлениях (асинхронно)
              setTimeout(() => updateAllUnreadCounts(), 0);
            }
          } catch (error) {
            console.error('❌ Ошибка парсинга WebSocket сообщения:', error);
          }
        };

        ws.onerror = (error: any) => {
          console.error('❌ WebSocket ошибка:', error);
        };

        ws.onclose = (event: any) => {
          console.log(`🔌 WebSocket отключен от чата ${selectedRoom.id}:`, event.code, event.reason);
          
          // Автоматически переподключаемся при ошибке
          if (event.code !== 1000) { // 1000 = нормальное закрытие
            console.log('🔄 Попытка переподключения через 3 секунды...');
            setTimeout(() => {
              if (selectedRoom && token) {
                // Переподключение произойдет автоматически при следующем useEffect
              }
            }, 3000);
          }
        };

        setWs(ws as any);

        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            console.log(`🔌 Закрытие WebSocket для чата ${selectedRoom.id}`);
            ws.close(1000, 'Component unmount');
          }
        };
      } catch (error) {
        console.error('❌ Ошибка создания WebSocket:', error);
      }
    }
  }, [selectedRoom?.id, token]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    (messagesEndRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRoom?.messages]);

  // Функция для обновления счетчика непрочитанных сообщений
  const updateUnreadCount = async (roomId: number) => {
    if (!token) return;
    
    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${roomId}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        setUnreadSummary(prev => ({
          ...prev,
          [roomId]: data.unread_count
        }));
      }
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  // Функция для обновления всех счетчиков непрочитанных сообщений
  const updateAllUnreadCounts = useCallback(async () => {
    if (!token || !rooms || !Array.isArray(rooms)) return;
    
    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/unread-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        setUnreadSummary(data);
      }
    } catch (error) {
      console.error('Error updating all unread counts:', error);
    }
  }, [token, rooms]);

  // Функция для подсчета непрочитанных сообщений в папке
  const getFolderUnreadCount = (folderId: number) => {
    if (!rooms || !Array.isArray(rooms) || !unreadSummary) return 0;
    
    const folderRooms = rooms.filter(room => 
      room.folders && room.folders.some(f => f.folder_id === folderId)
    );
    
    return folderRooms.reduce((total, room) => {
      return total + (unreadSummary[room.id] || 0);
    }, 0);
  };

  // Функция для отметки сообщений как прочитанных
  const markMessagesAsRead = async (roomId: number) => {
    if (!token) return;
    
    try {
      await fetch(`${getApiUrl()}/api/v1/chat/rooms/${roomId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Обновляем счетчик непрочитанных сообщений
      setUnreadSummary(prev => ({
        ...prev,
        [roomId]: 0
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleRoomSelect = async (room: ChatRoomListItem) => {
    try {
      console.log('Выбираем чат:', room);
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${room.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        console.log('Детали чата:', data);
        setSelectedRoom(data);
        
        // Отмечаем сообщения как прочитанные при выборе чата
        markMessagesAsRead(room.id);
      } else {
        console.error('Error fetching room details:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRoom) return;

    const messageContent = message.trim();
    setMessage(''); // Очищаем поле ввода сразу

    // Создаем временное сообщение для мгновенного отображения
    const tempMessage: ChatMessage = {
      id: Date.now(), // Временный ID
      content: messageContent,
      sender: user ? {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url || null,
        department_id: user.department_id || null
      } : undefined,
      created_at: new Date().toISOString(),
      is_edited: false
    };

    console.log('📤 Отправляем сообщение:', messageContent);

    // Мгновенно добавляем сообщение в чат
    setSelectedRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, tempMessage]
      };
    });

    // Прокручиваем к последнему сообщению (максимально быстро)
    requestAnimationFrame(() => {
      const messagesContainer = (window as any).document.querySelector('.messages-container') as any;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });

    // Отправляем сообщение через WebSocket для мгновенной доставки всем участникам
    if (ws && (ws as any).readyState === WebSocket.OPEN) {
      try {
        (ws as any).send(JSON.stringify({
          type: 'message',
          content: messageContent
        }));
        console.log('📤 Сообщение отправлено через WebSocket');
      } catch (error) {
        console.error('❌ Ошибка отправки через WebSocket:', error);
        // Fallback на HTTP API
        sendMessageViaHTTP(messageContent, tempMessage);
      }
    } else {
      console.log('📤 WebSocket недоступен, используем HTTP API');
      // Fallback на HTTP API если WebSocket недоступен
      sendMessageViaHTTP(messageContent, tempMessage);
    }
  };

  const sendMessageViaHTTP = async (messageContent: string, tempMessage?: ChatMessage) => {
    if (!selectedRoom) return;
    
    // Если tempMessage не передан, создаем его
    if (!tempMessage) {
      tempMessage = {
        id: Date.now(),
        content: messageContent,
        sender: user ? {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url || null,
          department_id: user.department_id || null
        } : undefined,
        created_at: new Date().toISOString(),
        is_edited: false
      };
    }
    
    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${selectedRoom.id}/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: messageContent })
      });

      if (response.status >= 200 && response.status < 300) {
        const newMessage = await response.json();
        console.log('📤 Сообщение отправлено через HTTP API');
        
        // Обновляем счетчики после успешной отправки (асинхронно)
        setTimeout(() => updateAllUnreadCounts(), 0);
        
        console.log('📤 HTTP API: заменяем временное сообщение на реальное:', newMessage.id);
        
        // Заменяем временное сообщение на реальное
        if (tempMessage && tempMessage.id) {
          setSelectedRoom(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === tempMessage!.id ? newMessage : msg
              )
            };
          });
        }
      } else {
        console.error('❌ Ошибка отправки сообщения:', response.status);
        console.log('❌ HTTP API: удаляем временное сообщение при ошибке');
        
        // Удаляем временное сообщение при ошибке
        if (tempMessage && tempMessage.id) {
          setSelectedRoom(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.filter(msg => msg.id !== tempMessage!.id)
            };
          });
        }
      }
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      console.log('❌ HTTP API: удаляем временное сообщение при ошибке сети');
      
      // Удаляем временное сообщение при ошибке
      if (tempMessage && tempMessage.id) {
        setSelectedRoom(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== tempMessage!.id)
          };
        });
      }
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;

    // Подтверждение выхода
    if (!confirm('Вы уверены, что хотите покинуть беседу? Это действие нельзя отменить.')) {
      return;
    }

    try {
      console.log(`🚪 Покидаем чат ${selectedRoom.id}...`);
      
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${selectedRoom.id}/leave`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Успешно покинули чат');
        
        // Закрываем WebSocket подключение
        if (ws) {
          console.log('🔌 Закрываем WebSocket подключение...');
          (ws as any).close(1000, 'User left the room');
          setWs(null);
        }
        
        // Удаляем комнату из списка
        setRooms(prev => prev.filter(room => room.id !== selectedRoom.id));
        
        // Очищаем выбранную комнату
        setSelectedRoom(null);
        
        // Показываем уведомление об успешном выходе
        alert('Вы успешно покинули беседу');
        
      } else {
        let errorMessage = 'Неизвестная ошибка';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            // Проверяем, является ли detail строкой или объектом
            if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else if (typeof errorData.detail === 'object') {
              // Если detail - это объект, пытаемся извлечь сообщение
              errorMessage = errorData.detail.message || errorData.detail.detail || JSON.stringify(errorData.detail);
            } else {
              errorMessage = String(errorData.detail);
            }
          }
        } catch (parseError) {
          console.error('Ошибка парсинга ответа об ошибке:', parseError);
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        
        console.error('❌ Ошибка при выходе из чата:', response.status, errorMessage);
        alert(`Ошибка при выходе из беседы: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Ошибка при выходе из чата:', error);
      alert('Произошла ошибка при выходе из беседы. Попробуйте еще раз.');
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

  // Функция для отображения аватара пользователя
  const renderUserAvatar = (user: User, size: string = "w-10 h-10") => {
    if (user.avatar_url) {
      return (
        <img
          src={`${getApiUrl()}/uploads/${user.avatar_url}`}
          alt={`${user.first_name} ${user.last_name}`}
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            console.log('Avatar load error:', user.avatar_url);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    } else {
      return (
        <div className={`${size} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center`}>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
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
      <div className={`${size} rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center`}>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          🤖
        </span>
      </div>
    );
  };

  const handleOpenParticipantsModal = async () => {
    if (!selectedRoom) return;
    
    // Перезагружаем информацию о чате перед открытием модала
    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${selectedRoom.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        const roomData = await response.json();
        console.log('Обновленные данные чата:', roomData);
        console.log('Участники:', roomData.participants);
        setSelectedRoom(roomData);
        setIsParticipantsModalOpen(true);
      } else {
        console.error('Ошибка загрузки данных чата:', response.status);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных чата:', error);
    }
  };

  return (
    <PageLayout title="Рабочий чат">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Список бесед */}
        <div className="w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Рабочий чат</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Создать
              </button>
            </div>
          </div>
          {/* Папки */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {folders && Array.isArray(folders) && folders.length > 0 ? folders.map(folder => (
              <div key={folder.id}>
                <div
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedFolder?.id === folder.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  onClick={() => setSelectedFolder(selectedFolder?.id === folder.id ? null : folder)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">📁</span>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{folder.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {rooms && Array.isArray(rooms) ? rooms.filter(room => room.folders && room.folders.some(f => f.folder_id === folder.id)).length : 0} чатов
                      </span>
                      {getFolderUnreadCount(folder.id) > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {getFolderUnreadCount(folder.id)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {selectedFolder?.id === folder.id && (
                  <div className="pl-8 divide-y divide-gray-200 dark:divide-gray-700">
                    {rooms && Array.isArray(rooms) && rooms.length > 0 ? rooms
                      .filter(room => room.folders && room.folders.some(f => f.folder_id === folder.id))
                      .map(room => (
                        <div
                          key={room.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedRoom?.id === room.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                          onClick={() => handleRoomSelect(room)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">{room.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Беседа создана {room.created_at ? new Date(room.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                              </p>
                            </div>
                            {unreadSummary[room.id] && unreadSummary[room.id] > 0 && (
                              <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {unreadSummary[room.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <p>Нет чатов в этой папке</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>Нет папок</p>
              </div>
            )}
          </div>

          {/* Чаты без папок */}
          <div className="mt-4">
            <h3 className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Чаты без папки</h3>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {rooms && Array.isArray(rooms) && rooms.length > 0 ? rooms
                .filter(room => !room.folders || !room.folders.length)
                .map(room => (
                  <div
                    key={room.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedRoom?.id === room.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleRoomSelect(room)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{room.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Беседа создана {room.created_at ? new Date(room.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                        </p>
                      </div>
                      {unreadSummary[room.id] && unreadSummary[room.id] > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadSummary[room.id]}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <p>Нет доступных чатов</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Область чата */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {selectedRoom ? (
            <React.Fragment key={selectedRoom.id}>
              {/* Заголовок беседы */}
              <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedRoom.name}</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleOpenParticipantsModal}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Участники ({selectedRoom.participants && Array.isArray(selectedRoom.participants) ? selectedRoom.participants.length : 0})
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
                  {selectedRoom.messages && Array.isArray(selectedRoom.messages) && selectedRoom.messages.length > 0 ? selectedRoom.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex ${message.sender?.id === user?.id ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                        <div className={`flex-shrink-0 ${message.sender?.id === user?.id ? 'ml-2' : 'mr-2'}`}>
                          {message.sender ? (
                            renderUserAvatar(message.sender)
                          ) : message.bot ? (
                            renderBotAvatar(message.bot)
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                ?
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={`max-w-md ${
                          message.sender?.id === user?.id 
                            ? 'bg-blue-500 text-white' 
                            : message.bot 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                              : (!message.sender && !message.bot)
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                : 'bg-white dark:bg-gray-800'
                        } rounded-lg p-3 shadow`}>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {message.sender 
                                ? `${message.sender.first_name} ${message.sender.last_name}`
                                : message.bot?.name || (!message.sender && !message.bot ? 'Система' : 'Неизвестный отправитель')
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
                  )) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <p>Нет сообщений в этом чате</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Поле ввода */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={message}
                    onChange={(e: any) => setMessage(e.target.value)}
                    onKeyPress={(e: any) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Введите сообщение..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </React.Fragment>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Выберите беседу для начала общения</p>
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
          console.log('🔄 Обновляем список чатов после создания нового чата');
          try {
            const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('📡 Ответ сервера на обновление чатов:', response.status);
            if (response.status >= 200 && response.status < 300) {
              const data = await response.json();
              console.log('📋 Обновленный список чатов:', data);
              setRooms(data);
              // Обновляем счетчики после создания нового чата
              updateAllUnreadCounts();
            } else {
              console.error('❌ Ошибка при обновлении чатов:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('❌ Ошибка при обновлении чатов:', error);
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
              const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/${selectedRoom.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (response.status >= 200 && response.status < 300) {
                const data = await response.json();
                setSelectedRoom(data);
                // Обновляем счетчики после изменения участников
                updateAllUnreadCounts();
              }
            } catch (error) {
              console.error('Error refreshing room:', error);
            }
          }}
          isAdmin={selectedRoom.participants && Array.isArray(selectedRoom.participants) && selectedRoom.participants.length > 0 ? selectedRoom.participants.some(p => p.user?.id === user?.id && p.is_admin) : false}
        />
      )}

      {/* Модальное окно управления папками */}
      {selectedRoom && (
        <ChatFoldersModal
          isOpen={isFoldersModalOpen}
          onClose={() => setIsFoldersModalOpen(false)}
          roomId={selectedRoom.id}
          onFolderSelected={async (folderId: any) => {
            // Перезагружаем список бесед
            try {
              const response: any = await fetch(`${getApiUrl()}/api/v1/chat/rooms/`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (response.status >= 200 && response.status < 300) {
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