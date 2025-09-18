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
        {/* SVG для простых стрелок между узлами */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Простая стрелка */}
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
                fill="#374151"
              />
            </marker>
          </defs>
          
          {steps.map((_, index) => {
            if (index === steps.length - 1) return null
            
            const currentX = 64 + (index * 160) // Увеличили расстояние между узлами
            const nextX = 64 + ((index + 1) * 160)
            const y = 32
            
            return (
              <g key={index}>
                {/* Простая стрелка */}
                <line
                  x1={currentX + 32}
                  y1={y}
                  x2={nextX - 32}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-diagram)"
                  className="transition-all duration-200"
                />
              </g>
            )
          })}
        </svg>
        
        {/* Шаги процесса */}
        <div className="flex items-start relative min-w-max px-4">
          {steps.map((step, index) => {
            const Icon = getStepIcon(step)
            const isActive = isInteractive ? currentStep === index : step.status === 'active'
            const isCompleted = isInteractive ? currentStep > index : step.status === 'completed'
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-shrink-0 w-40 mx-4 relative z-10">
                {/* Иконка шага */}
                <div
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 cursor-pointer transition-all duration-300 shadow-lg
                    ${isInteractive ? 'hover:scale-110 hover:shadow-xl' : ''}
                    ${isCompleted ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-green-200' : ''}
                    ${isActive ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-200' : ''}
                    ${!isActive && !isCompleted ? 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-300 shadow-gray-200' : ''}
                  `}
                  onClick={() => handleStepClick(step.id, index)}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 drop-shadow-sm" />
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
            <defs>
              {/* Простая стрелка */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#374151"
                />
              </marker>
            </defs>
            
            {connections.map((conn, index) => {
              const fromNode = nodes.find(n => n.id === conn.from)
              const toNode = nodes.find(n => n.id === conn.to)
              
              if (!fromNode || !toNode) return null
              
              // Простые кривые Безье
              const dx = toNode.x - fromNode.x
              const dy = toNode.y - fromNode.y
              
              // Определяем тип соединения
              const isHorizontal = Math.abs(dy) < 30
              const isVertical = Math.abs(dx) < 30
              
              let pathData = ''
              let labelX = (fromNode.x + toNode.x) / 2
              let labelY = (fromNode.y + toNode.y) / 2
              
              if (isHorizontal) {
                // Простая горизонтальная кривая
                const controlOffset = dx * 0.3
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + controlOffset} ${fromNode.y - 15} ${toNode.x} ${toNode.y}`
                labelY = fromNode.y - 20
              } else if (isVertical) {
                // Простая вертикальная кривая
                const controlOffset = dy * 0.3
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + 20} ${fromNode.y + controlOffset} ${toNode.x} ${toNode.y}`
                labelX = fromNode.x + 25
              } else {
                // Простая диагональная кривая
                const controlOffsetX = dx * 0.3
                const controlOffsetY = dy * 0.3
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + controlOffsetX} ${fromNode.y + controlOffsetY - 10} ${toNode.x} ${toNode.y}`
                labelY = (fromNode.y + toNode.y) / 2 - 15
              }
              
              return (
                <g key={index}>
                  {/* Простая кривая */}
                  <path
                    d={pathData}
                    stroke="#374151"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-200"
                  />
                  
                  {/* Простой фон для текста */}
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
                  
                  {/* Простой текст */}
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
