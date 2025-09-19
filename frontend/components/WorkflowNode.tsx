'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  CogIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  DatabaseIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { WorkflowNodeData } from './WorkflowTypes';

interface WorkflowNodeProps {
  node: WorkflowNodeData;
  isSelected: boolean;
  isConnecting: boolean;
  connectionStart: { nodeId: string, output: string } | null;
  onSelect: () => void;
  onUpdate: (updates: Partial<WorkflowNodeData>) => void;
  onDelete: () => void;
  onStartConnection: (nodeId: string, output: string) => void;
  onEndConnection: (nodeId: string, input: string) => void;
}

export default function WorkflowNode({
  node,
  isSelected,
  isConnecting,
  connectionStart,
  onSelect,
  onUpdate,
  onDelete,
  onStartConnection,
  onEndConnection
}: WorkflowNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showConfig, setShowConfig] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Получение иконки для типа узла
  const getNodeIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      trigger: PlayIcon,
      action: CogIcon,
      condition: ExclamationTriangleIcon,
      webhook: DocumentTextIcon,
      email: EnvelopeIcon,
      telegram: ChatBubbleLeftRightIcon,
      database: DatabaseIcon,
      delay: ClockIcon
    };
    const IconComponent = icons[type] || CogIcon;
    return <IconComponent className="h-5 w-5" />;
  };

  // Получение цвета для типа узла
  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      trigger: 'bg-green-500',
      action: 'bg-blue-500',
      condition: 'bg-yellow-500',
      webhook: 'bg-purple-500',
      email: 'bg-indigo-500',
      telegram: 'bg-cyan-500',
      database: 'bg-orange-500',
      delay: 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  // Обработка начала перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  }, [node.x, node.y, onSelect]);

  // Обработка перетаскивания
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onUpdate({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, onUpdate]);

  // Обработка окончания перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Обработка клика по порту выхода
  const handleOutputClick = useCallback((output: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection(node.id, output);
  }, [node.id, onStartConnection]);

  // Обработка клика по порту входа
  const handleInputClick = useCallback((input: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnecting && connectionStart && connectionStart.nodeId !== node.id) {
      onEndConnection(node.id, input);
    }
  }, [isConnecting, connectionStart, node.id, onEndConnection]);

  // Обработка двойного клика для настройки
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfig(true);
  }, []);

  // Обработка удаления
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  // Обработка изменения имени
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
  }, [onUpdate]);

  return (
    <>
      <div
        ref={nodeRef}
        className={`absolute w-48 bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg cursor-move select-none ${
          isSelected 
            ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-900' 
            : 'border-gray-300 dark:border-gray-600'
        } ${isConnecting ? 'ring-2 ring-blue-300 dark:ring-blue-700' : ''}`}
        style={{ left: node.x, top: node.y }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Заголовок узла */}
        <div className={`flex items-center justify-between p-3 rounded-t-lg ${getNodeColor(node.type)} text-white`}>
          <div className="flex items-center space-x-2">
            {getNodeIcon(node.type)}
            <span className="font-medium text-sm">{node.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Удалить узел"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Тело узла */}
        <div className="p-3">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Название
              </label>
              <input
                type="text"
                value={node.name}
                onChange={handleNameChange}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Тип: {node.type}
            </div>
          </div>
        </div>

        {/* Порты входа */}
        {node.inputs.length > 0 && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
            {node.inputs.map((input, index) => (
              <div
                key={input}
                className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors ${
                  isConnecting && connectionStart && connectionStart.nodeId !== node.id
                    ? 'bg-blue-500 border-blue-500 hover:bg-blue-600'
                    : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-blue-500'
                }`}
                style={{ marginTop: `${index * 20}px` }}
                onClick={(e) => handleInputClick(input, e)}
                title={`Вход: ${input}`}
              />
            ))}
          </div>
        )}

        {/* Порты выхода */}
        {node.outputs.length > 0 && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2">
            {node.outputs.map((output, index) => (
              <div
                key={output}
                className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors ${
                  isConnecting && connectionStart && connectionStart.nodeId === node.id && connectionStart.output === output
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-blue-500'
                }`}
                style={{ marginTop: `${index * 20}px` }}
                onClick={(e) => handleOutputClick(output, e)}
                title={`Выход: ${output}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно конфигурации */}
      {showConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Настройка узла
              </h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название узла
                </label>
                <input
                  type="text"
                  value={node.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Тип узла
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {node.type}
                </div>
              </div>
              
              {/* Дополнительные настройки в зависимости от типа узла */}
              {node.type === 'webhook' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={node.config.url || ''}
                    onChange={(e) => onUpdate({ 
                      config: { ...node.config, url: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="https://example.com/webhook"
                  />
                </div>
              )}
              
              {node.type === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Получатель
                    </label>
                    <input
                      type="email"
                      value={node.config.to || ''}
                      onChange={(e) => onUpdate({ 
                        config: { ...node.config, to: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Тема
                    </label>
                    <input
                      type="text"
                      value={node.config.subject || ''}
                      onChange={(e) => onUpdate({ 
                        config: { ...node.config, subject: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Тема письма"
                    />
                  </div>
                </div>
              )}
              
              {node.type === 'delay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Задержка (мс)
                  </label>
                  <input
                    type="number"
                    value={node.config.duration || 1000}
                    onChange={(e) => onUpdate({ 
                      config: { ...node.config, duration: parseInt(e.target.value) || 1000 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
