'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks'
import { 
  PaperAirplaneIcon, 
  DocumentArrowUpIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  files?: File[]
  matchingResults?: MatchingResult[]
  isProcessing?: boolean
}

interface MatchingResult {
  id: string
  contractor_article: string
  description: string
  matched: boolean
  agb_article?: string
  bl_article?: string
  match_confidence?: number
  packaging_factor?: number
  recalculated_quantity?: number
  nomenclature?: {
    id: number
    name: string
    code_1c: string
    article: string
  }
}

interface AIMatchingChatProps {
  onClose?: () => void
}

export default function AIMatchingChat({ onClose }: AIMatchingChatProps) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Загружаем историю чата при инициализации
  useEffect(() => {
    loadChatHistory()
  }, [])

  const loadChatHistory = async () => {
    if (!token) return

    try {
      setIsLoadingHistory(true)
      
      // Получаем последнюю сессию пользователя
      const sessionsResponse = await fetch('http://localhost:8000/api/v1/chat/sessions/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json()
        
        if (sessions.length > 0) {
          // Загружаем последнюю сессию с сообщениями
          const lastSession = sessions[0]
          setCurrentSessionId(lastSession.id)
          
          const sessionResponse = await fetch(`http://localhost:8000/api/v1/chat/sessions/${lastSession.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            const chatMessages = sessionData.messages?.map((msg: any) => ({
              id: msg.id.toString(),
              type: msg.message_type,
              content: msg.content,
              timestamp: new Date(msg.created_at),
              files: msg.files_data ? JSON.parse(msg.files_data) : undefined,
              matchingResults: msg.matching_results ? JSON.parse(msg.matching_results) : undefined,
              isProcessing: msg.is_processing
            })) || []
            
            setMessages(chatMessages)
          }
        } else {
          // Создаем новую сессию и добавляем приветственное сообщение
          await createNewSession()
          setMessages([{
            id: '1',
            type: 'ai',
            content: 'Привет! Я ИИ-агент для сопоставления артикулов. Загрузите любой документ (PDF, Excel, изображение) или введите текст, и я помогу найти соответствующие позиции в базе данных АГБ.',
            timestamp: new Date()
          }])
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки истории чата:', error)
      // Создаем новую сессию при ошибке
      await createNewSession()
      setMessages([{
        id: '1',
        type: 'ai',
        content: 'Привет! Я ИИ-агент для сопоставления артикулов. Загрузите любой документ (PDF, Excel, изображение) или введите текст, и я помогу найти соответствующие позиции в базе данных АГБ.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const createNewSession = async () => {
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/sessions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Чат от ${new Date().toLocaleString('ru-RU')}`
        })
      })

      if (response.ok) {
        const session = await response.json()
        setCurrentSessionId(session.id)
      }
    } catch (error) {
      console.error('Ошибка создания сессии:', error)
    }
  }

  const saveMessage = async (message: ChatMessage) => {
    if (!token || !currentSessionId) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/chat/sessions/${currentSessionId}/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message.content,
          files_data: message.files ? JSON.stringify(message.files) : null,
          matching_results: message.matchingResults ? JSON.stringify(message.matchingResults) : null
        })
      })

      if (!response.ok) {
        console.error('Ошибка сохранения сообщения')
      }
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const validFiles = newFiles.filter(file => {
      const maxSize = 100 * 1024 * 1024 // 100MB
      const allowedTypes = [
        // PDF документы
        'application/pdf',
        // Excel файлы
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Word документы
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Текстовые файлы
        'text/plain',
        'text/csv',
        'text/rtf',
        // Изображения
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/webp',
        'image/svg+xml',
        // PowerPoint
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // OpenDocument
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
        // Другие форматы
        'application/rtf',
        'application/x-rtf',
        'text/richtext'
      ]
      
      if (file.size > maxSize) {
        alert(`Файл ${file.name} слишком большой. Максимальный размер: 100MB`)
        return false
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Неподдерживаемый формат файла: ${file.name}`)
        return false
      }
      
      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
  }


  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return

    // Создаем новую сессию, если её нет
    if (!currentSessionId) {
      await createNewSession()
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      files: selectedFiles.length > 0 ? [...selectedFiles] : undefined
    }

    setMessages(prev => [...prev, userMessage])
    
    // Сохраняем сообщение пользователя в БД
    await saveMessage(userMessage)
    
    setInputMessage('')
    setSelectedFiles([])
    setIsProcessing(true)

    // Добавляем сообщение о обработке
    const processingMessage: ChatMessage = {
      id: `processing-${Date.now()}`,
      type: 'ai',
      content: 'Обрабатываю ваш запрос...',
      timestamp: new Date(),
      isProcessing: true
    }

    setMessages(prev => [...prev, processingMessage])

    try {
      const formData = new FormData()
      formData.append('message', inputMessage)
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file)
      })

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('http://localhost:8000/api/v1/article-matching/ai-process/', {
        method: 'POST',
        headers,
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        
        // Удаляем сообщение о обработке
        setMessages(prev => prev.filter(msg => !msg.isProcessing))
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: result.message || 'Обработка завершена',
          timestamp: new Date(),
          matchingResults: result.matching_results || []
        }

        setMessages(prev => [...prev, aiMessage])
        
        // Сохраняем ответ ИИ в БД
        await saveMessage(aiMessage)
      } else {
        const error = await response.json()
        setMessages(prev => prev.filter(msg => !msg.isProcessing))
        
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: `Ошибка: ${error.detail || 'Не удалось обработать запрос'}`,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, errorMessage])
        
        // Сохраняем сообщение об ошибке в БД
        await saveMessage(errorMessage)
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      setMessages(prev => prev.filter(msg => !msg.isProcessing))
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Ошибка соединения с сервером. Проверьте подключение.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
      
      // Сохраняем сообщение об ошибке в БД
      await saveMessage(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️'
    } else if (file.type.includes('pdf')) {
      return '📄'
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return '📊'
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return '📝'
    } else if (file.type.includes('csv')) {
      return '📈'
    } else if (file.type.includes('powerpoint') || file.type.includes('presentation')) {
      return '📽️'
    } else if (file.type.includes('text') || file.type.includes('plain')) {
      return '📄'
    } else if (file.type.includes('rtf')) {
      return '📄'
    }
    return '📎'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ИИ-агент сопоставления</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Загрузите документ для анализа</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Загрузка истории чата...</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-purple-600 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {message.files && message.files.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-sm font-medium">Прикрепленные файлы:</p>
                  {message.files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span>{getFileIcon(file)}</span>
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-500">({formatFileSize(file.size)})</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap">{message.content}</div>

              {message.matchingResults && message.matchingResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">Результаты сопоставления:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-600">
                          <th className="text-left py-2 px-3">Артикул контрагента</th>
                          <th className="text-left py-2 px-3">Описание</th>
                          <th className="text-left py-2 px-3">Артикул АГБ</th>
                          <th className="text-left py-2 px-3">Уверенность</th>
                          <th className="text-left py-2 px-3">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {message.matchingResults.map((result) => (
                          <tr key={result.id} className="border-b border-gray-200 dark:border-gray-600">
                            <td className="py-2 px-3 font-medium">{result.contractor_article}</td>
                            <td className="py-2 px-3 max-w-xs truncate">{result.description}</td>
                            <td className="py-2 px-3">
                              {result.agb_article ? (
                                <span className="text-green-600 dark:text-green-400">{result.agb_article}</span>
                              ) : (
                                <span className="text-red-500 dark:text-red-400 italic">Не найдено</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {result.match_confidence ? (
                                <span className={getConfidenceColor(result.match_confidence)}>
                                  {result.match_confidence}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {result.matched ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {message.isProcessing && (
                <div className="flex items-center space-x-2 mt-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Обработка...</span>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {message.timestamp.toLocaleTimeString('ru-RU')}
              </div>
            </div>
          </div>
        )))}
        <div ref={messagesEndRef} />
      </div>

      {/* Область ввода */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {/* Выбранные файлы */}
        {selectedFiles.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm"
                >
                  <span>{getFileIcon(file)}</span>
                  <span className="truncate max-w-32">{file.name}</span>
                  <span className="text-gray-500">({formatFileSize(file.size)})</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Поле ввода с кнопкой добавления файлов */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение или опишите, что нужно найти в документе..."
              className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              rows={2}
              disabled={isProcessing}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-2 top-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              title="Добавить файлы"
            >
              <DocumentArrowUpIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={sendMessage}
            disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isProcessing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            <span>Отправить</span>
          </button>
        </div>

        {/* Скрытый input для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,.rtf,.ppt,.pptx,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.svg"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Подсказка о поддерживаемых форматах */}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Поддерживаются: PDF, Word, Excel, PowerPoint, изображения, текстовые файлы (до 100MB)
        </p>
      </div>
    </div>
  )
}
