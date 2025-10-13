import React from 'react';

interface ExcelRow {
  id: string;
  наименование: string;
  запрашиваемый_артикул: string;
  количество: number;
  единица_измерения: string;
  [key: string]: any;
}

interface ExcelDataTableProps {
  className?: string;
  data?: ExcelRow[];
  onDataChange?: (data: ExcelRow[]) => void;
  onAutoMatch?: () => Promise<void>;
  onSave?: () => Promise<void>;
  isMatching?: boolean;
  isSaving?: boolean;
  savedVariants?: any;
  onSaveVariant?: (rowId: string, variantIndex: number) => Promise<void>;
  onSaveConfirmedMatch?: (rowData: ExcelRow, variant: any) => Promise<void>;
}

export const ExcelDataTable: React.FC<ExcelDataTableProps> = ({ 
  className = '',
  data = [],
  onDataChange,
  onAutoMatch,
  onSave,
  isMatching = false,
  isSaving = false,
  savedVariants = {},
  onSaveVariant,
  onSaveConfirmedMatch
}) => {
  const handleAutoMatch = async () => {
    if (onAutoMatch) {
      await onAutoMatch();
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Excel Data Table</h3>
        <div className="space-x-2">
          <button 
            onClick={handleAutoMatch}
            disabled={isMatching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isMatching ? 'Сопоставление...' : 'Автосопоставление'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Данные</th>
              <th className="border border-gray-300 px-4 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row, index) => (
              <tr key={row.id || index}>
                <td className="border border-gray-300 px-4 py-2">{row.id}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {JSON.stringify(row).substring(0, 50)}...
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <button className="text-blue-500 hover:text-blue-700">
                    Редактировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 5 && (
          <p className="text-sm text-gray-500 mt-2">
            Показано 5 из {data.length} записей
          </p>
        )}
      </div>
    </div>
  );
};

export default ExcelDataTable;