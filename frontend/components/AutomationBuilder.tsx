'use client';

import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PlayIcon, 
  CogIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface AutomationStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  name: string;
  config: Record<string, any>;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  steps: Omit<AutomationStep, 'id'>[];
}

const automationTemplates: AutomationTemplate[] = [
  {
    id: 'passport-notification',
    name: 'Уведомление о паспорте ВЭД',
    description: 'Отправка уведомления в Telegram при создании паспорта ВЭД',
    icon: DocumentTextIcon,
    steps: [
      {
        type: 'trigger',
        name: 'Создание паспорта ВЭД',
        config: { event: 'passport_created' }
      },
      {
        type: 'action',
        name: 'Отправка в Telegram',
        config: { 
          service: 'telegram',
          message: '🆕 Новый паспорт ВЭД: {{passport_number}}'
        }
      }
    ]
  },
  {
    id: 'user-welcome',
    name: 'Приветствие нового пользователя',
    description: 'Отправка приветственного email при регистрации',
    icon: EnvelopeIcon,
    steps: [
      {
        type: 'trigger',
        name: 'Регистрация пользователя',
        config: { event: 'user_registered' }
      },
      {
        type: 'action',
        name: 'Отправка email',
        config: { 
          service: 'email',
          subject: 'Добро пожаловать в AGB Platform!',
          template: 'welcome'
        }
      }
    ]
  },
  {
    id: 'request-assignment',
    name: 'Назначение заявки',
    description: 'Автоматическое назначение заявки инженеру',
    icon: UserGroupIcon,
    steps: [
      {
        type: 'trigger',
        name: 'Создание заявки',
        config: { event: 'request_created' }
      },
      {
        type: 'condition',
        name: 'Проверка типа заявки',
        config: { field: 'type', operator: 'equals', value: 'repair' }
      },
      {
        type: 'action',
        name: 'Назначение инженеру',
        config: { 
          service: 'assignment',
          assignTo: 'available_engineer'
        }
      }
    ]
  }
];

const actionTypes = [
  { id: 'telegram', name: 'Telegram', icon: ChatBubbleLeftRightIcon },
  { id: 'email', name: 'Email', icon: EnvelopeIcon },
  { id: 'webhook', name: 'Webhook', icon: CogIcon },
  { id: 'assignment', name: 'Назначение', icon: UserGroupIcon }
];

interface AutomationBuilderProps {
  onSave: (automation: any) => void;
  onCancel: () => void;
}

export default function AutomationBuilder({ onSave, onCancel }: AutomationBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [automationName, setAutomationName] = useState('');
  const [automationDescription, setAutomationDescription] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleTemplateSelect = (template: AutomationTemplate) => {
    setSelectedTemplate(template.id);
    setAutomationName(template.name);
    setAutomationDescription(template.description);
    setSteps(template.steps.map((step, index) => ({
      ...step,
      id: `step-${index}`
    })));
  };

  const addStep = (type: 'trigger' | 'condition' | 'action') => {
    const newStep: AutomationStep = {
      id: `step-${Date.now()}`,
      type,
      name: '',
      config: {}
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const updateStep = (stepId: string, updates: Partial<AutomationStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const handleSave = async () => {
    if (!automationName.trim()) {
      alert('Введите название автоматизации');
      return;
    }

    if (steps.length === 0) {
      alert('Добавьте хотя бы один шаг');
      return;
    }

    setIsCreating(true);
    try {
      const automation = {
        name: automationName,
        description: automationDescription,
        steps: steps.map(step => ({
          type: step.type,
          name: step.name,
          config: step.config
        }))
      };

      // Здесь будет вызов API для создания автоматизации
      console.log('Creating automation:', automation);
      
      onSave(automation);
    } catch (error) {
      console.error('Error creating automation:', error);
      alert('Ошибка создания автоматизации');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Создание автоматизации</h2>
        <p className="text-gray-600">Выберите шаблон или создайте автоматизацию с нуля</p>
      </div>

      {/* Templates */}
      {!selectedTemplate && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Шаблоны автоматизации</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {automationTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center mb-2">
                  <template.icon className="h-6 w-6 text-blue-600 mr-2" />
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automation Form */}
      {selectedTemplate && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Основная информация</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название автоматизации"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={automationDescription}
                  onChange={(e) => setAutomationDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Опишите что делает эта автоматизация"
                />
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Шаги автоматизации</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => addStep('trigger')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Триггер
                </button>
                <button
                  onClick={() => addStep('condition')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Условие
                </button>
                <button
                  onClick={() => addStep('action')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Действие
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {step.type === 'trigger' ? 'Триггер' : 
                         step.type === 'condition' ? 'Условие' : 'Действие'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название шага
                      </label>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(step.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите название шага"
                      />
                    </div>

                    {step.type === 'trigger' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Событие
                        </label>
                        <select
                          value={step.config.event || ''}
                          onChange={(e) => updateStep(step.id, { 
                            config: { ...step.config, event: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Выберите событие</option>
                          <option value="passport_created">Создание паспорта ВЭД</option>
                          <option value="user_registered">Регистрация пользователя</option>
                          <option value="request_created">Создание заявки</option>
                        </select>
                      </div>
                    )}

                    {step.type === 'action' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Тип действия
                        </label>
                        <select
                          value={step.config.service || ''}
                          onChange={(e) => updateStep(step.id, { 
                            config: { ...step.config, service: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Выберите тип действия</option>
                          {actionTypes.map((action) => (
                            <option key={action.id} value={action.id}>
                              {action.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isCreating}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Создание...' : 'Создать автоматизацию'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
