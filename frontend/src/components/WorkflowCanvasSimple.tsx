import React, { useState, useCallback } from 'react';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
}

interface WorkflowCanvasSimpleProps {
  className?: string;
  initialNodes?: WorkflowNode[];
  initialConnections?: WorkflowConnection[];
  onSave?: (workflow: { nodes: WorkflowNode[]; connections: WorkflowConnection[] }) => void;
  onExecute?: (workflow: { nodes: WorkflowNode[]; connections: WorkflowConnection[] }) => void;
}

export const WorkflowCanvasSimple: React.FC<WorkflowCanvasSimpleProps> = ({ 
  className = '',
  initialNodes = [],
  initialConnections = [],
  onSave,
  onExecute
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] = useState<WorkflowConnection[]>(initialConnections);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ nodes, connections });
    }
  }, [nodes, connections, onSave]);

  const handleExecute = useCallback(() => {
    if (onExecute) {
      onExecute({ nodes, connections });
    }
  }, [nodes, connections, onExecute]);

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Workflow Canvas</h3>
        <div className="space-x-2">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Сохранить
          </button>
          <button 
            onClick={handleExecute}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Выполнить
          </button>
        </div>
      </div>
      
      <div className="min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg p-4">
        <p className="text-gray-600 text-center">
          Workflow canvas component placeholder
        </p>
        <p className="text-sm text-gray-500 text-center mt-2">
          Узлов: {nodes.length}, Соединений: {connections.length}
        </p>
      </div>
    </div>
  );
};

export default WorkflowCanvasSimple;