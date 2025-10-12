"use client";

import React, { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';

interface UploadDataProps {
  type: 'articles' | 'ved-passports';
}

const UploadDataModal: React.FC<UploadDataProps> = ({ type }) => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);

  const isArticles = type === 'articles';
  const endpoint = isArticles ? '/api/v1/data-upload' : '/api/v1/ved-passports-upload';
  const templateEndpoint = isArticles ? '/api/v1/data-upload/template' : '/api/v1/ved-passports-upload/ved-passports-template';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Пожалуйста, выберите файл CSV или Excel (.csv, .xlsx, .xls)');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);

      const response = await fetch(`${endpoint}/upload-${isArticles ? 'articles' : 'ved-passports'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult(result);
        setFile(null);
        setDescription('');
        // Сброс input файла
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.detail || 'Ошибка загрузки файла');
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert(`Ошибка загрузки файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(templateEndpoint);
      const result = await response.json();
      
      if (response.ok) {
        setTemplate(result.data);
        
        // Создаем CSV файл с шаблоном
        const csvContent = Object.keys(result.data.template)
          .map(key => `${key},${result.data.template[key]}`)
          .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `template_${isArticles ? 'articles' : 'ved_passports'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Ошибка получения шаблона:', error);
    }
  };

  const clearData = async () => {
    if (!confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const clearEndpoint = isArticles ? '/api/v1/data-upload/clear-data' : '/api/v1/ved-passports-upload/clear-ved-passports';
      
      const response = await fetch(clearEndpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Данные успешно очищены');
      } else {
        throw new Error(result.detail || 'Ошибка очистки данных');
      }
    } catch (error) {
      console.error('Ошибка очистки:', error);
      alert(`Ошибка очистки данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        📤 Загрузить данные {isArticles ? 'статей' : 'ВЭД паспортов'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Загрузка данных {isArticles ? 'статей для сопоставления' : 'ВЭД паспортов'}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Шаблон */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📋 Шаблон файла</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Скачайте шаблон файла для правильного формата данных
                </p>
                <button
                  onClick={downloadTemplate}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                >
                  📥 Скачать шаблон CSV
                </button>
              </div>

              {/* Загрузка файла */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите файл (CSV, Excel)
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <p className="text-sm text-green-600 mt-1">
                    ✅ Выбран файл: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание загрузки (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Введите описание загружаемых данных..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Результат загрузки */}
              {uploadResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Загрузка завершена</h4>
                  <div className="text-sm text-green-700">
                    <p>Загружено записей: {uploadResult.data?.uploaded_count}</p>
                    <p>Всего строк в файле: {uploadResult.data?.total_rows}</p>
                    {uploadResult.data?.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Ошибки:</p>
                        <ul className="list-disc list-inside">
                          {uploadResult.data.errors.slice(0, 5).map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isUploading ? '⏳ Загрузка...' : '📤 Загрузить файл'}
                </button>
                
                <button
                  onClick={clearData}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🗑️ Очистить данные
                </button>
              </div>

              {/* Инструкции */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Инструкции</h4>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">
                    <strong>Обязательные колонки:</strong> {isArticles ? 'article_name, description, category' : 'passport_number, company_name, product_name'}
                  </p>
                  <p className="mb-2">
                    <strong>Поддерживаемые форматы:</strong> CSV (.csv), Excel (.xlsx, .xls)
                  </p>
                  <p>
                    <strong>Кодировка:</strong> UTF-8 (для CSV файлов)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadDataModal;
