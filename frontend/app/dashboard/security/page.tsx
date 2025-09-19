'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface SecurityIncident {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  reportedBy: string
  reportedAt: string
  assignedTo?: string
  priority: number
}

interface AccessLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  timestamp: string
  ipAddress: string
  location: string
  success: boolean
}

interface SecurityReport {
  id: string
  title: string
  type: 'daily' | 'weekly' | 'monthly' | 'incident'
  generatedAt: string
  status: 'generating' | 'ready' | 'failed'
  fileUrl?: string
}

export default function SecurityDashboard() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [reports, setReports] = useState<SecurityReport[]>([])
  const [loading, setLoading] = useState(true)

  // Моковые данные для демонстрации
  useEffect(() => {
    const mockIncidents: SecurityIncident[] = [
      {
        id: '1',
        title: 'Подозрительная активность в системе',
        description: 'Обнаружены множественные неудачные попытки входа',
        severity: 'high',
        status: 'investigating',
        reportedBy: 'Система мониторинга',
        reportedAt: '2024-01-15T10:30:00Z',
        assignedTo: 'Иван Петров',
        priority: 1
      },
      {
        id: '2',
        title: 'Попытка несанкционированного доступа',
        description: 'Пользователь пытался получить доступ к закрытым документам',
        severity: 'critical',
        status: 'open',
        reportedBy: 'Мария Сидорова',
        reportedAt: '2024-01-15T09:15:00Z',
        priority: 1
      },
      {
        id: '3',
        title: 'Нарушение политики безопасности',
        description: 'Сотрудник использовал личный USB-накопитель',
        severity: 'medium',
        status: 'resolved',
        reportedBy: 'Алексей Козлов',
        reportedAt: '2024-01-14T16:45:00Z',
        assignedTo: 'Иван Петров',
        priority: 2
      }
    ]

    const mockAccessLogs: AccessLog[] = [
      {
        id: '1',
        userId: 'user123',
        userName: 'Анна Иванова',
        action: 'Вход в систему',
        resource: 'Главная страница',
        timestamp: '2024-01-15T10:30:00Z',
        ipAddress: '192.168.1.100',
        location: 'Москва, Россия',
        success: true
      },
      {
        id: '2',
        userId: 'user456',
        userName: 'Петр Сидоров',
        action: 'Попытка доступа к файлу',
        resource: 'confidential_report.pdf',
        timestamp: '2024-01-15T10:25:00Z',
        ipAddress: '192.168.1.101',
        location: 'Санкт-Петербург, Россия',
        success: false
      },
      {
        id: '3',
        userId: 'user789',
        userName: 'Мария Козлова',
        action: 'Скачивание документа',
        resource: 'employee_handbook.pdf',
        timestamp: '2024-01-15T10:20:00Z',
        ipAddress: '192.168.1.102',
        location: 'Екатеринбург, Россия',
        success: true
      }
    ]

    const mockReports: SecurityReport[] = [
      {
        id: '1',
        title: 'Ежедневный отчет безопасности',
        type: 'daily',
        generatedAt: '2024-01-15T09:00:00Z',
        status: 'ready',
        fileUrl: '/reports/security_daily_2024-01-15.pdf'
      },
      {
        id: '2',
        title: 'Недельный отчет инцидентов',
        type: 'weekly',
        generatedAt: '2024-01-14T18:00:00Z',
        status: 'ready',
        fileUrl: '/reports/security_weekly_2024-01-14.pdf'
      },
      {
        id: '3',
        title: 'Отчет о критическом инциденте',
        type: 'incident',
        generatedAt: '2024-01-15T10:30:00Z',
        status: 'generating'
      }
    ]

    setIncidents(mockIncidents)
    setAccessLogs(mockAccessLogs)
    setReports(mockReports)
    setLoading(false)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Открыт'
      case 'investigating': return 'Расследуется'
      case 'resolved': return 'Решен'
      case 'closed': return 'Закрыт'
      default: return status
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Критический'
      case 'high': return 'Высокий'
      case 'medium': return 'Средний'
      case 'low': return 'Низкий'
      default: return severity
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Служба безопасности</h1>
          <p className="text-muted-foreground">
            Мониторинг безопасности и управление инцидентами
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные инциденты</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.filter(i => i.status === 'open' || i.status === 'investigating').length}</div>
            <p className="text-xs text-muted-foreground">
              +2 с прошлой недели
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Критические</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{incidents.filter(i => i.severity === 'critical').length}</div>
            <p className="text-xs text-muted-foreground">
              Требуют немедленного внимания
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Попытки входа</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              За последние 24 часа
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Успешные входы</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((accessLogs.filter(log => log.success).length / accessLogs.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Успешность аутентификации
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Инциденты</TabsTrigger>
          <TabsTrigger value="logs">Журнал доступа</TabsTrigger>
          <TabsTrigger value="reports">Отчеты</TabsTrigger>
          <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
        </TabsList>

        {/* Инциденты */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Инциденты безопасности</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Фильтр
              </Button>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Поиск
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <CardDescription>{incident.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getSeverityColor(incident.severity)} text-white`}>
                        {getSeverityText(incident.severity)}
                      </Badge>
                      <Badge className={getStatusColor(incident.status)}>
                        {getStatusText(incident.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Сообщил:</span>
                      <p className="text-muted-foreground">{incident.reportedBy}</p>
                    </div>
                    <div>
                      <span className="font-medium">Дата:</span>
                      <p className="text-muted-foreground">
                        {new Date(incident.reportedAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Назначен:</span>
                      <p className="text-muted-foreground">{incident.assignedTo || 'Не назначен'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Приоритет:</span>
                      <p className="text-muted-foreground">#{incident.priority}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Подробнее
                    </Button>
                    <Button size="sm">
                      Принять в работу
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Журнал доступа */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Журнал доступа</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Фильтр
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Пользователь</th>
                      <th className="text-left p-4 font-medium">Действие</th>
                      <th className="text-left p-4 font-medium">Ресурс</th>
                      <th className="text-left p-4 font-medium">IP адрес</th>
                      <th className="text-left p-4 font-medium">Время</th>
                      <th className="text-left p-4 font-medium">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{log.userName}</p>
                            <p className="text-sm text-muted-foreground">{log.userId}</p>
                          </div>
                        </td>
                        <td className="p-4">{log.action}</td>
                        <td className="p-4 font-mono text-sm">{log.resource}</td>
                        <td className="p-4 font-mono text-sm">{log.ipAddress}</td>
                        <td className="p-4 text-sm">
                          {new Date(log.timestamp).toLocaleString('ru-RU')}
                        </td>
                        <td className="p-4">
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? 'Успешно' : 'Ошибка'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Отчеты */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Отчеты безопасности</h2>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Создать отчет
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
                      {report.status === 'ready' ? 'Готов' : 
                       report.status === 'generating' ? 'Генерируется' : 'Ошибка'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {report.type === 'daily' && 'Ежедневный отчет'}
                    {report.type === 'weekly' && 'Недельный отчет'}
                    {report.type === 'monthly' && 'Месячный отчет'}
                    {report.type === 'incident' && 'Отчет об инциденте'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Создан:</span>
                      <p className="text-muted-foreground">
                        {new Date(report.generatedAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'ready' && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Скачать
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотр
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Мониторинг */}
        <TabsContent value="monitoring" className="space-y-4">
          <h2 className="text-2xl font-semibold">Мониторинг в реальном времени</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Активность системы</CardTitle>
                <CardDescription>Мониторинг входящих соединений</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Активные сессии</span>
                    <Badge variant="default">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Попытки входа (час)</span>
                    <Badge variant="outline">45</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Заблокированные IP</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статус безопасности</CardTitle>
                <CardDescription>Общее состояние системы</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Антивирус</span>
                    <Badge className="bg-green-100 text-green-800">Активен</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Firewall</span>
                    <Badge className="bg-green-100 text-green-800">Активен</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Обновления</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Требуются</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
