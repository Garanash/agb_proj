'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import PageLayout from '@/components/PageLayout';
import ChatBotEditor from '@/components/ChatBotEditor';

interface ChatBot {
  id: number;
  name: string;
  description: string | null;
  api_key: string;
  model_id: string;
  system_prompt: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

const BotsPage = () => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<ChatBot | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [error, setError] = useState('');

  // Проверяем права доступа
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Загрузка списка ботов
  useEffect(() => {
    const fetchBots = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:8000/api/chat/bots/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setBots(data);
        } else {
          throw new Error('Не удалось загрузить список ботов');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке ботов');
      }
    };

    fetchBots();
  }, [token]);

  const handleDeleteBot = async (bot: ChatBot) => {
    if (!confirm(`Вы уверены, что хотите удалить бота "${bot.name}"?`)) return;

    try {
      const response = await fetch(`http://localhost:8000/api/chat/bots/${bot.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBots(prev => prev.filter(b => b.id !== bot.id));
      } else {
        throw new Error('Не удалось удалить бота');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при удалении бота');
    }
  };

  // Показываем загрузку или редирект
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <PageLayout title="Управление ботами">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Управление ботами">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        {/* Заголовок и кнопка создания */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Управление ботами</h1>
          <button
            onClick={() => {
              setSelectedBot(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать бота
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Список ботов */}
        <div className="space-y-4">
          {bots.map(bot => (
            <div
              key={bot.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bot.name}
                    {!bot.is_active && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                        Неактивен
                      </span>
                    )}
                  </h3>
                  {bot.description && (
                    <p className="mt-1 text-gray-600">{bot.description}</p>
                  )}
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>Модель: {bot.model_id}</p>
                    <p>Создан: {new Date(bot.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedBot(bot);
                      setIsEditorOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    title="Редактировать"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteBot(bot)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                    title="Удалить"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {bots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p>Пока нет ни одного бота</p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования */}
      <ChatBotEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        bot={selectedBot}
        onBotUpdated={async () => {
          // Перезагружаем список ботов
          try {
            const response = await fetch('http://localhost:8000/api/chat/bots/', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const data = await response.json();
              setBots(data);
            }
          } catch (error) {
            console.error('Error refreshing bots:', error);
          }
        }}
      />
    </PageLayout>
  );
};

export default BotsPage;
