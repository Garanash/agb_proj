'use client';

import React, { useState } from 'react';
import { 
  PlayIcon,
  CogIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CircleStackIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NodeLibraryProps {
  onClose: () => void;
  onSelectNode: (type: string, x: number, y: number) => void;
}

interface NodeType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  category: string;
}

const nodeTypes: NodeType[] = [
  // Триггеры
  {
    id: 'trigger',
    name: 'Триггер',
    description: 'Запускает workflow при событии',
    icon: PlayIcon,
    color: 'bg-green-500',
    category: 'Триггеры'
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Получает данные через HTTP',
    icon: DocumentTextIcon,
    color: 'bg-purple-500',
    category: 'Триггеры'
  },
  
  // Действия
  {
    id: 'action',
    name: 'Действие',
    description: 'Выполняет какое-либо действие',
    icon: CogIcon,
    color: 'bg-blue-500',
    category: 'Действия'
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Отправляет email сообщение',
    icon: EnvelopeIcon,
    color: 'bg-indigo-500',
    category: 'Действия'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Отправляет сообщение в Telegram',
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-cyan-500',
    category: 'Действия'
  },
  {
    id: 'database',
    name: 'База данных',
    description: 'Работает с базой данных',
    icon: CircleStackIcon,
    color: 'bg-orange-500',
    category: 'Действия'
  },
  
  // Логика
  {
    id: 'condition',
    name: 'Условие',
    description: 'Проверяет условие и направляет поток',
    icon: ExclamationTriangleIcon,
    color: 'bg-yellow-500',
    category: 'Логика'
  },
  {
    id: 'delay',
    name: 'Задержка',
    description: 'Приостанавливает выполнение',
    icon: ClockIcon,
    color: 'bg-gray-500',
    category: 'Логика'
  }
];

export default function NodeLibrary({ onClose, onSelectNode }: NodeLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(nodeTypes.map(node => node.category)))];

  const filteredNodes = nodeTypes.filter(node => {
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleNodeSelect = (nodeType: NodeType) => {
    // Создаем узел в центре экрана
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    onSelectNode(nodeType.id, centerX, centerY);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Библиотека узлов
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Поиск и фильтры */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Поиск узлов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Категории */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category === 'all' ? 'Все' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Список узлов */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map(nodeType => (
              <div
                key={nodeType.id}
                onClick={() => handleNodeSelect(nodeType)}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 ${nodeType.color} rounded-lg flex items-center justify-center text-white`}>
                    <nodeType.icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {nodeType.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {nodeType.description}
                    </p>
                    <span className="inline-block mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {nodeType.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredNodes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Узлы не найдены. Попробуйте изменить поисковый запрос или категорию.
              </p>
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Найдено узлов: {filteredNodes.length}</span>
            <span>Кликните на узел, чтобы добавить его в workflow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
