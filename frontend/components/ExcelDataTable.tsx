'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  TableCellsIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface ExcelRow {
  id: string
  наименование: string
  запрашиваемый_артикул: string
  количество: number
  единица_измерения: string
  наш_артикул?: string
  артикул_bl?: string
  номер_1с?: string
  стоимость?: number
  статус_сопоставления?: 'matched' | 'unmatched' | 'pending'
  уверенность?: number
  варианты_подбора?: Array<{
    наименование: string
    наш_артикул: string
    артикул_bl?: string
    номер_1с?: string
    уверенность: number
    тип_совпадения?: string
    enhanced_query?: string
    original_query?: string
    ai_analysis?: string
  }>
  ai_analysis?: {
    category?: string
    keywords?: string[]
    synonyms?: string[]
    enhanced_queries?: string[]
    analysis?: string
  }
  search_type?: string
}

interface ExcelDataTableProps {
  data: ExcelRow[]
  onDataChange: (data: ExcelRow[]) => void
  onAutoMatch: () => void
  onSave: () => void
  isMatching: boolean
  isSaving?: boolean
  savedVariants?: {[key: string]: number}
  onSaveVariant?: (rowId: string, variantIndex: number) => void
  onSaveConfirmedMatch?: (rowData: ExcelRow, variant: any) => void
}

