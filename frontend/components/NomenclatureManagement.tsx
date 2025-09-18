'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../src/utils/api';
import { useAuth } from '../src/hooks/useAuth';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NomenclatureItem {
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
  created_at: string;
  updated_at?: string;
}

interface NomenclatureFormData {
  code_1c: string;
  name: string;
  article: string;
  matrix: string;
  drilling_depth: string;
  height: string;
  thread: string;
  product_type: string;
  is_active: boolean;
}

const NomenclatureManagement: React.FC = () => {
  const { token } = useAuth();
  const [nomenclatures, setNomenclatures] = useState<NomenclatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NomenclatureItem | null>(null);
  const [viewingItem, setViewingItem] = useState<NomenclatureItem | null>(null);
  const [formData, setFormData] = useState<NomenclatureFormData>({
    code_1c: '',
    name: '',
    article: '',
    matrix: '',
    drilling_depth: '',
    height: '',
    thread: '',
    product_type: 'коронка',
    is_active: true
  });

  const productTypes = [
    { value: 'коронка', label: 'Коронка' },
    { value: 'расширитель', label: 'Расширитель' },
    { value: 'башмак', label: 'Башмак' }
  ];

  useEffect(() => {
    fetchNomenclatures();
  }, [token]);

  const fetchNomenclatures = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/ved-passports/nomenclature/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNomenclatures(data);
      } else {
        setError('Ошибка при загрузке номенклатур');
      }
    } catch (error) {
      setError('Ошибка при загрузке номенклатур');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const isEditing = editingItem !== null;
      const url = isEditing 
        ? `${getApiUrl()}/api/v1/ved-passports/nomenclature/${editingItem.id}`
        : `${getApiUrl()}/api/v1/ved-passports/nomenclature/`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedItem = await response.json();
        if (isEditing) {
          setNomenclatures(prev => 
            prev.map(item => item.id === editingItem.id ? updatedItem : item)
          );
        } else {
          setNomenclatures(prev => [updatedItem, ...prev]);
        }
        setShowModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Ошибка при ${isEditing ? 'обновлении' : 'создании'} номенклатуры`);
      }
    } catch (error) {
      setError(`Ошибка при ${editingItem ? 'обновлении' : 'создании'} номенклатуры`);
    }
  };

  const resetForm = () => {
    setFormData({
      code_1c: '',
      name: '',
      article: '',
      matrix: '',
      drilling_depth: '',
      height: '',
      thread: '',
      product_type: 'коронка',
      is_active: true
    });
    setEditingItem(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openViewModal = (item: NomenclatureItem) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingItem(null);
  };

  const openEditModal = (item: NomenclatureItem) => {
    setEditingItem(item);
    setFormData({
      code_1c: item.code_1c,
      name: item.name,
      article: item.article,
      matrix: item.matrix,
      drilling_depth: item.drilling_depth || '',
      height: item.height || '',
      thread: item.thread || '',
      product_type: item.product_type,
      is_active: item.is_active
    });
    setShowModal(true);
  };

  const getProductTypeColor = (productType: string) => {
    switch (productType) {
      case 'коронка':
        return 'bg-blue-100 text-blue-800';
      case 'расширитель':
        return 'bg-green-100 text-green-800';
      case 'башмак':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductTypeText = (productType: string) => {
    const type = productTypes.find(t => t.value === productType);
    return type ? type.label : productType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Номенклатуры</h2>
        <button
          onClick={openModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Добавить номенклатуру
        </button>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Список номенклатур */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Код 1С
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Артикул
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Матрица
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип продукта
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {nomenclatures.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.code_1c}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.article}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.matrix}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProductTypeColor(item.product_type)}`}>
                      {getProductTypeText(item.product_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Просмотр"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-green-600 hover:text-green-900"
                        title="Редактировать"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Удалить"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {nomenclatures.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Номенклатуры не найдены</p>
          </div>
        )}
      </div>

      {/* Модальное окно для добавления/редактирования */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-96 max-h-[calc(100vh-2rem)] shadow-lg rounded-md bg-white overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingItem ? 'Редактировать номенклатуру' : 'Добавить номенклатуру'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Код 1С *
                  </label>
                  <input
                    type="text"
                    name="code_1c"
                    value={formData.code_1c}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Артикул *
                  </label>
                  <input
                    type="text"
                    name="article"
                    value={formData.article}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Матрица *
                  </label>
                  <input
                    type="text"
                    name="matrix"
                    value={formData.matrix}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип продукта *
                  </label>
                  <select
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {productTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Глубина бурения
                  </label>
                  <input
                    type="text"
                    name="drilling_depth"
                    value={formData.drilling_depth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Высота
                  </label>
                  <input
                    type="text"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Резьба
                  </label>
                  <input
                    type="text"
                    name="thread"
                    value={formData.thread}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Активна
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для просмотра */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-96 max-h-[calc(100vh-2rem)] shadow-lg rounded-md bg-white overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Просмотр номенклатуры
                </h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Код 1С
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                    {viewingItem.code_1c}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                    {viewingItem.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Артикул
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                    {viewingItem.article}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Матрица
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                    {viewingItem.matrix}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип продукта
                  </label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProductTypeColor(viewingItem.product_type)}`}>
                      {getProductTypeText(viewingItem.product_type)}
                    </span>
                  </p>
                </div>

                {viewingItem.drilling_depth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Глубина бурения
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                      {viewingItem.drilling_depth}
                    </p>
                  </div>
                )}

                {viewingItem.height && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Высота
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                      {viewingItem.height}
                    </p>
                  </div>
                )}

                {viewingItem.thread && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Резьба
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                      {viewingItem.thread}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Статус
                  </label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      viewingItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingItem.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата создания
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                    {new Date(viewingItem.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>

                {viewingItem.updated_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата обновления
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-1.5 rounded">
                      {new Date(viewingItem.updated_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  onClick={closeViewModal}
                  className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    openEditModal(viewingItem);
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NomenclatureManagement;
