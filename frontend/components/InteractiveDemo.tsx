'use client'

import { useState } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface DemoStep {
  id: string
  title: string
  description: string
  action?: string
  result?: string
  isInteractive?: boolean
  onAction?: () => void
}

interface InteractiveDemoProps {
  title: string
  description: string
  steps: DemoStep[]
  onComplete?: () => void
}

export default function InteractiveDemo({ 
  title, 
  description, 
  steps, 
  onComplete 
}: InteractiveDemoProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isCompleted, setIsCompleted] = useState(false)

  const handleStepAction = (stepIndex: number) => {
    const step = steps[stepIndex]
    if (step.onAction) {
      step.onAction()
    }
    
    setCompletedSteps(prev => new Set(prev).add(stepIndex))
    
    // Автоматически переходим к следующему шагу
    if (stepIndex < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(stepIndex + 1)
      }, 1000)
    } else {
      setIsCompleted(true)
      if (onComplete) {
        onComplete()
      }
    }
  }

  const startDemo = () => {
    setIsPlaying(true)
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setIsCompleted(false)
  }

  const stopDemo = () => {
    setIsPlaying(false)
  }

  const resetDemo = () => {
    setIsPlaying(false)
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setIsCompleted(false)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-blue-100">{description}</p>
      </div>

      {/* Прогресс бар */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Шаг {currentStep + 1} из {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% завершено
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Контент демо */}
      <div className="p-6">
        {currentStepData && (
          <div className="space-y-6">
            {/* Информация о текущем шаге */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-6 w-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    {currentStepData.title}
                  </h4>
                  <p className="text-blue-800 text-sm">
                    {currentStepData.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Интерактивная область */}
            {currentStepData.isInteractive && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-gray-600">
                    {currentStepData.action}
                  </div>
                  
                  {!completedSteps.has(currentStep) ? (
                    <button
                      onClick={() => handleStepAction(currentStep)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Выполнить действие
                    </button>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircleIcon className="h-6 w-6" />
                      <span className="font-medium">Действие выполнено!</span>
                    </div>
                  )}
                  
                  {currentStepData.result && completedSteps.has(currentStep) && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 text-sm">
                        {currentStepData.result}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Неинтерактивные шаги */}
            {!currentStepData.isInteractive && (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <span className="text-2xl font-bold text-gray-600">
                        {currentStep + 1}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Завершение демо */}
        {isCompleted && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              Демонстрация завершена!
            </h4>
            <p className="text-gray-600 mb-6">
              Вы успешно прошли все шаги демонстрации.
            </p>
            <button
              onClick={resetDemo}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Начать заново
            </button>
          </div>
        )}
      </div>

      {/* Управление */}
      {!isCompleted && (
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={startDemo}
              disabled={isPlaying}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isPlaying 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <PlayIcon className="h-4 w-4 inline mr-1" />
              {isPlaying ? 'Запущено' : 'Запустить'}
            </button>
            
            {isPlaying && (
              <button
                onClick={stopDemo}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                <PauseIcon className="h-4 w-4 inline mr-1" />
                Остановить
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Назад
            </button>
            
            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === steps.length - 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Вперед
              <ArrowRightIcon className="h-4 w-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
