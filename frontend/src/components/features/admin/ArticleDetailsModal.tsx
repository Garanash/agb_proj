'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  XMarkIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Supplier {
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  country?: string
  city?: string
  price?: number
  currency?: string
  min_order_quantity?: number
  availability?: string
  confidence_score?: number
}

interface ArticleResult {
  article_code: string
  suppliers: Supplier[]
  total_suppliers: number
}

interface ArticleDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  articleCode: string
  results: ArticleResult[]
  onRetrySearch: (articleCode: string) => void
  isSearching: boolean
}

export default function ArticleDetailsModal({
  isOpen,
  onClose,
  articleCode,
  results,
  onRetrySearch,
  isSearching
}: ArticleDetailsModalProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  if (!isOpen) return null

  const articleResult = results.find(r => r.article_code === articleCode)
  const suppliers = articleResult?.suppliers || []

  const getStatusIcon = (availability?: string) => {
    switch (availability?.toLowerCase()) {
      case 'в наличии':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'под заказ':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (availability?: string) => {
    switch (availability?.toLowerCase()) {
      case 'в наличии':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
      case 'под заказ':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'Цена не указана'
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'RUB' ? 'RUB' : 'USD'
    }).format(price)
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" style={{ zIndex: 10000 }}>
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <MagnifyingGlassIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Детали артикула: {articleCode}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Найдено поставщиков: {suppliers.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onRetrySearch(articleCode)}
                disabled={isSearching}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>{isSearching ? 'Поиск...' : 'Повторить поиск'}</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Содержимое */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {suppliers.length === 0 ? (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Поставщики не найдены
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Попробуйте повторить поиск или изменить параметры
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {suppliers.map((supplier, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {supplier.company_name}
                          </h3>
                          {supplier.contact_person && (
                            <p className="text-gray-600 dark:text-gray-300">
                              Контактное лицо: {supplier.contact_person}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(supplier.availability)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.availability)}`}>
                          {supplier.availability || 'Статус неизвестен'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Контактная информация */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Контактная информация</h4>
                        {supplier.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <EnvelopeIcon className="h-4 w-4" />
                            <a href={`mailto:${supplier.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <PhoneIcon className="h-4 w-4" />
                            <a href={`tel:${supplier.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                              {supplier.phone}
                            </a>
                          </div>
                        )}
                        {supplier.website && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <GlobeAltIcon className="h-4 w-4" />
                            <a 
                              href={supplier.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {supplier.website}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Адрес и местоположение */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Местоположение</h4>
                        {supplier.address && (
                          <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <MapPinIcon className="h-4 w-4 mt-0.5" />
                            <span>{supplier.address}</span>
                          </div>
                        )}
                        {(supplier.city || supplier.country) && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {supplier.city && supplier.country 
                              ? `${supplier.city}, ${supplier.country}`
                              : supplier.city || supplier.country
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ценовая информация */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <CurrencyDollarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Цена</span>
                          </div>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {formatPrice(supplier.price, supplier.currency)}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Мин. заказ
                          </div>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {supplier.min_order_quantity || 'Не указано'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Уверенность ИИ
                          </div>
                          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                            {supplier.confidence_score ? `${Math.round(supplier.confidence_score * 100)}%` : 'Не указано'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Используем Portal для рендеринга модального окна в корне документа
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  
  return null
}
