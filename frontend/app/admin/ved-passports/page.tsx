'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { PageLayout } from '@/components/layout';
import Link from 'next/link';
import NomenclatureManagement from '@/components/NomenclatureManagement';

interface VedPassport {
  id: number;
  passport_number: string;
  title: string;
  description?: string;
  status: string;
  order_number: string;
  quantity: number;
  nomenclature_id: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
  nomenclature?: {
    id: number;
    code_1c: string;
    name: string;
    article: string;
    matrix: string;
    drilling_depth?: string;
    height?: string;
    thread?: string;
    product_type: string;
    is_active: boolean;
  };
  creator?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

interface FilterOptions {
  product_types: string[];
  matrices: string[];
  statuses: string[];
  creators: Array<{ id: number; name: string }>;
}

const AdminVEDPassportsPage = () => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [passports, setPassports] = useState<VedPassport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'nomenclature' | 'archive'>('archive');
  const [filters, setFilters] = useState({
    search: '',
    product_type: '',
    matrix: '',
    status: '',
    date_from: '',
    date_to: '',
    order_number: '',
    code_1c: '',
    created_by: ''
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    product_types: [],
    matrices: [],
    statuses: [],
    creators: []
  });

  // Проверяем права доступа
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Загрузка фильтров
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!token) return;
      
      try {
        const apiUrl = getApiUrl();
        const response: any = await fetch(`${apiUrl}/api/v1/ved-passports/archive/filters`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status >= 200 && response.status < 300) {
          const data = await response.json();
          setFilterOptions({
            product_types: data.product_types || [],
            matrices: data.matrices || [],
            statuses: data.statuses || [],
            creators: [] // Будет заполнено отдельно
          });
        }
      } catch (error) {
        console.error('Ошибка при загрузке фильтров:', error);
      }
    };

    fetchFilterOptions();
  }, [token]);

  // Загрузка паспортов
  const fetchPassports = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      
      // Всегда загружаем архив с фильтрами
      const endpoint = '/api/v1/ved-passports/admin/archive/';
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response: any = await fetch(`${apiUrl}${endpoint}?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status >= 200 && response.status < 300) {
          const data = await response.json();
          setPassports(data);
        } else {
          throw new Error('Не удалось загрузить паспорта ВЭД');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке паспортов');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchPassports();
  }, [token, activeTab, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      product_type: '',
      matrix: '',
      status: '',
      date_from: '',
      date_to: '',
      order_number: '',
      code_1c: '',
      created_by: ''
    });
  };

  // Экспорт в Excel
  const exportToExcel = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${apiUrl}/api/v1/ved-passports/admin/archive/export/excel?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ved_passports_archive_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Ошибка при экспорте в Excel');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при экспорте в Excel');
    } finally {
      setLoading(false);
    }
  };

  // Экспорт в PDF
  const exportToPDF = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${apiUrl}/api/v1/ved-passports/admin/archive/export/pdf?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ved_passports_archive_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Ошибка при экспорте в PDF');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при экспорте в PDF');
    } finally {
      setLoading(false);
    }
  };

  // Показываем загрузку или редирект
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <PageLayout title="Паспорта ВЭД">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': { text: 'Активен', class: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' },
      'archived': { text: 'Архив', class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
      'draft': { text: 'Черновик', class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <PageLayout title="Паспорта ВЭД">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Заголовок и навигация */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Паспорта ВЭД</h1>
          
          {/* Табы */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('nomenclature')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nomenclature'
                    ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Управление номенклатурами
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'archive'
                    ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Архив
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Контент табов */}

        {activeTab === 'nomenclature' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Управление номенклатурами</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Управление номенклатурами для создания паспортов ВЭД. Добавляйте, редактируйте и удаляйте номенклатуры.
              </p>
            </div>
            
            <div className="mb-6">
              <Link
                href="/ved-passports/create"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Создать паспорт
              </Link>
            </div>
            
            <NomenclatureManagement />
          </div>
        )}

        {activeTab === 'archive' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Архив паспортов ВЭД</h2>
              <p className="text-gray-600 dark:text-gray-400">Просмотр и управление всеми паспортами ВЭД в системе с расширенными фильтрами</p>
            </div>
            
            {/* Фильтры */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Фильтры</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Поиск */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Поиск
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Номер паспорта, заказа, код 1С..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* Тип продукта */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Тип продукта
                  </label>
                  <select
                    value={filters.product_type}
                    onChange={(e) => handleFilterChange('product_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Все типы</option>
                    {filterOptions.product_types.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Матрица */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Матрица
                  </label>
                  <select
                    value={filters.matrix}
                    onChange={(e) => handleFilterChange('matrix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Все матрицы</option>
                    {filterOptions.matrices.map((matrix) => (
                      <option key={matrix} value={matrix}>{matrix}</option>
                    ))}
                  </select>
                </div>

                {/* Статус */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Статус
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Все статусы</option>
                    {filterOptions.statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Дата от */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Дата от
                  </label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Дата до */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Дата до
                  </label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Номер заказа */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Номер заказа
                  </label>
                  <input
                    type="text"
                    value={filters.order_number}
                    onChange={(e) => handleFilterChange('order_number', e.target.value)}
                    placeholder="Номер заказа"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  </div>

                {/* Код 1С */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Код 1С
                  </label>
                  <input
                    type="text"
                    value={filters.code_1c}
                    onChange={(e) => handleFilterChange('code_1c', e.target.value)}
                    placeholder="Код 1С"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Очистить фильтры
                </button>
                <button
                  onClick={fetchPassports}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Применить фильтры
                </button>
              </div>
            </div>

            {/* Результаты */}
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Найдено паспортов: {passports.length}
              </h3>
              {passports.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Экспорт в Excel</span>
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Экспорт в PDF</span>
                  </button>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Номер паспорта
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Номер заказа
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Номенклатура
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Создатель
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Дата создания
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {passports.map((passport) => (
                      <tr key={passport.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {passport.passport_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {passport.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            <div className="font-medium">{passport.nomenclature?.name || 'Не указано'}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                              {passport.nomenclature?.code_1c} | {passport.nomenclature?.matrix}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {passport.creator ? (
                            <div>
                              <div className="font-medium">
                                {passport.creator.first_name && passport.creator.last_name
                                  ? `${passport.creator.first_name} ${passport.creator.last_name}`
                                  : passport.creator.username
                                }
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">ID: {passport.creator.id}</div>
                            </div>
                          ) : (
                            'Неизвестно'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(passport.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(passport.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Просмотр"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              title="Экспорт PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {passports.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                    <p>Паспорта ВЭД не найдены</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminVEDPassportsPage;
