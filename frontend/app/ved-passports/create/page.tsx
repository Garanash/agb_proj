'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/utils';
import { useAuth } from '../../../components/AuthContext'
import { 
  ArrowLeftIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  DocumentIcon,
  EyeIcon,
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
    quantity: 0
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

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }))
  }

  const handleQuantityChange = (e: any) => {
    const value = e.target.value
    // Если поле пустое, устанавливаем 0, иначе парсим число
    const quantity = value === '' ? 0 : parseInt(value) || 0
    setFormData(prev => ({
      ...prev,
      quantity: quantity
    }))
  }



  const createSinglePassport = async () => {
    if (!formData.orderNumber || !formData.nomenclatureId) {
      setErrorMessage('Пожалуйста, заполните все обязательные поля')
      return
    }

    if (formData.orderNumber === '0' || formData.orderNumber.trim() === '') {
      setErrorMessage('Номер заказа не может быть "0" или пустым')
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
      // Используем bulk API даже для одного паспорта для оптимизации
      const response: any = await fetch(`${getApiUrl()}/api/v1/ved-passports/bulk/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_number: formData.orderNumber,
          title: selectedNomenclature ? `Паспорт ВЭД ${selectedNomenclature.name}` : undefined,
          items: [{
            code_1c: selectedNomenclature?.code_1c,
            quantity: formData.quantity === 0 ? 1 : formData.quantity
          }]
        })
      })

      if (response.status >= 200 && response.status < 300) {
        const result = await response.json()

        // Преобразуем результат bulk API в формат для отображения
        const passports: CreatedPassport[] = result.passports.map((passport: any) => ({
          id: passport.id,
          passport_number: passport.passport_number,
          order_number: passport.order_number,
          nomenclature: selectedNomenclature!,
          quantity: 1,
          status: passport.status,
          created_at: passport.created_at
        }))

        // Добавляем созданные паспорты к списку
        setCreatedPassports(prev => [...passports, ...prev])
        setSuccessMessage(`Успешно создано ${passports.length} паспортов ВЭД!`)

        // Показываем ошибки если они есть
        if (result.errors && result.errors.length > 0) {
          console.warn('Предупреждения при создании:', result.errors)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Произошла ошибка при создании паспорта')
      }

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
    if (!formData.orderNumber) {
      setErrorMessage('Пожалуйста, введите номер заказа поставщику')
      return
    }

    if (formData.orderNumber === '0' || formData.orderNumber.trim() === '') {
      setErrorMessage('Номер заказа не может быть "0" или пустым')
      return
    }

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
      // Преобразуем bulkItems в формат для bulk API
      const bulkRequestItems = validItems.map(item => ({
        code_1c: item.nomenclature!.code_1c,
        quantity: item.quantity
      }))

      const response: any = await fetch(`${getApiUrl()}/api/v1/ved-passports/bulk/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_number: formData.orderNumber || 'BULK-ORDER',
          title: 'Массовое создание паспортов ВЭД',
          items: bulkRequestItems
        })
      })

      if (response.status >= 200 && response.status < 300) {
        const result = await response.json()

        // Преобразуем результат bulk API в формат для отображения
        const allPassports: CreatedPassport[] = result.passports.map((passport: any) => {
          // Находим соответствующую номенклатуру для этого паспорта
          const nomenclature = validItems.find(item =>
            item.nomenclature!.code_1c === passport.nomenclature.code_1c
          )?.nomenclature!

          return {
            id: passport.id,
            passport_number: passport.passport_number,
            order_number: passport.order_number,
            nomenclature: nomenclature,
            quantity: 1,
            status: passport.status,
            created_at: passport.created_at
          }
        })

        // Добавляем созданные паспорты к списку
        setCreatedPassports(prev => [...allPassports, ...prev])
        setSuccessMessage(`Успешно создано ${allPassports.length} паспортов ВЭД!`)

        // Показываем ошибки если они есть
        if (result.errors && result.errors.length > 0) {
          console.warn('Предупреждения при создании:', result.errors)
          // Можно добавить отображение ошибок пользователю
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Произошла ошибка при массовом создании паспортов')
      }

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
    const headers = ['Номер паспорта', 'Номер заказа поставщику', 'Код 1С', 'Наименование', 'Артикул', 'Матрица', 'Дата создания']
    const csvData = [
      headers.join(';'), // Используем точку с запятой вместо запятой
      ...createdPassports.map(passport => [
        passport.passport_number,
        passport.order_number,
        passport.nomenclature.code_1c,
        passport.nomenclature.name.replace(/"/g, '""'), // Экранируем кавычки
        passport.nomenclature.article,
        passport.nomenclature.matrix,
        new Date(passport.created_at).toLocaleDateString('ru-RU')
      ].join(';'))
    ].join('\r\n') // Используем Windows line endings

    // Создаем и скачиваем файл с правильной кодировкой
    const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8' })
    const link: any = (window as any).document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `паспорта_вэд_${new Date().toISOString().split('T')[0]}.csv`)
    // console.log('Setting link visibility to hidden')
    (window as any).document.body.appendChild(link)
    link.click()
    (window as any).document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportCreatedPassports = async (format: 'pdf' | 'xlsx') => {
    console.log('exportCreatedPassports called with format:', format)
    console.log('createdPassports length:', createdPassports.length)
    console.log('token:', token ? 'present' : 'missing')

    if (createdPassports.length === 0) {
      console.log('No passports to export')
      return
    }

    if (!token) {
      setErrorMessage('Требуется авторизация')
      return
    }

    try {
      const apiUrl = getApiUrl()
      const passportIds = createdPassports.map(p => p.id)
      const response: any = await fetch(`${apiUrl}/api/v1/ved-passports/export/bulk/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passport_ids: passportIds
        })
      })

      if (response.status >= 200 && response.status < 300) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link: any = (window as any).document.createElement('a')
        link.href = url
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `created_passports.${format}`

        link.setAttribute('download', filename)
        (window as any).document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        setErrorMessage('Ошибка при экспорте паспортов')
      }
    } catch (error) {
      console.error('Ошибка при экспорте паспортов:', error)
      setErrorMessage('Ошибка при экспорте паспортов')
    }
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
              <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                    Номер заказа поставщику *
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
                    type="text"
                    name="quantity"
                    value={formData.quantity === 0 ? '' : formData.quantity.toString()}
                    onChange={handleQuantityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Будет создано {formData.quantity === 0 ? 1 : formData.quantity} паспортов (по одному на каждый экземпляр)
                  </p>
                </div>

                {/* Кнопка создания */}
                <button
                  onClick={createSinglePassport}
                  disabled={isSubmitting || !formData.orderNumber || !formData.nomenclatureId}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Создание...' : `Создать ${formData.quantity === 0 ? 1 : formData.quantity} паспорт(ы) ВЭД`}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Массовое создание паспортов</h3>
                
                {/* Номер заказа для массового создания */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер заказа поставщику *
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
                  disabled={isSubmitting || bulkItems.length === 0 || !formData.orderNumber}
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
                    onClick={() => exportCreatedPassports('pdf')}
                    className="inline-flex items-center px-3 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                  >
                    <DocumentIcon className="w-4 h-4 mr-2" />
                    Экспорт в PDF
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
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер паспорта
                    </th>
                    <th className="w-56 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер заказа поставщику
                    </th>
                    <th className="w-80 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номенклатура
                    </th>
                    <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="w-24 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {createdPassports.map((passport) => (
                    <tr key={passport.id} className="hover:bg-gray-50">
                      <td className="w-48 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {passport.passport_number}
                      </td>
                      <td className="w-56 px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {passport.order_number}
                      </td>
                      <td className="w-80 px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {passport.nomenclature.code_1c}
                          </div>
                          <div className="text-sm text-gray-500">
                            {passport.nomenclature.name}
                          </div>
                        </div>
                      </td>
                      <td className="w-32 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(passport.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="w-24 px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
