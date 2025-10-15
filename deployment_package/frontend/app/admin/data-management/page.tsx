"use client";

import React, { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import AdminDataEntry from '@/src/components/features/admin/AdminDataEntry';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  CalendarIcon, 
  NewspaperIcon,
  IdentificationIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AdminDataManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('add');

  // Проверяем права администратора
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Только администраторы могут управлять данными системы
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'add', name: 'Добавление данных', icon: PlusIcon },
    { id: 'view', name: 'Просмотр данных', icon: EyeIcon },
    { id: 'edit', name: 'Редактирование', icon: PencilIcon },
    { id: 'delete', name: 'Удаление', icon: TrashIcon }
  ];

  const tableInfo = [
    {
      name: 'users',
      label: 'Пользователи',
      icon: UserIcon,
      description: 'Управление пользователями системы',
      color: 'bg-blue-500'
    },
    {
      name: 'departments',
      label: 'Отделы',
      icon: BuildingOfficeIcon,
      description: 'Организационная структура',
      color: 'bg-green-500'
    },
    {
      name: 'events',
      label: 'События',
      icon: CalendarIcon,
      description: 'Календарные события и встречи',
      color: 'bg-purple-500'
    },
    {
      name: 'news',
      label: 'Новости',
      icon: NewspaperIcon,
      description: 'Новости и объявления',
      color: 'bg-orange-500'
    },
    {
      name: 'company_employees',
      label: 'Сотрудники',
      icon: IdentificationIcon,
      description: 'Сотрудники компании',
      color: 'bg-indigo-500'
    },
    {
      name: 'ved_passports',
      label: 'ВЭД Паспорта',
      icon: DocumentTextIcon,
      description: 'Паспорта внешнеэкономической деятельности',
      color: 'bg-red-500'
    },
    {
      name: 'article_search_requests',
      label: 'Запросы поиска',
      icon: MagnifyingGlassIcon,
      description: 'Запросы поиска статей',
      color: 'bg-teal-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  👑 Управление данными
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Административная панель для управления всеми данными системы
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Администратор: {user.first_name} {user.last_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Вкладки */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ➕ Добавление данных
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Выберите таблицу и заполните форму для добавления новой записи
              </p>
              <AdminDataEntry />
            </div>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                👁️ Просмотр данных
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Обзор всех таблиц и их содержимого
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tableInfo.map((table) => {
                  const Icon = table.icon;
                  return (
                    <div
                      key={table.name}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${table.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {table.label}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {table.description}
                      </p>
                      <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        Просмотреть данные
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ✏️ Редактирование данных
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Функция редактирования записей (в разработке)
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      В разработке
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Функция редактирования записей будет добавлена в следующих версиях.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delete' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🗑️ Удаление данных
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Функция удаления записей (в разработке)
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      В разработке
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Функция удаления записей будет добавлена в следующих версиях.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDataManagement;
