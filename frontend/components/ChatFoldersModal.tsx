'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ChatFolder {
  id: number;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string | null;
}

interface ChatFoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  onFolderSelected: (folderId: number) => void;
}

const ChatFoldersModal: React.FC<ChatFoldersModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onFolderSelected
}) => {
  const { token } = useAuth();
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Загрузка папок
  useEffect(() => {
    const fetchFolders = async () => {
      if (!token || !isOpen) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await fetch('http://localhost:8000/api/chat/folders/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFolders(data);
        } else {
          throw new Error('Не удалось загрузить папки');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке папок');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolders();
  }, [token, isOpen]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/chat/folders/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          order_index: folders.length
        })
      });

      if (response.ok) {
        const newFolder = await response.json();
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
      } else {
        throw new Error('Не удалось создать папку');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при создании папки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFolder = async (folderId: number) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8000/api/chat/folders/${folderId}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: roomId
        })
      });

      if (response.ok) {
        onFolderSelected(folderId);
        onClose();
      } else {
        throw new Error('Не удалось добавить чат в папку');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при добавлении чата в папку');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Добавить чат в папку
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

          {/* Создание новой папки */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Создать новую папку</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Название папки"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreateFolder}
                disabled={isLoading || !newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Создать
              </button>
            </div>
          </div>

          {/* Список папок */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Выберите папку</h4>
            <div className="space-y-2">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleSelectFolder(folder.id)}
                  disabled={isLoading}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">📁</span>
                    <span>{folder.name}</span>
                  </div>
                </button>
              ))}
              {folders.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 py-4">
                  У вас пока нет папок
                </p>
              )}
              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatFoldersModal;
