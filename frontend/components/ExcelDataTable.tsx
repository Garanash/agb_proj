import React from 'react';

interface ExcelDataTableProps {
  className?: string;
}

export const ExcelDataTable: React.FC<ExcelDataTableProps> = ({ className }) => {
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Excel Data Table</h3>
      <p className="text-gray-600">Excel data table component placeholder</p>
    </div>
  );
};

export default ExcelDataTable;