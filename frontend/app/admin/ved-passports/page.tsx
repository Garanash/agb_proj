'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { PageLayout } from '@/components/layout';
import Link from 'next/link';

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

const AdminVEDPassportsPage = () => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [passports, setPassports] = useState<VedPassport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'create' | 'archive'>('all');

  // Проверяем права доступа
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Загрузка всех паспортов
  useEffect(() => {
    const fetchPassports = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const apiUrl = getApiUrl();
        const response: any = await fetch(`${apiUrl}/api/v1/ved-passports/admin/all`, {
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

    fetchPassports();
  }, [token]);

  // Показываем загрузку или редирект
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <PageLayout title="Управление паспортами ВЭД">
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
      'active': { text: 'Активен', class: 'bg-green-100 text-green-800' },
      'archived': { text: 'Архив', class: 'bg-gray-100 text-gray-800' },
      'draft': { text: 'Черновик', class: 'bg-yellow-100 text-yellow-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <PageLayout title="Управление паспортами ВЭД">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        {/* Заголовок и навигация */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Управление паспортами ВЭД</h1>
          
          {/* Табы */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Все паспорта
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Создать паспорт
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'archive'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Архив
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Контент табов */}
        {activeTab === 'all' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Все паспорта ВЭД ({passports.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Номер паспорта
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Номер заказа
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Номенклатура
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Создатель
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата создания
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {passports.map((passport) => (
                      <tr key={passport.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {passport.passport_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {passport.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{passport.nomenclature?.name || 'Не указано'}</div>
                            <div className="text-gray-500 text-xs">
                              {passport.nomenclature?.code_1c} | {passport.nomenclature?.matrix}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {passport.creator ? (
                            <div>
                              <div className="font-medium">
                                {passport.creator.first_name && passport.creator.last_name
                                  ? `${passport.creator.first_name} ${passport.creator.last_name}`
                                  : passport.creator.username
                                }
                              </div>
                              <div className="text-gray-500 text-xs">ID: {passport.creator.id}</div>
                            </div>
                          ) : (
                            'Неизвестно'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(passport.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(passport.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="Просмотр"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900"
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
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Паспорта ВЭД не найдены</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Создание паспорта ВЭД</h2>
              <p className="text-gray-600 mb-6">
                Для создания паспорта ВЭД используйте стандартную форму создания.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <Link
                href="/ved-passports/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Создать паспорт
              </Link>
              
              <Link
                href="/ved-passports"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Управление номенклатурой
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'archive' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Архив паспортов ВЭД</h2>
              <p className="text-gray-600 mb-6">
                Просмотр и управление всеми паспортами ВЭД в системе с расширенными фильтрами.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Функция архива в разработке
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Расширенная фильтрация и управление архивом паспортов будет доступна в следующем обновлении.
                      Пока используйте вкладку "Все паспорта" для просмотра всех паспортов в системе.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Link
              href="/admin/ved-passports/archive"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Перейти к архиву
            </Link>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminVEDPassportsPage;
