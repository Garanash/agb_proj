"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';

interface TableField {
  name: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'boolean';
  label: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  description?: string;
}

interface TableConfig {
  name: string;
  label: string;
  endpoint: string;
  fields: TableField[];
}

const AdminDataEntry: React.FC = () => {
  const { token } = useAuth();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Конфигурация таблиц
  const tableConfigs: TableConfig[] = [
    {
      name: 'users',
      label: '👥 Пользователи',
      endpoint: '/api/v1/admin/users',
      fields: [
        { name: 'username', type: 'text', label: 'Имя пользователя', required: true, placeholder: 'user123' },
        { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'user@example.com' },
        { name: 'password', type: 'password', label: 'Пароль', required: true, placeholder: 'password123' },
        { name: 'first_name', type: 'text', label: 'Имя', placeholder: 'Иван' },
        { name: 'last_name', type: 'text', label: 'Фамилия', placeholder: 'Иванов' },
        { name: 'role', type: 'select', label: 'Роль', required: true, options: [
          { value: 'admin', label: 'Администратор' },
          { value: 'manager', label: 'Менеджер' },
          { value: 'employee', label: 'Сотрудник' },
          { value: 'user', label: 'Пользователь' },
          { value: 'ved_passport', label: 'ВЭД Паспорт' }
        ]},
        { name: 'department_id', type: 'number', label: 'ID отдела', placeholder: '1' },
        { name: 'is_active', type: 'boolean', label: 'Активен', required: true }
      ]
    },
    {
      name: 'departments',
      label: '🏢 Отделы',
      endpoint: '/api/v1/admin/departments',
      fields: [
        { name: 'name', type: 'text', label: 'Название отдела', required: true, placeholder: 'IT отдел' },
        { name: 'description', type: 'textarea', label: 'Описание', placeholder: 'Описание отдела' },
        { name: 'manager_id', type: 'number', label: 'ID менеджера', placeholder: '1' }
      ]
    },
    {
      name: 'events',
      label: '📅 События',
      endpoint: '/api/v1/admin/events',
      fields: [
        { name: 'title', type: 'text', label: 'Название события', required: true, placeholder: 'Встреча команды' },
        { name: 'description', type: 'textarea', label: 'Описание', placeholder: 'Описание события' },
        { name: 'start_date', type: 'date', label: 'Дата начала', required: true },
        { name: 'end_date', type: 'date', label: 'Дата окончания', required: true },
        { name: 'event_type', type: 'select', label: 'Тип события', required: true, options: [
          { value: 'meeting', label: 'Встреча' },
          { value: 'conference', label: 'Конференция' },
          { value: 'training', label: 'Обучение' },
          { value: 'other', label: 'Другое' }
        ]},
        { name: 'is_public', type: 'boolean', label: 'Публичное событие', required: true },
        { name: 'organizer_id', type: 'number', label: 'ID организатора', required: true, placeholder: '1' }
      ]
    },
    {
      name: 'news',
      label: '📰 Новости',
      endpoint: '/api/v1/admin/news',
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок', required: true, placeholder: 'Заголовок новости' },
        { name: 'content', type: 'textarea', label: 'Содержание', required: true, placeholder: 'Содержание новости' },
        { name: 'author_id', type: 'number', label: 'ID автора', required: true, placeholder: '1' },
        { name: 'is_published', type: 'boolean', label: 'Опубликовано', required: true }
      ]
    },
    {
      name: 'company_employees',
      label: '👨‍💼 Сотрудники компании',
      endpoint: '/api/v1/admin/company-employees',
      fields: [
        { name: 'name', type: 'text', label: 'Полное имя', required: true, placeholder: 'Иван Иванов Петрович', description: 'Введите полное имя (имя фамилия отчество)' },
        { name: 'position', type: 'text', label: 'Должность', required: true, placeholder: 'Менеджер' },
        { name: 'department_id', type: 'number', label: 'ID отдела', placeholder: '1', description: 'ID отдела из таблицы departments' },
        { name: 'email', type: 'email', label: 'Email', placeholder: 'ivan@company.com' },
        { name: 'phone', type: 'text', label: 'Телефон', placeholder: '+7 (999) 123-45-67' }
      ]
    },
    {
      name: 'ved_passports',
      label: '📋 ВЭД Паспорта',
      endpoint: '/api/v1/admin/ved-passports',
      fields: [
        { name: 'passport_number', type: 'text', label: 'Номер паспорта', required: true, placeholder: 'VED-2024-001' },
        { name: 'order_number', type: 'text', label: 'Номер заказа', required: true, placeholder: 'ORD-2024-001' },
        { name: 'title', type: 'text', label: 'Название', placeholder: 'Название паспорта' },
        { name: 'description', type: 'textarea', label: 'Описание', placeholder: 'Описание паспорта' },
        { name: 'quantity', type: 'number', label: 'Количество', required: true, placeholder: '1' },
        { name: 'status', type: 'select', label: 'Статус', required: true, options: [
          { value: 'active', label: 'Активный' },
          { value: 'archived', label: 'Архивный' },
          { value: 'draft', label: 'Черновик' }
        ]},
        { name: 'nomenclature_id', type: 'number', label: 'ID номенклатуры', required: true, placeholder: '1' },
        { name: 'created_by', type: 'number', label: 'ID создателя', required: true, placeholder: '1' }
      ]
    },
    {
      name: 'article_search_requests',
      label: '🔍 Запросы поиска статей',
      endpoint: '/api/v1/admin/article-search-requests',
      fields: [
        { name: 'search_query', type: 'text', label: 'Поисковый запрос', required: true, placeholder: 'AGB-001' },
        { name: 'search_type', type: 'select', label: 'Тип поиска', required: true, options: [
          { value: 'article', label: 'Статья' },
          { value: 'supplier', label: 'Поставщик' },
          { value: 'category', label: 'Категория' }
        ]},
        { name: 'status', type: 'select', label: 'Статус', required: true, options: [
          { value: 'pending', label: 'В ожидании' },
          { value: 'processing', label: 'В обработке' },
          { value: 'completed', label: 'Завершен' },
          { value: 'failed', label: 'Ошибка' }
        ]},
        { name: 'user_id', type: 'number', label: 'ID пользователя', required: true, placeholder: '1' }
      ]
    }
  ];

  const selectedConfig = tableConfigs.find(config => config.name === selectedTable);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedConfig) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(selectedConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: 'Запись успешно добавлена', data });
        setFormData({});
      } else {
        throw new Error(data.detail || 'Ошибка добавления записи');
      }
    } catch (error) {
      console.error('Ошибка добавления:', error);
      setResult({ success: false, message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: TableField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Выберите...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Выберите...</option>
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        ➕ Добавить данные
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Добавление данных в таблицы</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Выбор таблицы */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите таблицу:
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => {
                    setSelectedTable(e.target.value);
                    setFormData({});
                    setResult(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите таблицу...</option>
                  {tableConfigs.map(config => (
                    <option key={config.name} value={config.name}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Форма для выбранной таблицы */}
              {selectedConfig && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">{selectedConfig.label}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedConfig.fields.map(field => (
                        <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderField(field)}
                          {field.description && (
                            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {isSubmitting ? '⏳ Добавление...' : '➕ Добавить запись'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Результат */}
              {result && (
                <div className={`border rounded-lg p-4 ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`font-semibold ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? '✅ Успешно' : '❌ Ошибка'}
                  </div>
                  <div className={`text-sm mt-1 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </div>
                  {result.data && (
                    <div className="text-xs text-gray-600 mt-2">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Инструкции */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Инструкции</h4>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">
                    <strong>Обязательные поля</strong> помечены красной звездочкой (*)
                  </p>
                  <p className="mb-2">
                    <strong>Типы полей:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Текст/Email/Пароль:</strong> обычные текстовые поля</li>
                    <li><strong>Число:</strong> числовые значения</li>
                    <li><strong>Выбор:</strong> выпадающий список</li>
                    <li><strong>Текстовая область:</strong> многострочный текст</li>
                    <li><strong>Дата:</strong> выбор даты</li>
                    <li><strong>Да/Нет:</strong> булево значение</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDataEntry;
