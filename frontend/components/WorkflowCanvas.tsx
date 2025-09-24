'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  PlusIcon, 
  PlayIcon, 
  Square2StackIcon, 
  DocumentArrowDownIcon,
  TrashIcon,
  CogIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import WorkflowNode from './WorkflowNode';
import WorkflowConnection from './WorkflowConnection';
import NodeLibrary from './NodeLibrary';
import { WorkflowNodeData, WorkflowConnectionData } from './WorkflowTypes';

interface WorkflowCanvasProps {
  onSave?: (workflow: { nodes: WorkflowNodeData[], connections: WorkflowConnectionData[] }) => void;
  onExecute?: (workflow: { nodes: WorkflowNodeData[], connections: WorkflowConnectionData[] }) => void;
  initialNodes?: WorkflowNodeData[];
  initialConnections?: WorkflowConnectionData[];
}

export default function WorkflowCanvas({ 
  onSave, 
  onExecute, 
  initialNodes = [], 
  initialConnections = [] 
}: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNodeData[]>(initialNodes);
  const [connections, setConnections] = useState<WorkflowConnectionData[]>(initialConnections);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string, output: string } | null>(null);
  const [showNodeLibrary, setShowNodeLibrary] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [workflowName, setWorkflowName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<HTMLDivElement>(null);

  // Создание нового узла
  const createNode = useCallback((type: string, x: number, y: number) => {
    const nodeId = `node-${Date.now()}`;
    const newNode: WorkflowNodeData = {
      id: nodeId,
      type: type as any,
      name: getNodeName(type),
      x: x - canvasOffset.x,
      y: y - canvasOffset.y,
      config: getDefaultConfig(type),
      inputs: getNodeInputs(type),
      outputs: getNodeOutputs(type)
    };
    
    setNodes(prev => [...prev, newNode]);
    setShowNodeLibrary(false);
  }, [canvasOffset]);

  // Удаление узла
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    ));
    setSelectedNode(null);
  }, []);

  // Обновление узла
  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNodeData>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  // Начало соединения
  const startConnection = useCallback((nodeId: string, output: string) => {
    setIsConnecting(true);
    setConnectionStart({ nodeId, output });
  }, []);

  // Завершение соединения
  const endConnection = useCallback((nodeId: string, input: string) => {
    if (isConnecting && connectionStart && connectionStart.nodeId !== nodeId) {
      const connectionId = `conn-${Date.now()}`;
      const newConnection: WorkflowConnectionData = {
        id: connectionId,
        fromNodeId: connectionStart.nodeId,
        toNodeId: nodeId,
        fromOutput: connectionStart.output,
        toInput: input
      };
      
      setConnections(prev => [...prev, newConnection]);
    }
    
    setIsConnecting(false);
    setConnectionStart(null);
  }, [isConnecting, connectionStart]);

  // Удаление соединения
  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  // Обработка клика по холсту
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      setIsConnecting(false);
      setConnectionStart(null);
    }
  }, []);

  // Обработка двойного клика для создания узла
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setShowNodeLibrary(true);
    }
  }, []);

  // Обработка перетаскивания холста
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setCanvasOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Сохранение workflow
  const handleSave = useCallback(() => {
    if (nodes.length === 0) {
      alert('Добавьте хотя бы один узел для сохранения workflow');
      return;
    }
    setShowSaveDialog(true);
  }, [nodes.length]);

  // Подтверждение сохранения
  const handleConfirmSave = useCallback(() => {
    if (!workflowName.trim()) {
      alert('Введите название workflow');
      return;
    }
    
    if (onSave) {
      onSave({ 
        nodes, 
        connections
      });
    }
    
    setShowSaveDialog(false);
    setWorkflowName('');
  }, [nodes, connections, workflowName, onSave]);

  // Выполнение workflow
  const handleExecute = useCallback(() => {
    if (onExecute) {
      onExecute({ nodes, connections });
    }
  }, [nodes, connections, onExecute]);

  // Очистка холста
  const handleClear = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex h-full">
      {/* Панель инструментов */}
      <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Workflow Builder
          </h3>
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          <button
            onClick={() => setShowNodeLibrary(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Добавить узел
          </button>
          
          <div className="space-y-2">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Сохранить
            </button>
            
            <button
              onClick={handleExecute}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Запустить
            </button>
            
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Очистить
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div>Узлов: {nodes.length}</div>
            <div>Соединений: {connections.length}</div>
          </div>
        </div>
      </div>

      {/* Рабочая область */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full bg-gray-50 dark:bg-gray-900 relative cursor-grab active:cursor-grabbing"
          style={{
            backgroundImage: `
              radial-gradient(circle, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
          }}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Соединения */}
          <div className="absolute inset-0 pointer-events-none">
            {connections.map(connection => (
              <WorkflowConnection
                key={connection.id}
                connection={connection}
                nodes={nodes}
                onDelete={() => deleteConnection(connection.id)}
              />
            ))}
          </div>
          
          {/* Узлы */}
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isConnecting={isConnecting}
              connectionStart={connectionStart}
              onSelect={() => setSelectedNode(node.id)}
              onUpdate={(updates) => updateNode(node.id, updates)}
              onDelete={() => deleteNode(node.id)}
              onStartConnection={startConnection}
              onEndConnection={endConnection}
            />
          ))}
          
          {/* Инструкция */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <CogIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Создайте свой workflow</p>
                <p className="text-sm">Дважды кликните на холсте или нажмите "Добавить узел"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Библиотека узлов */}
      {showNodeLibrary && (
        <NodeLibrary
          onClose={() => setShowNodeLibrary(false)}
          onSelectNode={(type, x, y) => createNode(type, x, y)}
        />
      )}

      {/* Диалог сохранения */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Сохранить Workflow
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название workflow
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название workflow"
                  autoFocus
                />
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Узлов: {nodes.length} • Соединений: {connections.length}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Вспомогательные функции
function getNodeName(type: string): string {
  const names: Record<string, string> = {
    trigger: 'Триггер',
    action: 'Действие',
    condition: 'Условие',
    webhook: 'Webhook',
    email: 'Email',
    telegram: 'Telegram',
    database: 'База данных',
    delay: 'Задержка'
  };
  return names[type] || 'Узел';
}

function getDefaultConfig(type: string): Record<string, any> {
  const configs: Record<string, Record<string, any>> = {
    trigger: { event: 'user_action' },
    action: { service: 'notification' },
    condition: { field: 'status', operator: 'equals', value: 'active' },
    webhook: { url: '', method: 'POST' },
    email: { to: '', subject: '', body: '' },
    telegram: { chatId: '', message: '' },
    database: { operation: 'select', table: '' },
    delay: { duration: 1000, unit: 'ms' }
  };
  return configs[type] || {};
}

function getNodeInputs(type: string): string[] {
  const inputs: Record<string, string[]> = {
    trigger: [],
    action: ['input'],
    condition: ['input'],
    webhook: ['input'],
    email: ['input'],
    telegram: ['input'],
    database: ['input'],
    delay: ['input']
  };
  return inputs[type] || [];
}

function getNodeOutputs(type: string): string[] {
  const outputs: Record<string, string[]> = {
    trigger: ['output'],
    action: ['output'],
    condition: ['true', 'false'],
    webhook: ['output'],
    email: ['output'],
    telegram: ['output'],
    database: ['output'],
    delay: ['output']
  };
  return outputs[type] || [];
}
