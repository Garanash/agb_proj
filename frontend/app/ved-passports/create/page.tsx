'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils/api';
import { useAuth } from '../../../components/AuthContext'
import { 
  ArrowLeftIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  DocumentIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import NomenclatureSelector from '../../../components/NomenclatureSelector'
import BulkInputArea from '../../../components/BulkInputArea'
import PassportPreview from '../../../components/PassportPreview'

interface NomenclatureItem {
  id: number
  code_1c: string
  name: string
  article: string
  matrix: string
  drilling_depth?: string
  height?: string
  thread?: string
  product_type: string
}

interface BulkInputItem {
  code_1c: string
  quantity: number
  nomenclature?: NomenclatureItem
  isValid: boolean
  error?: string
}

interface PassportFormData {
  orderNumber: string
  nomenclatureId: number | null
  quantity: number
}

interface CreatedPassport {
  id: number
  passport_number: string
  order_number: string
  nomenclature: NomenclatureItem
  quantity: number
  status: string
  created_at: string
}

export default function CreateVEDPassportPage() {
  const { token, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [formData, setFormData] = useState<PassportFormData>({
    orderNumber: '',
    nomenclatureId: null,
    quantity: 1
  })
  const [selectedNomenclature, setSelectedNomenclature] = useState<NomenclatureItem | null>(null)
  const [bulkItems, setBulkItems] = useState<BulkInputItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [createdPassports, setCreatedPassports] = useState<CreatedPassport[]>([])
  const [showPassportModal, setShowPassportModal] = useState(false)
  const [selectedPassport, setSelectedPassport] = useState<CreatedPassport | null>(null)

  const handleNomenclatureSelect = (item: NomenclatureItem | null) => {
    setSelectedNomenclature(item)
    setFormData(prev => ({
      ...prev,
      nomenclatureId: item?.id || null
    }))
  }

  const handleBulkItemsChange = (items: BulkInputItem[]) => {
    setBulkItems(items)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }))
  }



  const createSinglePassport = async () => {
    if (!formData.orderNumber || !formData.nomenclatureId) {
      setErrorMessage('Пожалуйста, заполните все обязательные поля')
      return
    }

    if (!token) {
      setErrorMessage('Требуется авторизация')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // Создаем паспорт для каждого экземпляра
      const passports: CreatedPassport[] = []
      
      for (let i = 0; i < formData.quantity; i++) {
        const response = await fetch(`${getApiUrl()}/api/ved-passports/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            order_number: formData.orderNumber,
            nomenclature_id: formData.nomenclatureId,
            quantity: 1 // Каждый паспорт для одного экземпляра
          })
        })

        if (response.ok) {
          const result = await response.json()
          passports.push({
            id: result.id,
            passport_number: result.passport_number, // Используем номер с бэкенда
            order_number: result.order_number,
            nomenclature: selectedNomenclature!,
            quantity: 1,
            status: result.status,
            created_at: result.created_at
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Произошла ошибка при создании паспорта')
        }
      }

      // Добавляем созданные паспорты к списку
      setCreatedPassports(prev => [...passports, ...prev])
      setSuccessMessage(`Успешно создано ${passports.length} паспортов ВЭД!`)
      
      // Счетчик паспортов обновляется автоматически на бэкенде
      
      // Очищаем форму
      setFormData({
        orderNumber: '',
        nomenclatureId: null,
        quantity: 1
      })
      setSelectedNomenclature(null)
    } catch (error) {
      console.error('Ошибка при создании паспорта:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Произошла ошибка при создании паспорта')
    } finally {
      setIsSubmitting(false)
    }
  }

  const createBulkPassports = async () => {
    if (!bulkItems.length) {
      setErrorMessage('Пожалуйста, добавьте позиции для создания паспортов')
      return
    }

    if (!token) {
      setErrorMessage('Требуется авторизация')
      return
    }

    const validItems = bulkItems.filter(item => item.isValid && item.nomenclature)
    if (!validItems.length) {
      setErrorMessage('Нет валидных позиций для создания паспортов')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const allPassports: CreatedPassport[] = []
      
      // Создаем паспорты для каждой позиции
      for (const item of validItems) {
        // Создаем паспорт для каждого экземпляра
        for (let i = 0; i < item.quantity; i++) {
          const response = await fetch(`${getApiUrl()}/api/ved-passports/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              order_number: formData.orderNumber || 'BULK-ORDER',
              nomenclature_id: item.nomenclature!.id,
              quantity: 1 // Каждый паспорт для одного экземпляра
            })
          })

          if (response.ok) {
            const result = await response.json()
            allPassports.push({
              id: result.id,
              passport_number: result.passport_number, // Используем номер с бэкенда
              order_number: result.order_number,
              nomenclature: item.nomenclature!,
              quantity: 1,
              status: result.status,
              created_at: result.created_at
            })
          } else {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Произошла ошибка при создании паспорта')
          }
        }
      }

      // Добавляем созданные паспорты к списку
      setCreatedPassports(prev => [...allPassports, ...prev])
      setSuccessMessage(`Успешно создано ${allPassports.length} паспортов ВЭД!`)
      
      // Очищаем форму
      setFormData({
        orderNumber: '',
        nomenclatureId: null,
        quantity: 1
      })
      setBulkItems([])
    } catch (error) {
      console.error('Ошибка при массовом создании паспортов:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Произошла ошибка при массовом создании паспортов')
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewPassport = (passport: CreatedPassport) => {
    setSelectedPassport(passport)
    setShowPassportModal(true)
  }

  const exportToExcel = () => {
    if (createdPassports.length === 0) return

    // Создаем CSV данные с правильной кодировкой
    const BOM = '\uFEFF' // BOM для UTF-8
    const headers = ['Номер паспорта', 'Номер заказа', 'Код 1С', 'Наименование', 'Артикул', 'Матрица', 'Статус', 'Дата создания']
    const csvData = [
      headers.join(';'), // Используем точку с запятой вместо запятой
      ...createdPassports.map(passport => [
        passport.passport_number,
        passport.order_number,
        passport.nomenclature.code_1c,
        passport.nomenclature.name.replace(/"/g, '""'), // Экранируем кавычки
        passport.nomenclature.article,
        passport.nomenclature.matrix,
        passport.status,
        new Date(passport.created_at).toLocaleDateString('ru-RU')
      ].join(';'))
    ].join('\r\n') // Используем Windows line endings

    // Создаем и скачиваем файл с правильной кодировкой
    const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `паспорта_вэд_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearCreatedPassports = () => {
    setCreatedPassports([])
    setSuccessMessage('')
  }

  // Если пользователь не авторизован, показываем сообщение
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Требуется авторизация</h3>
          <p className="text-gray-500 mb-4">
            Для создания паспортов ВЭД необходимо авторизоваться
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Войти в систему
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок и навигация */}
        <div className="mb-8">
          <Link 
            href="/ved-passports"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Назад к паспортам ВЭД
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Создание паспортов ВЭД</h1>
          <p className="mt-2 text-gray-600">
            Создайте новые паспорта внешнеэкономической деятельности
          </p>
        </div>

        {/* Сообщения об успехе/ошибке */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-green-800">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800">{errorMessage}</div>
          </div>
        )}

        {/* Вкладки */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('single')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'single'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentIcon className="w-5 h-5 inline mr-2" />
                Создание одного паспорта
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bulk'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClipboardDocumentIcon className="w-5 h-5 inline mr-2" />
                Массовое создание
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'single' ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Создание одного паспорта</h3>
                
                {/* Номер заказа */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер заказа покупателя *
                  </label>
                  <input
                    type="text"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Введите номер заказа"
                    required
                  />
                </div>

                {/* Выбор номенклатуры */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выбор номенклатуры *
                  </label>
                  <NomenclatureSelector 
                    onSelect={handleNomenclatureSelect} 
                    selectedItem={selectedNomenclature}
                  />
                </div>

                {/* Количество */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество экземпляров *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Будет создано {formData.quantity} паспортов (по одному на каждый экземпляр)
                  </p>
                </div>

                {/* Кнопка создания */}
                <button
                  onClick={createSinglePassport}
                  disabled={isSubmitting || !formData.orderNumber || !formData.nomenclatureId}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Создание...' : `Создать ${formData.quantity} паспорт(ов) ВЭД`}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Массовое создание паспортов</h3>
                
                {/* Номер заказа для массового создания */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер заказа покупателя
                  </label>
                  <input
                    type="text"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Введите номер заказа (необязательно)"
                  />
                </div>

                {/* Область для массового ввода */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Введите номенклатуру и количество
                  </label>
                  <BulkInputArea onItemsChange={handleBulkItemsChange} />
                </div>

                {/* Кнопка массового создания */}
                <button
                  onClick={createBulkPassports}
                  disabled={isSubmitting || bulkItems.length === 0}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Создание...' : 'Создать паспорты ВЭД'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Созданные паспорты */}
        {createdPassports.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Созданные паспорта ({createdPassports.length})
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                    Экспорт в Excel
                  </button>
                  <button
                    onClick={clearCreatedPassports}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            </div>
            
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
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {createdPassports.map((passport) => (
                    <tr key={passport.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {passport.passport_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {passport.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {passport.nomenclature.code_1c}
                          </div>
                          <div className="text-sm text-gray-500">
                            {passport.nomenclature.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          {passport.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(passport.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewPassport(passport)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Просмотр паспорта"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Информация о генерации номеров */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Правила генерации номеров паспортов</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Коронки:</strong> AGB [Глубина бурения] [Матрица] [Серийный номер] [Год]</p>
            <p><strong>Пример:</strong> AGB 05-07 NQ 000001 25</p>
            <p><strong>Расширители и башмаки:</strong> AGB [Матрица] [Серийный номер] [Год]</p>
            <p><strong>Пример:</strong> AGB NQ 000001 25</p>
            <p className="text-xs mt-4">* Серийный номер начинается с 000001 и увеличивается по порядку</p>
            <p className="text-xs">* В конце добавляются последние 2 цифры года создания паспорта</p>
            <p className="text-xs">* Каждый номер паспорта уникален и генерируется автоматически</p>
            <p className="text-xs">* Для каждого экземпляра создается отдельный паспорт</p>
          </div>
        </div>
      </div>

      {/* Предварительный просмотр паспорта */}
      <PassportPreview
        passport={selectedPassport!}
        isOpen={showPassportModal}
        onClose={() => setShowPassportModal(false)}
      />
    </div>
  )
}
