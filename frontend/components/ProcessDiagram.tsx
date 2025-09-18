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
        {/* SVG для красивых стрелок между узлами */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Градиент для стрелок */}
            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
            </linearGradient>
            
            {/* Фильтр для свечения */}
            <filter id="arrowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Красивая стрелка */}
            <marker
              id="arrowhead-diagram"
              markerWidth="16"
              markerHeight="12"
              refX="15"
              refY="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M 0 0 L 16 6 L 0 12 L 4 6 Z"
                fill="url(#arrowGradient)"
                filter="url(#arrowGlow)"
              />
            </marker>
          </defs>
          
          {steps.map((_, index) => {
            if (index === steps.length - 1) return null
            
            const currentX = 64 + (index * 128)
            const nextX = 64 + ((index + 1) * 128)
            const y = 32
            
            return (
              <g key={index}>
                {/* Основная стрелка */}
                <line
                  x1={currentX + 32}
                  y1={y}
                  x2={nextX - 32}
                  y2={y}
                  stroke="url(#arrowGradient)"
                  strokeWidth="4"
                  markerEnd="url(#arrowhead-diagram)"
                  filter="url(#arrowGlow)"
                  className="transition-all duration-300"
                />
                
                {/* Дополнительная линия для объема */}
                <line
                  x1={currentX + 32}
                  y1={y + 1}
                  x2={nextX - 32}
                  y2={y + 1}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-diagram)"
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
              <div key={step.id} className="flex flex-col items-center flex-shrink-0 w-32 mx-2 relative z-10">
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
              {/* Красивый градиент для стрелок */}
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
                <stop offset="30%" stopColor="#8B5CF6" stopOpacity="1" />
                <stop offset="70%" stopColor="#EC4899" stopOpacity="1" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
              </linearGradient>
              
              {/* Фильтр для свечения */}
              <filter id="connectionGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Фильтр для тени текста */}
              <filter id="textShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Красивая стрелка */}
              <marker
                id="arrowhead"
                markerWidth="20"
                markerHeight="16"
                refX="19"
                refY="8"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M 0 0 L 20 8 L 0 16 L 6 8 Z"
                  fill="url(#connectionGradient)"
                  filter="url(#connectionGlow)"
                />
              </marker>
            </defs>
            
            {connections.map((conn, index) => {
              const fromNode = nodes.find(n => n.id === conn.from)
              const toNode = nodes.find(n => n.id === conn.to)
              
              if (!fromNode || !toNode) return null
              
              // Вычисляем красивые кривые Безье
              const dx = toNode.x - fromNode.x
              const dy = toNode.y - fromNode.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              // Определяем тип соединения и создаем красивые кривые
              const isHorizontal = Math.abs(dy) < 30
              const isVertical = Math.abs(dx) < 30
              
              let pathData = ''
              let labelX = (fromNode.x + toNode.x) / 2
              let labelY = (fromNode.y + toNode.y) / 2
              
              if (isHorizontal) {
                // Красивая горизонтальная кривая
                const controlOffset = Math.min(distance * 0.5, 80)
                const curveHeight = 30
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + controlOffset} ${fromNode.y - curveHeight} ${toNode.x} ${toNode.y}`
                labelY = fromNode.y - curveHeight - 10
              } else if (isVertical) {
                // Красивая вертикальная кривая
                const controlOffset = Math.min(Math.abs(dy) * 0.5, 50)
                const curveWidth = 40
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + curveWidth} ${fromNode.y + controlOffset} ${toNode.x} ${toNode.y}`
                labelX = fromNode.x + curveWidth + 10
              } else {
                // Красивая диагональная кривая
                const controlOffsetX = dx * 0.5
                const controlOffsetY = dy * 0.5
                const curveOffset = 25
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${fromNode.x + controlOffsetX} ${fromNode.y + controlOffsetY - curveOffset} ${toNode.x} ${toNode.y}`
                labelY = (fromNode.y + toNode.y) / 2 - curveOffset - 10
              }
              
              return (
                <g key={index}>
                  {/* Основная кривая */}
                  <path
                    d={pathData}
                    stroke="url(#connectionGradient)"
                    strokeWidth="5"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    filter="url(#connectionGlow)"
                    className="transition-all duration-300"
                  />
                  
                  {/* Дополнительная линия для объема */}
                  <path
                    d={pathData}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                  
                  {/* Красивый фон для текста */}
                  {conn.label && (
                    <g>
                      {/* Внешняя тень */}
                      <rect
                        x={labelX - 28}
                        y={labelY - 8}
                        width="56"
                        height="24"
                        fill="rgba(0,0,0,0.2)"
                        rx="12"
                        filter="url(#textShadow)"
                      />
                      
                      {/* Основной фон с градиентом */}
                      <rect
                        x={labelX - 26}
                        y={labelY - 6}
                        width="52"
                        height="20"
                        fill="rgba(255,255,255,0.95)"
                        stroke="rgba(59,130,246,0.3)"
                        strokeWidth="2"
                        rx="10"
                        className="dark:fill-gray-800 dark:stroke-gray-500"
                      />
                      
                      {/* Внутренняя подсветка */}
                      <rect
                        x={labelX - 24}
                        y={labelY - 4}
                        width="48"
                        height="16"
                        fill="rgba(255,255,255,0.1)"
                        rx="8"
                      />
                    </g>
                  )}
                  
                  {/* Красивый текст */}
                  {conn.label && (
                    <text
                      x={labelX}
                      y={labelY + 4}
                      textAnchor="middle"
                      className="text-sm font-bold fill-gray-800 dark:fill-gray-100 pointer-events-none"
                      style={{ 
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        letterSpacing: '0.05em'
                      }}
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
