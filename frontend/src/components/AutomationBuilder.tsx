import React from 'react';

interface AutomationBuilderProps {
  className?: string;
  onSave?: (automation: any) => void;
  onCancel?: () => void;
}

export const AutomationBuilder: React.FC<AutomationBuilderProps> = ({ 
  className = '',
  onSave,
  onCancel
}) => {
  const handleSave = () => {
    if (onSave) {
      onSave({ name: 'New Automation', steps: [] });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Automation Builder</h3>
        <div className="space-x-2">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Сохранить
          </button>
          <button 
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
        </div>
      </div>
      <p className="text-gray-600">Automation builder component placeholder</p>
    </div>
  );
};

export default AutomationBuilder;