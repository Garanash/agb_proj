import React from 'react';

interface AutomationBuilderProps {
  className?: string;
}

export const AutomationBuilder: React.FC<AutomationBuilderProps> = ({ className }) => {
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Automation Builder</h3>
      <p className="text-gray-600">Automation builder component placeholder</p>
    </div>
  );
};

export default AutomationBuilder;