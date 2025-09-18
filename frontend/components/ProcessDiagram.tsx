'use client'

import { useState } from 'react'
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'

interface ProcessStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
  duration?: string
  icon?: any
}

interface ProcessDiagramProps {
  title: string
  steps: ProcessStep[]
  isInteractive?: boolean
  onStepClick?: (stepId: string) => void
}

export default function ProcessDiagram({ 
  title, 
  steps, 
  isInteractive = false, 
  onStepClick 
}: ProcessDiagramProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const getStepIcon = (step: ProcessStep) => {
    if (step.icon) return step.icon
    
    switch (step.status) {
      case 'completed':
        return CheckCircleIcon
      case 'active':
        return PlayIcon
      case 'error':
        return ExclamationTriangleIcon
      default:
        return ClockIcon
    }
  }

  const getStepColor = (step: ProcessStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500 text-white'
      case 'active':
        return 'bg-blue-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-300 text-gray-700'
    }
  }

  const handleStepClick = (stepId: string, index: number) => {
    if (isInteractive && onStepClick) {
      onStepClick(stepId)
      setCurrentStep(index)
    }
  }

  const startAnimation = () => {
    setIsPlaying(true)
    let stepIndex = 0
    
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex)
        stepIndex++
      } else {
        setIsPlaying(false)
        clearInterval(interval)
      }
    }, 2000)
  }

  const stopAnimation = () => {
    setIsPlaying(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {isInteractive && (
          <div className="flex space-x-2">
            <button
              onClick={isPlaying ? stopAnimation : startAnimation}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="h-4 w-4 inline mr-1" />
                  Остановить
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 inline mr-1" />
                  Запустить
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-x-auto">
        {/* SVG для стрелок между узлами */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {steps.map((_, index) => {
            if (index === steps.length - 1) return null
            
            const currentX = 64 + (index * 128) // 32 (w-32/2) + 32 (mx-2) + 64 (w-32)
            const nextX = 64 + ((index + 1) * 128)
            const y = 32 // top-8 (32px)
            
            return (
              <g key={index}>
                {/* Плавная стрелка */}
                <path
                  d={`M ${currentX + 24} ${y} Q ${(currentX + nextX) / 2} ${y - 10} ${nextX - 24} ${y}`}
                  stroke="#6B7280"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead-diagram)"
                  className="transition-all duration-200"
                />
              </g>
            )
          })}
          
          {/* Определение стрелки для диаграммы */}
          <defs>
            <marker
              id="arrowhead-diagram"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                fill="#6B7280"
                className="transition-all duration-200"
              />
            </marker>
          </defs>
        </svg>
        
        {/* Шаги процесса */}
        <div className="flex items-start relative min-w-max px-4">
          {steps.map((step, index) => {
            const Icon = getStepIcon(step)
            const isActive = isInteractive ? currentStep === index : step.status === 'active'
            const isCompleted = isInteractive ? currentStep > index : step.status === 'completed'
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-shrink-0 w-32 mx-2 relative z-10">
                {/* Иконка шага */}
                <div
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 cursor-pointer transition-all duration-300
                    ${isInteractive ? 'hover:scale-110' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isActive ? 'bg-blue-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300' : ''}
                  `}
                  onClick={() => handleStepClick(step.id, index)}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                </div>
                
                {/* Контейнер для текста с фиксированной высотой */}
                <div className="text-center w-full min-h-[100px] sm:min-h-[110px] md:min-h-[120px] flex flex-col justify-start">
                  {/* Название шага */}
                  <h4 className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 leading-tight ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </h4>
                  
                  {/* Описание шага */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 sm:mb-2 flex-1 leading-tight">
                    {step.description}
                  </p>
                  
                  {/* Длительность */}
                  {step.duration && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 block">
                      {step.duration}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Дополнительная информация */}
      {isInteractive && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Текущий шаг:</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {steps[currentStep]?.description || 'Процесс завершен'}
          </p>
        </div>
      )}
    </div>
  )
}

// Компонент для отображения сетевого графа процессов
interface ProcessNode {
  id: string
  title: string
  type: 'start' | 'process' | 'decision' | 'end'
  x: number
  y: number
}

interface ProcessConnection {
  from: string
  to: string
  label?: string
}

interface ProcessGraphProps {
  nodes: ProcessNode[]
  connections: ProcessConnection[]
  title: string
}

export function ProcessGraph({ nodes, connections, title }: ProcessGraphProps) {
  const getNodeStyle = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-green-500 text-white'
      case 'end':
        return 'bg-red-500 text-white'
      case 'decision':
        return 'bg-yellow-500 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">{title}</h3>
      
      <div className="relative overflow-x-auto">
        <div className="relative min-w-max" style={{ height: '300px', width: 'max-content', minWidth: '100%' }}>
          {/* Соединения */}
          <svg className="absolute inset-0 w-full h-full">
            {connections.map((conn, index) => {
              const fromNode = nodes.find(n => n.id === conn.from)
              const toNode = nodes.find(n => n.id === conn.to)
              
              if (!fromNode || !toNode) return null
              
              // Вычисляем контрольные точки для плавных кривых
              const dx = toNode.x - fromNode.x
              const dy = toNode.y - fromNode.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              // Определяем тип соединения
              const isHorizontal = Math.abs(dy) < 20
              const isVertical = Math.abs(dx) < 20
              
              let pathData = ''
              let labelX = (fromNode.x + toNode.x) / 2
              let labelY = (fromNode.y + toNode.y) / 2
              
              if (isHorizontal) {
                // Горизонтальное соединение с плавной кривой
                const controlOffset = Math.min(distance * 0.3, 50)
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + controlOffset} ${fromNode.y} ${toNode.x} ${toNode.y}`
                labelY = fromNode.y - 15
              } else if (isVertical) {
                // Вертикальное соединение с плавной кривой
                const controlOffset = Math.min(Math.abs(dy) * 0.3, 30)
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x} ${fromNode.y + controlOffset} ${toNode.x} ${toNode.y}`
                labelX = fromNode.x + 20
              } else {
                // Диагональное соединение с плавной кривой
                const controlOffsetX = dx * 0.3
                const controlOffsetY = dy * 0.3
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + controlOffsetX} ${fromNode.y + controlOffsetY} ${toNode.x} ${toNode.y}`
                labelY = (fromNode.y + toNode.y) / 2 - 15
              }
              
              return (
                <g key={index}>
                  {/* Плавная кривая */}
                  <path
                    d={pathData}
                    stroke="#6B7280"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-200 hover:stroke-blue-500"
                  />
                  
                  {/* Фон для текста */}
                  {conn.label && (
                    <rect
                      x={labelX - 20}
                      y={labelY - 8}
                      width="40"
                      height="16"
                      fill="white"
                      fillOpacity="0.9"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                      rx="4"
                      className="dark:fill-gray-800 dark:stroke-gray-600"
                    />
                  )}
                  
                  {/* Текст на стрелке */}
                  {conn.label && (
                    <text
                      x={labelX}
                      y={labelY + 2}
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-700 dark:fill-gray-200 pointer-events-none"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              )
            })}
            
            {/* Определение стрелки */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6B7280"
                  className="transition-all duration-200"
                />
              </marker>
            </defs>
          </svg>
          
          {/* Узлы */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`
                absolute flex items-center justify-center text-center text-xs font-medium
                ${getNodeStyle(node.type)}
                ${node.type === 'decision' ? 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transform rotate-45' : 'w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-lg'}
              `}
              style={{
                left: node.x - (node.type === 'decision' ? 24 : 32),
                top: node.y - 32,
              }}
            >
              <span className={`${node.type === 'decision' ? 'transform -rotate-45' : ''} px-1`}>
                {node.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
