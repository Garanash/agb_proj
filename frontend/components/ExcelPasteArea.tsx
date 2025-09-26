'use client'

import { useState } from 'react'
import { 
  DocumentArrowUpIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ExcelPasteAreaProps {
  onDataPasted: (data: any[]) => void
  onFileUploaded: (file: File) => void
  onClearData: () => void
  isProcessing: boolean
}

export default function ExcelPasteArea({ 
  onDataPasted, 
  onFileUploaded, 
  onClearData,
  isProcessing 
}: ExcelPasteAreaProps) {
  const [pasteText, setPasteText] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [pasteSuccess, setPasteSuccess] = useState(false)

  const parseExcelData = (text: string) => {
    try {
      // Разбиваем текст на строки
      const lines = text.trim().split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('Нет данных для обработки')
      }

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

      // Парсим данные
      const parsedData = lines.map((line, index) => {
        const columns = line.split(delimiter).map(col => col.trim())
        
        // Создаем объект строки
        const row = {
          id: `row_${index + 1}`,
          наименование: columns[0] || '',
          запрашиваемый_артикул: columns[1] || '',
          количество: parseFloat(columns[2]) || 1,
          единица_измерения: columns[3] || 'шт',
          наш_артикул: columns[4] || '',
          артикул_bl: columns[5] || '',
          номер_1с: columns[6] || '',
          стоимость: parseFloat(columns[7]) || 0,
          статус_сопоставления: 'pending' as const,
          уверенность: 0
        }

        return row
      })

      return parsedData
    } catch (error) {
      throw new Error(`Ошибка парсинга данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handlePaste = () => {
    if (!pasteText.trim()) {
      setPasteError('Вставьте данные из Excel')
      return
    }

    try {
      setPasteError('')
      const parsedData = parseExcelData(pasteText)
      
      if (parsedData.length === 0) {
        throw new Error('Не удалось извлечь данные')
      }

      onDataPasted(parsedData)
      setPasteSuccess(true)
      setPasteText('')
      
      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => setPasteSuccess(false), 3000)
    } catch (error) {
      setPasteError(error instanceof Error ? error.message : 'Ошибка обработки данных')
      setPasteSuccess(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileUploaded(file)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPasteText(e.target.value)
    setPasteError('')
    setPasteSuccess(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Загрузка данных
      </h2>
      
      <div className="space-y-6">
        {/* Область для вставки из Excel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Вставка данных из Excel
          </label>
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center">
                <ClipboardDocumentIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Скопируйте данные из Excel и вставьте их в поле ниже
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Поддерживаются колонки: Наименование, Запрашиваемый артикул, Кол-во, Ед. изм., Наш артикул, Артикул BL, Номер в 1С, Стоимость
                </p>
              </div>
            </div>
            
            <textarea
              value={pasteText}
              onChange={handleTextareaChange}
              placeholder="Вставьте сюда данные из Excel (Ctrl+V)..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={handlePaste}
                  disabled={isProcessing || !pasteText.trim()}
                  className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                  <span>Обработать данные</span>
                </button>
                
                <button
                  onClick={() => {
                    setPasteText('')
                    setPasteError('')
                    setPasteSuccess(false)
                  }}
                  className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Очистить поле
                </button>

                <button
                  onClick={onClearData}
                  className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                >
                  Очистить таблицу
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {pasteText.length} символов
              </div>
            </div>
          </div>
        </div>

        {/* Разделитель */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">или</span>
          </div>
        </div>

        {/* Загрузка файла */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Загрузка Excel файла
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors hover:border-gray-400 dark:hover:border-gray-500">
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Выберите Excel файл
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Поддерживаются файлы .xlsx, .xls (максимум 10MB)
              </p>
            </div>
            
            <label className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 cursor-pointer shadow-sm hover:shadow-md transition-colors">
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              {isProcessing ? 'Обработка...' : 'Выберите файл'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Сообщения об ошибках и успехе */}
        {pasteError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm text-red-800 dark:text-red-300">
                {pasteError}
              </div>
            </div>
          </div>
        )}

        {pasteSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <div className="text-sm text-green-800 dark:text-green-300">
                Данные успешно обработаны и добавлены в таблицу!
              </div>
            </div>
          </div>
        )}

        {/* Индикатор обработки */}
        {isProcessing && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Обработка данных...</p>
          </div>
        )}
      </div>
    </div>
  )
}
