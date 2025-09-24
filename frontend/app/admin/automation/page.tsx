'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import AutomationBuilder from '@/components/AutomationBuilder';
import WorkflowCanvas from '@/components/WorkflowCanvasSimple';
import { 
  PlayIcon, 
  PauseIcon, 
  EyeIcon, 
  PlusIcon,
  CogIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: number;
  connections: number;
}

interface Execution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  mode: string;
}

interface N8NStats {
  workflows: number;
  activeWorkflows: number;
  executions: number;
  successRate: number;
}

export default function AutomationPage() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [stats, setStats] = useState<N8NStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions' | 'stats' | 'builder'>('workflows');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showWorkflowCanvas, setShowWorkflowCanvas] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workflowsRes, executionsRes, statsRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/n8n/workflows'),
        fetch('http://localhost:8000/api/v1/n8n/executions'),
        fetch('http://localhost:8000/api/v1/n8n/stats')
      ]);

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData.data?.workflows || []);
      }

      if (executionsRes.ok) {
        const executionsData = await executionsRes.json();
        setExecutions(executionsData.data?.executions || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Загружаем сохраненные workflows из localStorage
      const saved = localStorage.getItem('saved-workflows');
      if (saved) {
        setSavedWorkflows(JSON.parse(saved));
      }
    } catch (err) {
      setError('Ошибка загрузки данных автоматизации');
      console.error('Error fetching automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/v1/n8n/workflows/${workflowId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !active })
      });

      if (response.ok) {
        await fetchData(); // Обновляем данные
      }
    } catch (err) {
      console.error('Error toggling workflow:', err);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/n8n/workflow/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          data: {},
          wait_for_result: false
        })
      });

      if (response.ok) {
        await fetchData(); // Обновляем данные
      }
    } catch (err) {
      console.error('Error executing workflow:', err);
    }
  };

  // Сохранение workflow
  const handleSaveWorkflow = (workflow: any) => {
    const newWorkflows = [...savedWorkflows, workflow];
    setSavedWorkflows(newWorkflows);
    localStorage.setItem('saved-workflows', JSON.stringify(newWorkflows));
    console.log('Workflow saved:', workflow);
  };

  // Загрузка workflow
  const handleLoadWorkflow = (workflow: any) => {
    setCurrentWorkflow(workflow);
    setActiveTab('builder');
  };

  // Удаление workflow
  const handleDeleteWorkflow = (workflowId: string) => {
    const newWorkflows = savedWorkflows.filter(w => w.id !== workflowId);
    setSavedWorkflows(newWorkflows);
    localStorage.setItem('saved-workflows', JSON.stringify(newWorkflows));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'waiting':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Автоматизация</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Управление workflows и автоматизацией процессов
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.open('/admin/automation/demo', '_blank')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Демо
              </button>
              <button
                onClick={() => setShowBuilder(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Создать автоматизацию
              </button>
              <button
                onClick={() => setActiveTab('builder')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Squares2X2Icon className="h-4 w-4 mr-2" />
                Workflow Builder
              </button>
              <button
                onClick={() => window.open('http://localhost:5678', '_blank')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Открыть n8n
              </button>
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CogIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Всего Workflows
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stats.workflows}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PlayIcon className="h-6 w-6 text-green-400 dark:text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Активные
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stats.activeWorkflows}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-blue-400 dark:text-blue-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Выполнений
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stats.executions}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400 dark:text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Успешность
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stats.successRate}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'workflows', name: 'Workflows', count: workflows.length },
                { id: 'executions', name: 'Выполнения', count: executions.length },
                { id: 'stats', name: 'Статистика', count: null },
                { id: 'builder', name: 'Workflow Builder', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.name}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Workflows Tab */}
            {activeTab === 'workflows' && (
              <div className="space-y-6">
                {/* n8n Workflows */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    n8n Workflows
                  </h3>
                  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {workflows.map((workflow) => (
                        <li key={workflow.id}>
                          <div className="px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <CogIcon className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {workflow.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {workflow.nodes} нод • {workflow.connections} соединений
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  Обновлен: {new Date(workflow.updatedAt).toLocaleString('ru-RU')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  workflow.active
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                              >
                                {workflow.active ? 'Активен' : 'Неактивен'}
                              </span>
                              <button
                                onClick={() => executeWorkflow(workflow.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <PlayIcon className="h-4 w-4 mr-1" />
                                Запустить
                              </button>
                              <button
                                onClick={() => toggleWorkflow(workflow.id, workflow.active)}
                                className={`inline-flex items-center px-3 py-1 border text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  workflow.active
                                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500 dark:border-red-600 dark:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                                    : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500 dark:border-green-600 dark:text-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                                }`}
                              >
                                {workflow.active ? (
                                  <>
                                    <PauseIcon className="h-4 w-4 mr-1" />
                                    Остановить
                                  </>
                                ) : (
                                  <>
                                    <PlayIcon className="h-4 w-4 mr-1" />
                                    Активировать
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => window.open(`http://localhost:5678/workflow/${workflow.id}`, '_blank')}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                Открыть
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Сохраненные Workflows */}
                {savedWorkflows.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Мои Workflows
                    </h3>
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {savedWorkflows.map((workflow) => (
                          <li key={workflow.id}>
                            <div className="px-4 py-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <Squares2X2Icon className="h-8 w-8 text-purple-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {workflow.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {workflow.nodes?.length || 0} нод • {workflow.connections?.length || 0} соединений
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500">
                                    Создан: {new Date(workflow.createdAt).toLocaleString('ru-RU')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleLoadWorkflow(workflow)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Открыть
                                </button>
                                <button
                                  onClick={() => handleDeleteWorkflow(workflow.id)}
                                  className="inline-flex items-center px-3 py-1 border border-red-300 dark:border-red-600 text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <TrashIcon className="h-4 w-4 mr-1" />
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Executions Tab */}
            {activeTab === 'executions' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {executions.slice(0, 20).map((execution) => (
                    <li key={execution.id}>
                      <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getStatusIcon(execution.status)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Workflow ID: {execution.workflowId}
                            </div>
                            <div className="text-sm text-gray-500">
                              Запущен: {new Date(execution.startedAt).toLocaleString('ru-RU')}
                            </div>
                            {execution.finishedAt && (
                              <div className="text-sm text-gray-500">
                                Завершен: {new Date(execution.finishedAt).toLocaleString('ru-RU')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}
                          >
                            {execution.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {execution.mode}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Статистика автоматизации</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Общая информация</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Всего workflows:</span>
                        <span className="text-sm font-medium">{stats?.workflows || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Активных workflows:</span>
                        <span className="text-sm font-medium">{stats?.activeWorkflows || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Всего выполнений:</span>
                        <span className="text-sm font-medium">{stats?.executions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Успешность:</span>
                        <span className="text-sm font-medium">{stats?.successRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Быстрые действия</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => window.open('http://localhost:5678', '_blank')}
                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        Открыть n8n в новой вкладке
                      </button>
                      <button
                        onClick={fetchData}
                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        Обновить статистику
                      </button>
                      <button
                        onClick={() => setActiveTab('workflows')}
                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        Просмотреть workflows
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Builder Tab */}
            {activeTab === 'builder' && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-[600px]">
                <WorkflowCanvas
                  initialNodes={currentWorkflow?.nodes || []}
                  initialConnections={currentWorkflow?.connections || []}
                  onSave={handleSaveWorkflow}
                  onExecute={(workflow) => {
                    console.log('Workflow executed:', workflow);
                    // Здесь можно добавить логику выполнения workflow
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Automation Builder Modal */}
        {showBuilder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <AutomationBuilder
                  onSave={(automation) => {
                    console.log('Automation saved:', automation);
                    setShowBuilder(false);
                    // Здесь можно добавить логику сохранения
                  }}
                  onCancel={() => setShowBuilder(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
