'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  PlusIcon, 
  PlayIcon, 
  DocumentArrowDownIcon,
  TrashIcon,
  CogIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { WorkflowNodeData, WorkflowConnectionData, WorkflowData } from './WorkflowTypes';

interface WorkflowCanvasProps {
  onSave?: (workflow: WorkflowData) => void;
  onExecute?: (workflow: WorkflowData) => void;
  initialNodes?: WorkflowNodeData[];
  initialConnections?: WorkflowConnectionData[];
}

export default function WorkflowCanvasSimple({ 
  onSave, 
  onExecute, 
  initialNodes = [], 
  initialConnections = [] 
}: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNodeData[]>(initialNodes);
  const [connections, setConnections] = useState<WorkflowConnectionData[]>(initialConnections);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodeLibrary, setShowNodeLibrary] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string, output: string } | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [configuringNode, setConfiguringNode] = useState<WorkflowNodeData | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number, y: number } | null>(null);

  // Типы узлов для библиотеки
  const nodeTypes = [
    { id: 'trigger', name: 'Триггер', description: 'Запускает workflow при событии', color: 'bg-green-500' },
    { id: 'action', name: 'Действие', description: 'Выполняет какое-либо действие', color: 'bg-blue-500' },
    { id: 'condition', name: 'Условие', description: 'Проверяет условие и направляет поток', color: 'bg-yellow-500' },
    { id: 'webhook', name: 'Webhook', description: 'Получает данные через HTTP', color: 'bg-purple-500' },
    { id: 'email', name: 'Email', description: 'Отправляет email сообщение', color: 'bg-indigo-500' },
    { id: 'telegram', name: 'Telegram', description: 'Отправляет сообщение в Telegram', color: 'bg-cyan-500' },
    { id: 'database', name: 'База данных', description: 'Работает с базой данных', color: 'bg-orange-500' },
    { id: 'delay', name: 'Задержка', description: 'Приостанавливает выполнение', color: 'bg-gray-500' }
  ];
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [workflowName, setWorkflowName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);

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
      outputs: getNodeOutputs(type),
      color: getNodeColor(type)
    };
    
    setNodes(prev => [...prev, newNode]);
    setShowNodeLibrary(false);
  }, [canvasOffset]);

  // Создание узла в центре экрана
  const createNodeInCenter = useCallback((type: string) => {
    const centerX = 300; // Примерная позиция центра
    const centerY = 200;
    createNode(type, centerX, centerY);
  }, [createNode]);

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

  // Начало перетаскивания узла
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
    setDraggedNode(nodeId);
    setIsNodeDragging(true);
    setNodeDragStart({
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  // Перетаскивание узла
  const handleNodeMouseMove = useCallback((e: React.MouseEvent) => {
    if (isNodeDragging && draggedNode) {
      const deltaX = e.clientX - nodeDragStart.x;
      const deltaY = e.clientY - nodeDragStart.y;
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode 
          ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
          : node
      ));
      
      setNodeDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isNodeDragging, draggedNode, nodeDragStart]);

  // Окончание перетаскивания узла
  const handleNodeMouseUp = useCallback(() => {
    setIsNodeDragging(false);
    setDraggedNode(null);
  }, []);

  // Начало соединения
  const startConnection = useCallback((nodeId: string, output: string, e: React.MouseEvent) => {
    if (!isConnecting) {
      setIsConnecting(true);
      setConnectionStart({ nodeId, output });
      
      // Получаем позицию мыши относительно холста
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTempConnection({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  }, [isConnecting]);

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
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
    }
  }, [isConnecting, connectionStart]);

  // Отмена соединения
  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
  }, []);

  // Удаление соединения
  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  // Открытие конфигурации узла
  const openNodeConfig = useCallback((node: WorkflowNodeData) => {
    setConfiguringNode(node);
    setShowNodeConfig(true);
  }, []);

  // Сохранение конфигурации узла
  const saveNodeConfig = useCallback((updates: Partial<WorkflowNodeData>) => {
    if (configuringNode) {
      updateNode(configuringNode.id, updates);
      setShowNodeConfig(false);
      setConfiguringNode(null);
    }
  }, [configuringNode, updateNode]);

  // Обработка клика по холсту
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      if (isConnecting) {
        cancelConnection();
      }
    }
  }, [isConnecting, cancelConnection]);

  // Обработка двойного клика для создания узла
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createNode('trigger', x, y);
    }
  }, [createNode]);

  // Обработка перетаскивания холста
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !isNodeDragging && !isConnecting) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setCanvasOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isNodeDragging) {
      handleNodeMouseMove(e);
    } else if (isConnecting && tempConnection) {
      // Обновляем позицию временного соединения
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTempConnection({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  }, [isDragging, dragStart, isNodeDragging, handleNodeMouseMove, isConnecting, tempConnection]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    handleNodeMouseUp();
    
    // Не отменяем соединение автоматически - пусть пользователь кликнет на порт входа
  }, [handleNodeMouseUp]);

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
        connections,
        name: workflowName,
        id: `workflow-${Date.now()}`,
        createdAt: new Date().toISOString()
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
            onClick={() => createNodeInCenter('trigger')}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Добавить узел
          </button>
          
          <button
            onClick={() => setShowNodeLibrary(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Библиотека узлов
          </button>

          {/* Быстрые кнопки для создания узлов */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Быстрое добавление:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => createNodeInCenter('action')}
                className="px-3 py-2 text-xs font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Действие
              </button>
              <button
                onClick={() => createNodeInCenter('condition')}
                className="px-3 py-2 text-xs font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Условие
              </button>
              <button
                onClick={() => createNodeInCenter('email')}
                className="px-3 py-2 text-xs font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Email
              </button>
              <button
                onClick={() => createNodeInCenter('webhook')}
                className="px-3 py-2 text-xs font-medium rounded-md text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Webhook
              </button>
            </div>
          </div>
          
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
            {isConnecting && (
              <div className="mt-2 text-blue-600 dark:text-blue-400 font-medium">
                Режим соединения активен
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Рабочая область */}
      <div className="flex-1 relative overflow-hidden">
        {/* Бесконечный фон */}
        <div 
          className="absolute inset-0 bg-gray-50 dark:bg-gray-900"
          style={{
            backgroundImage: `
              radial-gradient(circle, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: `${canvasOffset.x % 20}px ${canvasOffset.y % 20}px`
          }}
        />
        

        {/* Холст с узлами */}
        <div
          ref={canvasRef}
          className="w-full h-full relative cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
            zIndex: 5
          }}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >

          {/* Постоянные соединения */}
          {connections.map(connection => {
            const fromNode = nodes.find(node => node.id === connection.fromNodeId);
            const toNode = nodes.find(node => node.id === connection.toNodeId);
            
            if (!fromNode || !toNode) return null;

            // Находим индекс порта выхода
            const fromOutputIndex = fromNode.outputs.indexOf(connection.fromOutput);
            const fromPort = {
              x: fromNode.x + 192 + 12, // Правая сторона узла + радиус порта (12px)
              y: fromNode.y + 60 + fromOutputIndex * 25 // Центр узла (60px) + смещение для порта
            };
            
            // Находим индекс порта входа
            const toInputIndex = toNode.inputs.indexOf(connection.toInput);
            const toPort = {
              x: toNode.x - 12, // Левая сторона узла - радиус порта (12px)
              y: toNode.y + 60 + toInputIndex * 25 // Центр узла (60px) + смещение для порта
            };

            // Вычисляем контрольные точки для кривой Безье
            const controlPoint1 = {
              x: fromPort.x + 50,
              y: fromPort.y
            };
            
            const controlPoint2 = {
              x: toPort.x - 50,
              y: toPort.y
            };

            // Вычисляем границы для SVG
            const minX = Math.min(fromPort.x, toPort.x) - 10;
            const minY = Math.min(fromPort.y, toPort.y) - 10;
            const maxX = Math.max(fromPort.x, toPort.x) + 10;
            const maxY = Math.max(fromPort.y, toPort.y) + 10;
            const width = maxX - minX;
            const height = maxY - minY;

            // Пересчитываем координаты относительно контейнера SVG
            const relativeFromPort = {
              x: fromPort.x - minX,
              y: fromPort.y - minY
            };
            
            const relativeToPort = {
              x: toPort.x - minX,
              y: toPort.y - minY
            };

            // Вычисляем контрольные точки для кривой Безье (относительно контейнера)
            const relativeControlPoint1 = {
              x: relativeFromPort.x + 50,
              y: relativeFromPort.y
            };
            
            const relativeControlPoint2 = {
              x: relativeToPort.x - 50,
              y: relativeToPort.y
            };

            // Создаем путь для кривой Безье (относительно контейнера)
            const pathData = `M ${relativeFromPort.x} ${relativeFromPort.y} C ${relativeControlPoint1.x} ${relativeControlPoint1.y}, ${relativeControlPoint2.x} ${relativeControlPoint2.y}, ${relativeToPort.x} ${relativeToPort.y}`;

            return (
              <div 
                key={connection.id} 
                className="absolute pointer-events-auto"
                style={{
                  left: minX,
                  top: minY,
                  width: width,
                  height: height,
                  zIndex: 10
                }}
              >
                <svg
                  width={width}
                  height={height}
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0
                  }}
                >
                  <path
                    d={pathData}
                    stroke="#6b7280"
                    strokeWidth="4"
                    fill="none"
                    className="hover:stroke-blue-500 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConnection(connection.id);
                    }}
                  />
                  
                  {/* Невидимая область для клика */}
                  <path
                    d={pathData}
                    stroke="transparent"
                    strokeWidth="20"
                    fill="none"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConnection(connection.id);
                    }}
                  />
                </svg>
              </div>
            );
          })}

          {/* Временное соединение */}
          {isConnecting && connectionStart && tempConnection && (
            <div className="absolute pointer-events-none" style={{ zIndex: 25 }}>
              {(() => {
                const fromNode = nodes.find(n => n.id === connectionStart.nodeId);
                if (!fromNode) return null;
                
                // Находим индекс порта выхода для временного соединения
                const fromOutputIndex = fromNode.outputs.indexOf(connectionStart.output);
                const fromPort = {
                  x: fromNode.x + 192 + 12,
                  y: fromNode.y + 60 + fromOutputIndex * 25
                };
                
                const toPort = {
                  x: tempConnection.x - canvasOffset.x,
                  y: tempConnection.y - canvasOffset.y
                };
                
                const minX = Math.min(fromPort.x, toPort.x) - 10;
                const minY = Math.min(fromPort.y, toPort.y) - 10;
                const maxX = Math.max(fromPort.x, toPort.x) + 10;
                const maxY = Math.max(fromPort.y, toPort.y) + 10;
                const width = maxX - minX;
                const height = maxY - minY;
                
                const relativeFromPort = {
                  x: fromPort.x - minX,
                  y: fromPort.y - minY
                };
                
                const relativeToPort = {
                  x: toPort.x - minX,
                  y: toPort.y - minY
                };
                
                return (
                  <div
                    style={{
                      left: minX,
                      top: minY,
                      width: width,
                      height: height,
                      position: 'absolute'
                    }}
                  >
                    <svg
                      width={width}
                      height={height}
                      style={{ 
                        position: 'absolute',
                        left: 0,
                        top: 0
                      }}
                    >
                      <path
                        d={`M ${relativeFromPort.x} ${relativeFromPort.y} L ${relativeToPort.x} ${relativeToPort.y}`}
                        stroke="#3b82f6"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                      />
                    </svg>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Узлы */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute w-48 bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg cursor-move select-none ${
                selectedNode === node.id 
                  ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-900' 
                  : 'border-gray-300 dark:border-gray-600'
              } ${isNodeDragging && draggedNode === node.id ? 'z-40' : ''}`}
              style={{ 
                left: node.x, 
                top: node.y,
                zIndex: 5
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(node.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openNodeConfig(node);
              }}
            >
              <div className={`flex items-center justify-between p-3 rounded-t-lg ${node.color || 'bg-blue-500'} text-white`}>
                <div className="flex items-center space-x-2">
                  <CogIcon className="h-5 w-5" />
                  <span className="font-medium text-sm">{node.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Тип: {node.type}
                </div>
              </div>

              {/* Порты входа */}
              {node.inputs.length > 0 && (
                <div className="absolute left-0 -translate-x-3" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                  {node.inputs.map((input, index) => (
                    <div
                      key={input}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                        isConnecting && connectionStart && connectionStart.nodeId !== node.id
                          ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50'
                          : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-blue-500 hover:shadow-md'
                      }`}
                      style={{ 
                        marginTop: `${index * 25}px`,
                        zIndex: 30
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConnecting) {
                          endConnection(node.id, input);
                        }
                      }}
                      onMouseEnter={() => {
                        if (isConnecting && connectionStart && connectionStart.nodeId !== node.id) {
                          // Подсвечиваем порт входа при наведении во время соединения
                        }
                      }}
                      title={`Вход: ${input}`}
                    >
                      <div className="w-full h-full rounded-full bg-gray-300 dark:bg-gray-600 m-0.5"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Порты выхода */}
              {node.outputs.length > 0 && (
                <div className="absolute right-0 translate-x-3" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                  {node.outputs.map((output, index) => (
                    <div
                      key={output}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                        isConnecting && connectionStart && connectionStart.nodeId === node.id && connectionStart.output === output
                          ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50'
                          : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-blue-500 hover:shadow-md'
                      }`}
                      style={{ 
                        marginTop: `${index * 25}px`,
                        zIndex: 30
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startConnection(node.id, output, e);
                      }}
                      title={`Выход: ${output}`}
                    >
                      <div className="w-full h-full rounded-full bg-gray-300 dark:bg-gray-600 m-0.5"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Инструкция */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <CogIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Создайте свой workflow</p>
                <div className="text-sm space-y-1">
                  <p>• Дважды кликните на холсте для создания узла</p>
                  <p>• Используйте кнопку "Добавить узел" для быстрого создания</p>
                  <p>• Откройте "Библиотеку узлов" для выбора типа</p>
                  <p>• Дважды кликните на узел для настройки (название, цвет)</p>
                  <p>• Перетаскивайте узлы для перемещения</p>
                  <p>• Кликните на порт выхода (правый кружок), затем на порт входа (левый кружок)</p>
                  <p>• Кликните на холст для отмены соединения</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Библиотека узлов */}
      {showNodeLibrary && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] mx-4">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Библиотека узлов
              </h2>
              <button
                onClick={() => setShowNodeLibrary(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Список узлов */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodeTypes.map(nodeType => (
                  <div
                    key={nodeType.id}
                    onClick={() => createNodeInCenter(nodeType.id)}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-10 h-10 ${nodeType.color} rounded-lg flex items-center justify-center text-white`}>
                        <CogIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {nodeType.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {nodeType.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Подвал */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Доступно узлов: {nodeTypes.length}</span>
                <span>Кликните на узел, чтобы добавить его в workflow</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Конфигурация узла */}
      {showNodeConfig && configuringNode && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Настройка узла
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название узла
                </label>
                <input
                  type="text"
                  value={configuringNode.name}
                  onChange={(e) => setConfiguringNode({...configuringNode, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Цвет узла
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Зеленый', value: 'bg-green-500' },
                    { name: 'Синий', value: 'bg-blue-500' },
                    { name: 'Желтый', value: 'bg-yellow-500' },
                    { name: 'Фиолетовый', value: 'bg-purple-500' },
                    { name: 'Индиго', value: 'bg-indigo-500' },
                    { name: 'Голубой', value: 'bg-cyan-500' },
                    { name: 'Оранжевый', value: 'bg-orange-500' },
                    { name: 'Серый', value: 'bg-gray-500' },
                    { name: 'Красный', value: 'bg-red-500' },
                    { name: 'Розовый', value: 'bg-pink-500' },
                    { name: 'Лайм', value: 'bg-lime-500' },
                    { name: 'Теал', value: 'bg-teal-500' }
                  ].map(color => (
                    <button
                      key={color.value}
                      onClick={() => setConfiguringNode({...configuringNode, color: color.value})}
                      className={`w-12 h-12 rounded-lg border-2 ${
                        configuringNode.color === color.value 
                          ? 'border-gray-900 dark:border-gray-100' 
                          : 'border-gray-300 dark:border-gray-600'
                      } ${color.value} hover:opacity-80 transition-opacity`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Тип узла
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {configuringNode.type}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNodeConfig(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Отмена
              </button>
              <button
                onClick={() => saveNodeConfig(configuringNode)}
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

function getNodeColor(type: string): string {
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
  return colors[type] || 'bg-blue-500';
}
