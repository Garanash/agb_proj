'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/api';
import { useAuth } from './AuthContext';

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

interface ChatBotEditorProps {
  isOpen: boolean;
  onClose: () => void;
  bot: ChatBot | null;
  onBotUpdated: () => void;
}

const ChatBotEditor: React.FC<ChatBotEditorProps> = ({
  isOpen,
  onClose,
  bot,
  onBotUpdated
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    api_key: '',
    model_id: 'gpt-3.5-turbo',
    system_prompt: '',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Заполняем форму данными бота при открытии
  useEffect(() => {
    if (bot && isOpen) {
      setFormData({
        name: bot.name,
        description: bot.description || '',
        api_key: bot.api_key,
        model_id: bot.model_id,
        system_prompt: bot.system_prompt || '',
        is_active: bot.is_active
      });
      setError('');
    }
  }, [bot, isOpen]);

  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as any).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const url = bot
        ? `${getApiUrl()}/api/v1/chat/bots/${bot.id}`
        : `${getApiUrl()}/api/v1/chat/bots/`;
      const method = bot ? 'PUT' : 'POST';

      const response: any = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          api_key: formData.api_key,
          model_id: formData.model_id,
          system_prompt: formData.system_prompt || null,
          is_active: formData.is_active
        })
      });

      if (response.status >= 200 && response.status < 300) {
        onBotUpdated();
        onClose();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Произошла ошибка при сохранении бота');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при сохранении бота');
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
              {bot ? 'Редактировать бота' : 'Создать нового бота'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя бота *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите имя бота"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите описание бота (необязательно)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API ключ *
              </label>
              <input
                type="text"
                name="api_key"
                value={formData.api_key}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите API ключ VseGPT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Модель *
              </label>
              <select
                name="model_id"
                value={formData.model_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Системный промпт
              </label>
              <textarea
                name="system_prompt"
                value={formData.system_prompt}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите системный промпт для бота (необязательно)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Бот активен
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type={"button" as const}
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Отменить
            </button>
            <button
              type={"submit" as const}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Сохранение...' : bot ? 'Сохранить изменения' : 'Создать бота'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBotEditor;
