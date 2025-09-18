'use client'

import { useState, useEffect } from 'react'
import { ClipboardDocumentIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils';
import { useAuth } from '@/hooks'

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

interface BulkInputAreaProps {
  onItemsChange: (items: BulkInputItem[]) => void
  className?: string
}

export default function BulkInputArea({ onItemsChange, className = "" }: BulkInputAreaProps) {
  const { token } = useAuth()
  const [inputText, setInputText] = useState('')
  const [items, setItems] = useState<BulkInputItem[]>([])
  const [nomenclature, setNomenclature] = useState<NomenclatureItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Загружаем номенклатуру при монтировании или изменении токена
  useEffect(() => {
    if (token) {
      fetchNomenclature()
    }
  }, [token])

  // Уведомляем родительский компонент об изменении позиций
  useEffect(() => {
    onItemsChange(items)
  }, [items, onItemsChange])

  const fetchNomenclature = async () => {
    if (!token) return
    
    setIsLoading(true)
    try {
      const response: any = await fetch(`${getApiUrl()}/api/v1/ved-passports/nomenclature/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json()
        setNomenclature(data)
      } else {
        console.error('Ошибка при загрузке номенклатуры:', response.statusText)
      }
    } catch (error) {
      console.error('Ошибка при загрузке номенклатуры:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const parseInputText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const newItems: BulkInputItem[] = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      // Пытаемся распарсить строку в формате "код_1с количество"
      const parts = trimmedLine.split(/\s+/)
      
      if (parts.length >= 2) {
        const code_1c = parts[0].trim()
        const quantityStr = parts[1].trim()
        const quantity = parseInt(quantityStr)

        if (isNaN(quantity) || quantity <= 0) {
          newItems.push({
            code_1c,
            quantity: 1,
            isValid: false,
            error: 'Неверное количество'
          })
        } else {
          // Ищем номенклатуру по коду 1С
          const foundNomenclature = nomenclature.find(item => item.code_1c === code_1c)
          
          if (foundNomenclature) {
            newItems.push({
              code_1c,
              quantity,
              nomenclature: foundNomenclature,
              isValid: true
            })
          } else {
            newItems.push({
              code_1c,
              quantity,
              isValid: false,
              error: 'Код 1С не найден в номенклатуре'
            })
          }
        }
      } else if (parts.length === 1) {
        // Если указан только код 1С, количество по умолчанию = 1
        const code_1c = parts[0].trim()
        const foundNomenclature = nomenclature.find(item => item.code_1c === code_1c)
        
        if (foundNomenclature) {
          newItems.push({
            code_1c,
            quantity: 1,
            nomenclature: foundNomenclature,
            isValid: true
          })
        } else {
          newItems.push({
            code_1c,
            quantity: 1,
            isValid: false,
            error: 'Код 1С не найден в номенклатуре'
          })
        }
      }
    })

    setItems(newItems)
  }

  const handleInputChange = (e: any) => {
    const text = e.target.value
    setInputText(text)
    
    if (text.trim()) {
      parseInputText(text)
    } else {
      setItems([])
    }
  }

  const handleQuantityChange = (index: number, value: string) => {
    const newQuantity = value === '' ? 0 : parseInt(value) || 0
    if (newQuantity < 0) return
    
    const newItems = [...items]
    newItems[index].quantity = newQuantity
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    
    // Обновляем текст ввода
    const newText = newItems.map(item => `${item.code_1c} ${item.quantity}`).join('\n')
    setInputText(newText)
  }

  const getProductTypeColor = (productType: string) => {
    switch (productType) {
      case 'коронка':
        return 'bg-blue-100 text-blue-800'
      case 'расширитель':
        return 'bg-green-100 text-green-800'
      case 'башмак':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProductTypeText = (productType: string) => {
    switch (productType) {
      case 'коронка':
        return 'Коронка'
      case 'расширитель':
        return 'Расширитель'
      case 'башмак':
        return 'Башмак'
      default:
        return productType
    }
  }

  const validItemsCount = items.filter(item => item.isValid).length
  const totalQuantity = items.filter(item => item.isValid).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className={className}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Массовый ввод позиций
        </label>
        <div className="text-sm text-gray-500 mb-2">
          Введите коды 1С и количество в формате: <code>УТ-00047870 5</code> (по одному на строку)
        </div>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          rows={6}
          placeholder="УТ-00047870 5&#10;УТ-00047871 3&#10;УТ-00047885 2"
          value={inputText}
          onChange={handleInputChange}
        />
      </div>

      {/* Статистика */}
      {items.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <div className="text-sm text-gray-500">Всего позиций</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{validItemsCount}</div>
              <div className="text-sm text-gray-500">Валидных</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalQuantity}</div>
              <div className="text-sm text-gray-500">Общее количество</div>
            </div>
          </div>
        </div>
      )}

      {/* Список распознанных позиций */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-gray-900">Распознанные позиции:</h4>
          {items.map((item, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${
                item.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {item.code_1c}
                    </span>
                    {item.isValid ? (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <span className="text-red-600 text-sm">{item.error}</span>
                    )}
                  </div>
                  
                  {item.nomenclature && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">
                        {item.nomenclature.name}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Артикул: {item.nomenclature.article}</span>
                        <span>Матрица: {item.nomenclature.matrix}</span>
                        {item.nomenclature.drilling_depth && (
                          <span>Глубина: {item.nomenclature.drilling_depth}</span>
                        )}
                        {item.nomenclature.height && (
                          <span>Высота: {item.nomenclature.height}</span>
                        )}
                        {item.nomenclature.thread && (
                          <span>Резьба: {item.nomenclature.thread}</span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProductTypeColor(item.nomenclature.product_type)}`}>
                          {getProductTypeText(item.nomenclature.product_type)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {item.isValid && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Количество:</label>
                      <input
                        type="text"
                        value={item.quantity.toString()}
                        onChange={(e: any) => handleQuantityChange(index, e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800"
                    title="Удалить позицию"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Инструкция */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Инструкция по вводу:</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Введите код 1С и количество через пробел</li>
          <li>• Каждая позиция на новой строке</li>
          <li>• Если количество не указано, по умолчанию = 1</li>
          <li>• Пример: <code>УТ-00047870 5</code></li>
        </ul>
      </div>
    </div>
  )
}
