'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth'

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

interface NomenclatureSelectorProps {
  onSelect: (item: NomenclatureItem | null) => void
  selectedItem?: NomenclatureItem | null
  placeholder?: string
  className?: string
}

export default function NomenclatureSelector({ 
  onSelect, 
  selectedItem, 
  placeholder = "Выберите номенклатуру...",
  className = ""
}: NomenclatureSelectorProps) {
  const { token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [nomenclature, setNomenclature] = useState<NomenclatureItem[]>([])
  const [filteredNomenclature, setFilteredNomenclature] = useState<NomenclatureItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Загружаем номенклатуру при монтировании компонента или изменении токена
  useEffect(() => {
    if (token) {
      fetchNomenclature()
    }
  }, [token])

  // Фильтруем номенклатуру при изменении поискового запроса
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNomenclature(nomenclature)
    } else {
      const filtered = nomenclature.filter(item =>
        item.code_1c.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.matrix.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredNomenclature(filtered)
    }
  }, [searchTerm, nomenclature])

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
        setFilteredNomenclature(data)
      } else {
        console.error('Ошибка при загрузке номенклатуры:', response.statusText)
      }
    } catch (error) {
      console.error('Ошибка при загрузке номенклатуры:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (item: NomenclatureItem) => {
    onSelect(item)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onSelect(null as any)
    setSearchTerm('')
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

  return (
    <div className={`relative ${className}`}>
      {/* Поле выбора */}
      <div
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          {selectedItem ? (
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">
                {selectedItem.code_1c} - {selectedItem.name}
              </div>
              <div className="text-sm text-gray-500">
                {selectedItem.article} | {selectedItem.matrix}
                {selectedItem.drilling_depth && ` | ${selectedItem.drilling_depth}`}
                {selectedItem.height && ` | ${selectedItem.height}`}
                {selectedItem.thread && ` | ${selectedItem.thread}`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Тип: {getProductTypeText(selectedItem.product_type)}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <div className="flex items-center space-x-2">
            {selectedItem && (
              <button
                onClick={(e: any) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Очистить выбор"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            {isOpen ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Выпадающий список */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Поиск */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Поиск по коду, названию, артикулу..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                onClick={(e: any) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Список номенклатуры */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Загрузка номенклатуры...
              </div>
            ) : filteredNomenclature.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Номенклатура не найдена' : 'Номенклатура пуста'}
              </div>
            ) : (
              filteredNomenclature.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {item.code_1c}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProductTypeColor(item.product_type)}`}>
                          {getProductTypeText(item.product_type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 mb-1">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 space-x-2">
                        <span>Артикул: {item.article}</span>
                        <span>Матрица: {item.matrix}</span>
                        {item.drilling_depth && <span>Глубина: {item.drilling_depth}</span>}
                        {item.height && <span>Высота: {item.height}</span>}
                        {item.thread && <span>Резьба: {item.thread}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Оверлей для закрытия при клике вне компонента */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
