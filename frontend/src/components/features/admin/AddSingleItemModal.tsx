"use client";

import React, { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';

interface AddSingleItemProps {
  type: 'articles' | 'ved-passports';
}

const AddSingleItemModal: React.FC<AddSingleItemProps> = ({ type }) => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isArticles = type === 'articles';
  const endpoint = isArticles ? '/api/v1/data-upload/add-single-article' : '/api/v1/ved-passports-upload/add-single-passport';

  // Форма для статей
  const [articleForm, setArticleForm] = useState({
    article_name: '',
    description: '',
    category: '',
    additional_criteria: '',
    price: '',
    currency: 'RUB',
    min_order_quantity: '1',
    availability: 'В наличии',
    confidence_score: '0.85'
  });

  // Форма для ВЭД паспортов
  const [passportForm, setPassportForm] = useState({
    passport_number: '',
    order_number: '',
    title: '',
    description: '',
    quantity: '1',
    status: 'active',
    nomenclature_id: '1'
  });

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(articleForm),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: 'Статья успешно добавлена', data });
        setArticleForm({
          article_name: '',
          description: '',
          category: '',
          additional_criteria: '',
          price: '',
          currency: 'RUB',
          min_order_quantity: '1',
          availability: 'В наличии',
          confidence_score: '0.85'
        });
      } else {
        throw new Error(data.detail || 'Ошибка добавления статьи');
      }
    } catch (error) {
      console.error('Ошибка добавления:', error);
      setResult({ success: false, message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePassportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passportForm),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: 'ВЭД паспорт успешно добавлен', data });
        setPassportForm({
          passport_number: '',
          order_number: '',
          title: '',
          description: '',
          quantity: '1',
          status: 'active',
          nomenclature_id: '1'
        });
      } else {
        throw new Error(data.detail || 'Ошибка добавления ВЭД паспорта');
      }
    } catch (error) {
      console.error('Ошибка добавления:', error);
      setResult({ success: false, message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        ➕ Добавить {isArticles ? 'статью' : 'ВЭД паспорт'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Добавление {isArticles ? 'статьи для сопоставления' : 'ВЭД паспорта'}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {isArticles ? (
                <form onSubmit={handleArticleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название статьи *
                      </label>
                      <input
                        type="text"
                        required
                        value={articleForm.article_name}
                        onChange={(e) => setArticleForm({...articleForm, article_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="AGB-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Категория *
                      </label>
                      <input
                        type="text"
                        required
                        value={articleForm.category}
                        onChange={(e) => setArticleForm({...articleForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Буровой инструмент"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Описание *
                      </label>
                      <textarea
                        required
                        value={articleForm.description}
                        onChange={(e) => setArticleForm({...articleForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Коронка алмазная для бурения скважин"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дополнительные критерии
                      </label>
                      <input
                        type="text"
                        value={articleForm.additional_criteria}
                        onChange={(e) => setArticleForm({...articleForm, additional_criteria: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Матрица NQ, глубина до 50м"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Цена
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={articleForm.price}
                        onChange={(e) => setArticleForm({...articleForm, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="15000.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Валюта
                      </label>
                      <select
                        value={articleForm.currency}
                        onChange={(e) => setArticleForm({...articleForm, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="RUB">RUB</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Минимальный заказ
                      </label>
                      <input
                        type="number"
                        value={articleForm.min_order_quantity}
                        onChange={(e) => setArticleForm({...articleForm, min_order_quantity: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Наличие
                      </label>
                      <select
                        value={articleForm.availability}
                        onChange={(e) => setArticleForm({...articleForm, availability: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="В наличии">В наличии</option>
                        <option value="Под заказ">Под заказ</option>
                        <option value="Нет в наличии">Нет в наличии</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Уровень уверенности
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={articleForm.confidence_score}
                        onChange={(e) => setArticleForm({...articleForm, confidence_score: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.85"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {isSubmitting ? '⏳ Добавление...' : '➕ Добавить статью'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePassportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Номер паспорта *
                      </label>
                      <input
                        type="text"
                        required
                        value={passportForm.passport_number}
                        onChange={(e) => setPassportForm({...passportForm, passport_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VED-2024-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Номер заказа *
                      </label>
                      <input
                        type="text"
                        required
                        value={passportForm.order_number}
                        onChange={(e) => setPassportForm({...passportForm, order_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ORD-2024-001"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название паспорта
                      </label>
                      <input
                        type="text"
                        value={passportForm.title}
                        onChange={(e) => setPassportForm({...passportForm, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Паспорт коронки AGB-001"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Описание
                      </label>
                      <textarea
                        value={passportForm.description}
                        onChange={(e) => setPassportForm({...passportForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Коронка алмазная для бурения скважин"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Количество
                      </label>
                      <input
                        type="number"
                        value={passportForm.quantity}
                        onChange={(e) => setPassportForm({...passportForm, quantity: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Статус
                      </label>
                      <select
                        value={passportForm.status}
                        onChange={(e) => setPassportForm({...passportForm, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Активный</option>
                        <option value="archived">Архивный</option>
                        <option value="draft">Черновик</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID номенклатуры
                      </label>
                      <input
                        type="number"
                        value={passportForm.nomenclature_id}
                        onChange={(e) => setPassportForm({...passportForm, nomenclature_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {isSubmitting ? '⏳ Добавление...' : '➕ Добавить ВЭД паспорт'}
                    </button>
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
                </div>
              )}

              {/* Инструкции */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Инструкции</h4>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">
                    <strong>Обязательные поля:</strong> {isArticles ? 'Название статьи, Категория, Описание' : 'Номер паспорта, Номер заказа'}
                  </p>
                  <p>
                    <strong>Примечание:</strong> Все поля кроме обязательных можно оставить пустыми или заполнить значениями по умолчанию.
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

export default AddSingleItemModal;
