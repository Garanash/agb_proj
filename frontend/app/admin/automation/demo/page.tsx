'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlayIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
}

export default function AutomationDemoPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<DemoStep[]>([
    {
      id: '1',
      title: 'Создание паспорта ВЭД',
      description: 'Пользователь создает новый паспорт ВЭД в системе',
      icon: DocumentTextIcon,
      status: 'pending'
    },
    {
      id: '2',
      title: 'Триггер события',
      description: 'Система автоматически отправляет событие в n8n',
      icon: CogIcon,
      status: 'pending'
    },
    {
      id: '3',
      title: 'Обработка в n8n',
      description: 'n8n получает событие и запускает workflow',
      icon: PlayIcon,
      status: 'pending'
    },
    {
      id: '4',
      title: 'Отправка уведомления',
      description: 'Workflow отправляет уведомление в Telegram',
      icon: ChatBubbleLeftRightIcon,
      status: 'pending'
    },
    {
      id: '5',
      title: 'Email уведомление',
      description: 'Дополнительно отправляется email менеджеру',
      icon: EnvelopeIcon,
      status: 'pending'
    }
  ]);

  const runDemo = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    // Сброс статусов
    setSteps(steps.map(step => ({ ...step, status: 'pending' as const })));

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Обновляем статус текущего шага на "running"
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'running' } : step
      ));

      // Имитируем выполнение шага
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Обновляем статус на "success" с результатом
      setSteps(prev => prev.map((step, index) => 
        index === i ? { 
          ...step, 
          status: 'success',
          result: getStepResult(i)
        } : step
      ));
    }

    setIsRunning(false);
  };

  const getStepResult = (stepIndex: number): string => {
    const results = [
      'Паспорт ВЭД "PASSPORT-001" успешно создан',
      'Событие passport_created отправлено в n8n webhook',
      'Workflow "AGB Platform Integration" запущен',
      'Уведомление отправлено в Telegram канал',
      'Email отправлен на admin@company.com'
    ];
    return results[stepIndex] || 'Шаг выполнен';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'running':
        return <ClockIcon className="h-6 w-6 text-blue-500 animate-spin" />;
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав для доступа к этой странице</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Демонстрация автоматизации</h1>
          <p className="text-gray-600">
            Посмотрите, как работает интеграция с n8n в реальном времени
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Запуск демонстрации</h2>
              <p className="text-sm text-gray-600">
                Нажмите кнопку ниже, чтобы увидеть полный цикл автоматизации
              </p>
            </div>
            <button
              onClick={runDemo}
              disabled={isRunning}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                  Выполняется...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Запустить демо
                </>
              )}
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`border rounded-lg p-6 transition-all duration-500 ${getStatusColor(step.status)} ${
                index === currentStep && isRunning ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {step.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      Шаг {index + 1} из {steps.length}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {step.description}
                  </p>
                  {step.result && (
                    <div className="mt-3 p-3 bg-white rounded-md border">
                      <p className="text-sm text-gray-700">
                        <strong>Результат:</strong> {step.result}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">n8n Integration</h3>
                <p className="text-sm text-gray-600">
                  Полная интеграция с платформой автоматизации n8n
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">События платформы</h3>
                <p className="text-sm text-gray-600">
                  Автоматические триггеры при создании паспортов, заявок и регистрации
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Уведомления</h3>
                <p className="text-sm text-gray-600">
                  Telegram, Email и другие каналы уведомлений
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Технические детали</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">API Endpoints</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• POST /api/v1/n8n/webhook/trigger</li>
                <li>• POST /api/v1/n8n/workflow/execute</li>
                <li>• GET /api/v1/n8n/workflows</li>
                <li>• GET /api/v1/n8n/executions</li>
                <li>• GET /api/v1/n8n/stats</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">События</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• passport_created - создание паспорта ВЭД</li>
                <li>• user_registered - регистрация пользователя</li>
                <li>• request_created - создание заявки</li>
                <li>• custom events - пользовательские события</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => window.open('http://localhost:5678', '_blank')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Открыть n8n
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Назад к автоматизации
          </button>
        </div>
      </div>
    </div>
  );
}
