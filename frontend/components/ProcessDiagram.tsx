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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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

      <div className="relative">
        {/* Горизонтальная линия процесса */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200"></div>
        
        {/* Шаги процесса */}
        <div className="flex justify-between items-center relative">
          {steps.map((step, index) => {
            const Icon = getStepIcon(step)
            const isActive = isInteractive ? currentStep === index : step.status === 'active'
            const isCompleted = isInteractive ? currentStep > index : step.status === 'completed'
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Иконка шага */}
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-3 cursor-pointer transition-all duration-300
                    ${isInteractive ? 'hover:scale-110' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isActive ? 'bg-blue-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-300 text-gray-700' : ''}
                  `}
                  onClick={() => handleStepClick(step.id, index)}
                >
                  <Icon className="h-8 w-8" />
                </div>
                
                {/* Название шага */}
                <div className="text-center max-w-32">
                  <h4 className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                  {step.duration && (
                    <span className="text-xs text-gray-400 mt-1 block">
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
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Текущий шаг:</h4>
          <p className="text-sm text-gray-600">
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
        return 'bg-yellow-500 text-white transform rotate-45'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="relative" style={{ height: '400px', width: '100%' }}>
        {/* Соединения */}
        <svg className="absolute inset-0 w-full h-full">
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from)
            const toNode = nodes.find(n => n.id === conn.to)
            
            if (!fromNode || !toNode) return null
            
            return (
              <g key={index}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#6B7280"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {conn.label && (
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
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
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6B7280"
              />
            </marker>
          </defs>
        </svg>
        
        {/* Узлы */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`
              absolute w-20 h-20 rounded-lg flex items-center justify-center text-center text-xs font-medium
              ${getNodeStyle(node.type)}
              ${node.type === 'decision' ? 'w-16 h-16' : ''}
            `}
            style={{
              left: node.x - (node.type === 'decision' ? 32 : 40),
              top: node.y - 40,
            }}
          >
            {node.title}
          </div>
        ))}
      </div>
    </div>
  )
}