export default function ExcelDataTable({ 
  data, 
  onDataChange, 
  onAutoMatch, 
  onSave, 
  isMatching, 
  isSaving = false,
  savedVariants = {},
  onSaveVariant,
  onSaveConfirmedMatch
}: ExcelDataTableProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; field: string } | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)
  const [selectedVariant, setSelectedVariant] = useState<{rowId: string, variantIndex: number} | null>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<{[rowId: string]: number}>({})

  // Автофокус на input при редактировании
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      // Проверяем, что это input элемент, а не select
      if (inputRef.current.tagName === 'INPUT') {
        (inputRef.current as HTMLInputElement).select()
      }
    }
  }, [editingCell])

  const handleCellClick = (rowId: string, field: string, currentValue: any) => {
    setSelectedCell({ rowId, field })
    setEditingCell({ rowId, field })
    setEditValue(String(currentValue || ''))
  }

  const handleCellDoubleClick = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    setEditValue(String(currentValue || ''))
  }

  const handleCellSave = () => {
    if (!editingCell) return

    const updatedData = data.map(row => {
      if (row.id === editingCell.rowId) {
        let processedValue: any = editValue
        
        // Обработка числовых полей
        if (['количество', 'стоимость', 'уверенность'].includes(editingCell.field)) {
          processedValue = parseFloat(editValue) || 0
        }
        
        return {
          ...row,
          [editingCell.field]: processedValue
        }
      }
      return row
    })

    onDataChange(updatedData)
    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCellSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCellCancel()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleCellSave()
      // Переход к следующей ячейке
      moveToNextCell()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    
    const pastedText = e.clipboardData.getData('text')
    
    if (!pastedText.trim()) return

    // Проверяем, содержит ли вставленный текст несколько строк
    // Убираем символы возврата каретки и разделяем по символам новой строки
    const lines = pastedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(line => line.trim())
    
    if (lines.length === 1) {
      // Обычная вставка одной ячейки
      if (editingCell) {
        setEditValue(pastedText.trim())
      } else {
        // Если ячейка не в режиме редактирования, переводим её в этот режим
        const target = e.currentTarget as HTMLElement
        const rowId = target.closest('[data-row-id]')?.getAttribute('data-row-id')
        const field = target.getAttribute('data-field')
        if (rowId && field) {
          setEditingCell({ rowId, field })
          setEditValue(pastedText.trim())
        }
      }
      return
    }

    // Множественная вставка - парсим данные
    try {
      const parsedData = parseMultipleRowsData(lines)
      
      if (parsedData.length === 0) {
        // Если не удалось распарсить, вставляем как обычный текст
        if (editingCell) {
          setEditValue(pastedText.trim())
        } else {
          const target = e.currentTarget as HTMLElement
          const rowId = target.closest('[data-row-id]')?.getAttribute('data-row-id')
          const field = target.getAttribute('data-field')
          if (rowId && field) {
            setEditingCell({ rowId, field })
            setEditValue(pastedText.trim())
          }
        }
        return
      }

      // Определяем целевую строку для вставки
      let targetRowId: string
      if (editingCell) {
        targetRowId = editingCell.rowId
      } else {
        const target = e.currentTarget as HTMLElement
        const rowId = target.closest('[data-row-id]')?.getAttribute('data-row-id')
        if (!rowId) return
        targetRowId = rowId
      }

      // Находим текущую строку и индекс
      const currentRowIndex = data.findIndex(row => row.id === targetRowId)
      if (currentRowIndex === -1) return

      // Создаем новые строки
      const newRows: ExcelRow[] = parsedData.map((rowData, index) => ({
        id: `new_${Date.now()}_${index}`,
        наименование: rowData[0] || '',
        запрашиваемый_артикул: rowData[1] || '',
        количество: parseFloat(rowData[2]) || 1,
        единица_измерения: rowData[3] || 'шт',
        наш_артикул: rowData[4] || '',
        артикул_bl: rowData[5] || '',
        номер_1с: rowData[6] || '',
        стоимость: parseFloat(rowData[7]) || 0,
        статус_сопоставления: 'pending' as const,
        уверенность: 0
      }))

      // Вставляем новые строки начиная с текущей строки (не заменяем её)
      const updatedData = [
        ...data.slice(0, currentRowIndex),
        ...newRows,
        ...data.slice(currentRowIndex)
      ]

      onDataChange(updatedData)
      setEditingCell(null)
      setEditValue('')
      
    } catch (error) {
      console.error('Ошибка при парсинге множественных данных:', error)
      // В случае ошибки вставляем как обычный текст
      if (editingCell) {
        setEditValue(pastedText.trim())
      } else {
        const target = e.currentTarget as HTMLElement
        const rowId = target.closest('[data-row-id]')?.getAttribute('data-row-id')
        const field = target.getAttribute('data-field')
        if (rowId && field) {
          setEditingCell({ rowId, field })
          setEditValue(pastedText.trim())
        }
      }
    }
  }

  const parseMultipleRowsData = (lines: string[]): string[][] => {
    // Определяем разделители (табуляция или точка с запятой)
    const firstLine = lines[0]
    const hasTabs = firstLine.includes('\t')
    const hasSemicolons = firstLine.includes(';')
    
    let delimiter = '\t' // По умолчанию табуляция
    if (hasSemicolons && !hasTabs) {
      delimiter = ';'
    } else if (hasTabs) {
      delimiter = '\t'
    }

    // Парсим все строки
    return lines.map(line => 
      line.split(delimiter).map(col => col.trim())
    )
  }

  const moveToNextCell = () => {
    if (!selectedCell) return
    
    const fields = ['наименование', 'запрашиваемый_артикул', 'количество', 'единица_измерения', 'наш_артикул', 'артикул_bl', 'номер_1с', 'стоимость', 'уверенность']
    const currentFieldIndex = fields.indexOf(selectedCell.field)
    
    if (currentFieldIndex < fields.length - 1) {
      // Переход к следующему полю в той же строке
      const nextField = fields[currentFieldIndex + 1]
      setSelectedCell({ ...selectedCell, field: nextField })
    } else {
      // Переход к первой ячейке следующей строки
      const currentRowIndex = data.findIndex(row => row.id === selectedCell.rowId)
      if (currentRowIndex < data.length - 1) {
        const nextRow = data[currentRowIndex + 1]
        setSelectedCell({ rowId: nextRow.id, field: fields[0] })
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }

  const addNewRow = () => {
    const newRow: ExcelRow = {
      id: `new_${Date.now()}`,
      наименование: '',
      запрашиваемый_артикул: '',
      количество: 1,
      единица_измерения: 'шт',
      статус_сопоставления: 'pending'
    }
    onDataChange([...data, newRow])
  }

  const deleteRow = (rowId: string) => {
    onDataChange(data.filter(row => row.id !== rowId))
  }

  const handleVariantClick = (rowId: string, variantIndex: number) => {
    setSelectedVariant({rowId, variantIndex})
    setShowVariantModal(true)
  }

  const handleVariantSelect = (rowId: string, variantIndex: number) => {
    const row = data.find(r => r.id === rowId)
    if (!row || !row.варианты_подбора) return

    const variant = row.варианты_подбора[variantIndex]
    if (!variant) return

    // Обновляем основные поля строки
    const updatedData = data.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          наш_артикул: variant.наш_артикул,
          артикул_bl: variant.артикул_bl || '',
          номер_1с: variant.номер_1с || '',
          статус_сопоставления: 'matched' as const,
          уверенность: variant.уверенность
        }
      }
      return r
    })

    // Сохраняем выбранный вариант
    setSelectedVariants(prev => ({
      ...prev,
      [rowId]: variantIndex
    }))

    onDataChange(updatedData)
    
    // Сохраняем выбор варианта
    if (onSaveVariant) {
      onSaveVariant(rowId, variantIndex)
    }
    
    // Сохраняем подтвержденное сопоставление
    if (onSaveConfirmedMatch) {
      onSaveConfirmedMatch(row, variant)
    }
    
    setShowVariantModal(false)
  }

  const getSelectedVariant = (rowId: string) => {
    const selectedIndex = selectedVariants[rowId]
    if (selectedIndex === undefined) return null
    
    const row = data.find(r => r.id === rowId)
    return row?.варианты_подбора?.[selectedIndex] || null
  }

  const getStatusIcon = (status?: string, searchType?: string) => {
    switch (status) {
      case 'matched': 
        if (searchType === 'enhanced_ai_match') {
          return (
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400" title="Найдено с помощью улучшенного ИИ поиска">
                🤖
              </span>
            </div>
          )
        }
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'unmatched': return <XCircleIcon className="h-5 w-5 text-red-500" />
      default: return <div className="h-5 w-5 rounded-full bg-yellow-400" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800'
      case 'unmatched': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Данные для сопоставления
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={addNewRow}
              className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить строку</span>
            </button>
            <button
              onClick={onAutoMatch}
              disabled={isMatching || data.length === 0}
              className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span>{isMatching ? 'Сопоставление...' : 'Автоматическое сопоставление'}</span>
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || data.length === 0}
              className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span>{isSaving ? 'Сохранение...' : 'Сохранить результаты'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[600px] border border-gray-300 dark:border-gray-600">
        <div className="inline-block min-w-full">
          {/* Excel-подобная таблица */}
          <div className="grid gap-0 border-b border-gray-300 dark:border-gray-600" style={{gridTemplateColumns: '60px 200px 120px 80px 80px 120px 120px 120px 100px 80px 150px 150px 150px 150px 150px 150px 150px 150px 150px 150px 60px'}}>
            {/* Заголовки */}
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Статус
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Наименование
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Запрашиваемый артикул
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Кол-во
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Ед. изм.
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Наш артикул
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Артикул BL
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Номер в 1С
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Стоимость
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Уверенность
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 1
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 2
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 3
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 4
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 5
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 6
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 7
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 8
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 9
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
              Вариант 10
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
              Действия
            </div>
          </div>

          {/* Строки данных */}
          {data.map((row, rowIndex) => (
            <div key={row.id} data-row-id={row.id} className="grid gap-0 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800" style={{gridTemplateColumns: '60px 200px 120px 80px 80px 120px 120px 120px 100px 80px 150px 150px 150px 150px 150px 150px 150px 150px 150px 150px 60px'}}>
              {/* Статус */}
              <div className="p-2 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <div className="flex items-center">
                  {getStatusIcon(row.статус_сопоставления, row.search_type)}
                </div>
              </div>

              {/* Наименование */}
              <div 
                data-field="наименование"
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'наименование' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'наименование', row.наименование)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'наименование', row.наименование)}
                onPaste={handlePaste}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'наименование' ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm truncate">
                    {row.наименование || ''}
                  </span>
                )}
              </div>

              {/* Запрашиваемый артикул */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'запрашиваемый_артикул' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'запрашиваемый_артикул', row.запрашиваемый_артикул)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'запрашиваемый_артикул', row.запрашиваемый_артикул)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'запрашиваемый_артикул' ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm truncate">
                    {row.запрашиваемый_артикул || ''}
                  </span>
                )}
              </div>

              {/* Количество */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'количество' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'количество', row.количество)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'количество', row.количество)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'количество' ? (
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.01"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm">
                    {row.количество || ''}
                  </span>
                )}
              </div>

              {/* Единица измерения */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'единица_измерения' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'единица_измерения', row.единица_измерения)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'единица_измерения', row.единица_измерения)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'единица_измерения' ? (
                  <select
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  >
                    <option value="шт">шт</option>
                    <option value="кг">кг</option>
                    <option value="л">л</option>
                    <option value="м">м</option>
                    <option value="м²">м²</option>
                    <option value="м³">м³</option>
                    <option value="упак">упак</option>
                    <option value="компл">компл</option>
                  </select>
                ) : (
                  <span className="text-sm">
                    {row.единица_измерения || ''}
                  </span>
                )}
              </div>

              {/* Наш артикул */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'наш_артикул' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'наш_артикул', row.наш_артикул)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'наш_артикул', row.наш_артикул)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'наш_артикул' ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm truncate">
                    {row.наш_артикул || ''}
                  </span>
                )}
              </div>

              {/* Артикул BL */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'артикул_bl' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'артикул_bl', row.артикул_bl)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'артикул_bl', row.артикул_bl)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'артикул_bl' ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm truncate">
                    {row.артикул_bl || ''}
                  </span>
                )}
              </div>

              {/* Номер в 1С */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'номер_1с' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'номер_1с', row.номер_1с)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'номер_1с', row.номер_1с)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'номер_1с' ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm truncate">
                    {row.номер_1с || ''}
                  </span>
                )}
              </div>

              {/* Стоимость */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'стоимость' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'стоимость', row.стоимость)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'стоимость', row.стоимость)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'стоимость' ? (
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.01"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm">
                    {row.стоимость || ''}
                  </span>
                )}
              </div>

              {/* Уверенность */}
              <div 
                className={`p-1 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-h-[40px] flex items-center ${
                  selectedCell?.rowId === row.id && selectedCell?.field === 'уверенность' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCellClick(row.id, 'уверенность', row.уверенность)}
                onDoubleClick={() => handleCellDoubleClick(row.id, 'уверенность', row.уверенность)}
              >
                {editingCell?.rowId === row.id && editingCell?.field === 'уверенность' ? (
                  <input
                    ref={inputRef}
                    type="number"
                    min="0"
                    max="100"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onPaste={handlePaste}
                    onBlur={handleCellSave}
                    className="w-full h-full border-none outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className="text-sm">
                    {row.уверенность ? `${row.уверенность}%` : ''}
                  </span>
                )}
              </div>

              {/* Варианты подбора */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((variantIndex) => {
              const variant = row.варианты_подбора?.[variantIndex]
              const isSelected = selectedVariants[row.id] === variantIndex || savedVariants[row.id] === variantIndex
              return (
                <div key={variantIndex} className="p-1 border-r border-gray-200 dark:border-gray-700 min-h-[40px] flex flex-col justify-center">
                  {variant ? (
                    <div className="text-xs">
                      <div className="font-medium text-gray-900 dark:text-white truncate" title={variant.наименование}>
                        {variant.наименование}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {variant.наш_артикул}
                      </div>
                      <div className="text-green-600 dark:text-green-400 text-xs">
                        {variant.уверенность}%
                      </div>
                      {variant.тип_совпадения && (
                        <div className="text-blue-600 dark:text-blue-400 text-xs">
                          {variant.тип_совпадения}
                        </div>
                      )}
                      {variant.enhanced_query && (
                        <div className="text-purple-600 dark:text-purple-400 text-xs" title={`Улучшенный запрос: ${variant.enhanced_query}`}>
                          🤖 ИИ
                        </div>
                      )}
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleVariantClick(row.id, variantIndex)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Просмотреть детали"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleVariantSelect(row.id, variantIndex)}
                          className={`p-1 rounded ${
                            isSelected 
                              ? 'bg-green-600 text-white' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title="Выбрать этот вариант"
                        >
                          <CheckIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
                      -
                    </div>
                  )}
                </div>
              )
            })}

              {/* Действия */}
              <div className="p-2 flex items-center justify-center">
                <button
                  onClick={() => deleteRow(row.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Удалить строку"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <TableCellsIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Нет данных для отображения</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Добавьте строки или вставьте данные из Excel
          </p>
        </div>
      )}

      {/* Модальное окно для просмотра варианта */}
      {showVariantModal && selectedVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Детали варианта подбора
              </h3>
              <button
                onClick={() => setShowVariantModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {(() => {
              const row = data.find(r => r.id === selectedVariant.rowId)
              const variant = row?.варианты_подбора?.[selectedVariant.variantIndex]
              
              if (!variant) return null
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Наименование
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {variant.наименование}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Уверенность
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {variant.уверенность}%
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Наш артикул
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {variant.наш_артикул}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Артикул BL
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {variant.артикул_bl || 'Не указан'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Номер 1С
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {variant.номер_1с || 'Не указан'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Тип совпадения
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {variant.тип_совпадения || 'Не указан'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleVariantSelect(selectedVariant.rowId, selectedVariant.variantIndex)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Выбрать этот вариант
                    </button>
                    <button
                      onClick={() => setShowVariantModal(false)}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
