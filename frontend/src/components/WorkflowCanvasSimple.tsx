import React from 'react';

interface WorkflowCanvasSimpleProps {
  className?: string;
}

export const WorkflowCanvasSimple: React.FC<WorkflowCanvasSimpleProps> = ({ className }) => {
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Workflow Canvas</h3>
      <p className="text-gray-600">Workflow canvas component placeholder</p>
    </div>
  );
};

export default WorkflowCanvasSimple;