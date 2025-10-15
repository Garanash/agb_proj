'use client';

import React, { useMemo } from 'react';
import { WorkflowNodeData, WorkflowConnectionData } from './WorkflowTypes';

interface WorkflowConnectionProps {
  connection: WorkflowConnectionData;
  nodes: WorkflowNodeData[];
  onDelete: () => void;
}

export default function WorkflowConnection({ 
  connection, 
  nodes, 
  onDelete 
}: WorkflowConnectionProps) {
  const { fromNode, toNode, fromPort, toPort } = useMemo(() => {
    const fromNode = nodes.find(node => node.id === connection.fromNodeId);
    const toNode = nodes.find(node => node.id === connection.toNodeId);
    
    if (!fromNode || !toNode) {
      return { fromNode: null, toNode: null, fromPort: null, toPort: null };
    }

    // Находим позиции портов
    const fromOutputIndex = fromNode.outputs.indexOf(connection.fromOutput);
    const toInputIndex = toNode.inputs.indexOf(connection.toInput);
    
    const fromPort = {
      x: fromNode.x + 192, // Правая сторона узла (192px ширина)
      y: fromNode.y + 60 + (fromOutputIndex * 20) // Центр узла + смещение по портам
    };
    
    const toPort = {
      x: toNode.x, // Левая сторона узла
      y: toNode.y + 60 + (toInputIndex * 20) // Центр узла + смещение по портам
    };

    return { fromNode, toNode, fromPort, toPort };
  }, [connection, nodes]);

  if (!fromNode || !toNode || !fromPort || !toPort) {
    return null;
  }

  // Вычисляем контрольные точки для кривой Безье
  const controlPoint1 = {
    x: fromPort.x + 50,
    y: fromPort.y
  };
  
  const controlPoint2 = {
    x: toPort.x - 50,
    y: toPort.y
  };

  // Создаем путь для кривой Безье
  const pathData = `M ${fromPort.x} ${fromPort.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${toPort.x} ${toPort.y}`;

  // Вычисляем позицию для лейбла
  const labelX = (fromPort.x + toPort.x) / 2;
  const labelY = (fromPort.y + toPort.y) / 2;

  return (
    <div className="absolute pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ 
          left: Math.min(fromPort.x, toPort.x) - 10,
          top: Math.min(fromPort.y, toPort.y) - 10,
          width: Math.abs(toPort.x - fromPort.x) + 20,
          height: Math.abs(toPort.y - fromPort.y) + 20
        }}
      >
        <defs>
          <marker
            id={`arrowhead-${connection.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
              className="hover:fill-blue-500 transition-colors"
            />
          </marker>
        </defs>
        
        {/* Основная линия соединения */}
        <path
          d={pathData}
          stroke="#6b7280"
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#arrowhead-${connection.id})`}
          className="hover:stroke-blue-500 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
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
            onDelete();
          }}
        />
      </svg>
      
      {/* Лейбл соединения */}
      <div
        className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-600 dark:text-gray-300 pointer-events-none"
        style={{
          left: labelX - 20,
          top: labelY - 10,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {connection.fromOutput} → {connection.toInput}
      </div>
    </div>
  );
}
