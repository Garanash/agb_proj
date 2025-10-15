'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/src/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  UserPlus, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  GraduationCap,
  Briefcase,
  Award,
  TrendingUp
} from 'lucide-react'

interface Employee {
  id: string
  firstName: string
  lastName: string
  position: string
  department: string
  email: string
  phone: string
  hireDate: string
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  manager: string
  salary: number
  avatar?: string
}

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity'
  startDate: string
  endDate: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  submittedAt: string
  approvedBy?: string
}

interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  period: string
  rating: number
  goals: string[]
  achievements: string[]
  areasForImprovement: string[]
  status: 'draft' | 'in_progress' | 'completed'
  dueDate: string
  reviewer: string
}

interface TrainingRecord {
  id: string
  employeeId: string
  employeeName: string
  courseName: string
  provider: string
  startDate: string
  endDate: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  certificate?: string
  score?: number
}

export default function HRDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Моковые данные для демонстрации
  useEffect(() => {
    const mockEmployees: Employee[] = [
      {
        id: '1',
        firstName: 'Анна',
        lastName: 'Иванова',
        position: 'Менеджер по персоналу',
        department: 'HR',
        email: 'anna.ivanova@company.com',
        phone: '+7 (495) 123-45-67',
        hireDate: '2022-03-15',
        status: 'active',
        manager: 'Петр Сидоров',
        salary: 85000
      },
      {
        id: '2',
        firstName: 'Михаил',
        lastName: 'Петров',
        position: 'Специалист по кадрам',
        department: 'HR',
        email: 'mikhail.petrov@company.com',
        phone: '+7 (495) 123-45-68',
        hireDate: '2023-01-10',
        status: 'active',
        manager: 'Анна Иванова',
        salary: 65000
      },
      {
        id: '3',
        firstName: 'Елена',
        lastName: 'Сидорова',
        position: 'Рекрутер',
        department: 'HR',
        email: 'elena.sidorova@company.com',
        phone: '+7 (495) 123-45-69',
        hireDate: '2021-09-01',
        status: 'on_leave',
        manager: 'Анна Иванова',
        salary: 70000
      }
    ]

    const mockLeaveRequests: LeaveRequest[] = [
      {
        id: '1',
        employeeId: '2',
        employeeName: 'Михаил Петров',
        type: 'vacation',
        startDate: '2024-02-01',
        endDate: '2024-02-14',
        days: 14,
        status: 'pending',
        reason: 'Планируемый отпуск',
        submittedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        employeeId: '3',
        employeeName: 'Елена Сидорова',
        type: 'maternity',
        startDate: '2024-01-20',
        endDate: '2024-07-20',
        days: 180,
        status: 'approved',
        reason: 'Декретный отпуск',
        submittedAt: '2024-01-10T14:30:00Z',
        approvedBy: 'Анна Иванова'
      },
      {
        id: '3',
        employeeId: '1',
        employeeName: 'Анна Иванова',
        type: 'sick',
        startDate: '2024-01-18',
        endDate: '2024-01-20',
        days: 3,
        status: 'approved',
        reason: 'Временная нетрудоспособность',
        submittedAt: '2024-01-18T08:00:00Z',
        approvedBy: 'Петр Сидоров'
      }
    ]

    const mockPerformanceReviews: PerformanceReview[] = [
      {
        id: '1',
        employeeId: '1',
        employeeName: 'Анна Иванова',
        period: 'Q4 2023',
        rating: 4.5,
        goals: ['Улучшить процессы найма', 'Повысить удовлетворенность сотрудников'],
        achievements: ['Сократила время найма на 30%', 'Внедрила новую систему оценки'],
        areasForImprovement: ['Улучшить коммуникацию с IT отделом'],
        status: 'completed',
        dueDate: '2024-01-31',
        reviewer: 'Петр Сидоров'
      },
      {
        id: '2',
        employeeId: '2',
        employeeName: 'Михаил Петров',
        period: 'Q4 2023',
        rating: 4.0,
        goals: ['Освоить новые HR инструменты', 'Улучшить работу с документами'],
        achievements: ['Прошел обучение по новым системам', 'Оптимизировал процессы документооборота'],
        areasForImprovement: ['Развивать навыки презентации'],
        status: 'in_progress',
        dueDate: '2024-02-15',
        reviewer: 'Анна Иванова'
      }
    ]

    const mockTrainingRecords: TrainingRecord[] = [
      {
        id: '1',
        employeeId: '1',
        employeeName: 'Анна Иванова',
        courseName: 'Современные методы управления персоналом',
        provider: 'HR Academy',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        status: 'completed',
        certificate: '/certificates/hr_management_2024.pdf',
        score: 95
      },
      {
        id: '2',
        employeeId: '2',
        employeeName: 'Михаил Петров',
        courseName: 'Трудовое право',
        provider: 'Legal Institute',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        status: 'scheduled'
      },
      {
        id: '3',
        employeeId: '3',
        employeeName: 'Елена Сидорова',
        courseName: 'Психология собеседования',
        provider: 'Psychology Center',
        startDate: '2024-01-10',
        endDate: '2024-01-12',
        status: 'completed',
        certificate: '/certificates/interview_psychology_2024.pdf',
        score: 88
      }
    ]

    setEmployees(mockEmployees)
    setLeaveRequests(mockLeaveRequests)
    setPerformanceReviews(mockPerformanceReviews)
    setTrainingRecords(mockTrainingRecords)
    setLoading(false)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800'
      case 'terminated': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен'
      case 'inactive': return 'Неактивен'
      case 'on_leave': return 'В отпуске'
      case 'terminated': return 'Уволен'
      case 'pending': return 'На рассмотрении'
      case 'approved': return 'Одобрено'
      case 'rejected': return 'Отклонено'
      case 'completed': return 'Завершено'
      case 'in_progress': return 'В процессе'
      case 'scheduled': return 'Запланировано'
      case 'cancelled': return 'Отменено'
      default: return status
    }
  }

  const getLeaveTypeText = (type: string) => {
    switch (type) {
      case 'vacation': return 'Отпуск'
      case 'sick': return 'Больничный'
      case 'personal': return 'Личные дела'
      case 'maternity': return 'Декретный'
      case 'paternity': return 'Отпуск по уходу'
      default: return type
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
          <h1 className="text-3xl font-bold tracking-tight">Отдел кадров</h1>
          <p className="text-muted-foreground">
            Управление персоналом и кадровые процессы
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
            <CardTitle className="text-sm font-medium">Всего сотрудников</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 с прошлого месяца
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные сотрудники</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(e => e.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((employees.filter(e => e.status === 'active').length / employees.length) * 100)}% от общего числа
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заявки на отпуск</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveRequests.filter(r => r.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">
              Требуют рассмотрения
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обучение</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainingRecords.filter(t => t.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Курсов в процессе
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
          <TabsTrigger value="leave">Отпуска</TabsTrigger>
          <TabsTrigger value="performance">Оценки</TabsTrigger>
          <TabsTrigger value="training">Обучение</TabsTrigger>
          <TabsTrigger value="reports">Отчеты</TabsTrigger>
        </TabsList>

        {/* Сотрудники */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Сотрудники</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Фильтр
              </Button>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Поиск
              </Button>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Добавить сотрудника
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <CardDescription>{employee.position}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(employee.status)}>
                      {getStatusText(employee.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Отдел:</span>
                      <p className="text-muted-foreground">{employee.department}</p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <p className="text-muted-foreground">{employee.email}</p>
                    </div>
                    <div>
                      <span className="font-medium">Телефон:</span>
                      <p className="text-muted-foreground">{employee.phone}</p>
                    </div>
                    <div>
                      <span className="font-medium">Дата найма:</span>
                      <p className="text-muted-foreground">
                        {new Date(employee.hireDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Руководитель:</span>
                      <p className="text-muted-foreground">{employee.manager}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Профиль
                    </Button>
                    <Button size="sm">
                      Редактировать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Отпуска */}
        <TabsContent value="leave" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Заявки на отпуск</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Фильтр
              </Button>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Новая заявка
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{request.employeeName}</CardTitle>
                      <CardDescription>
                        {getLeaveTypeText(request.type)} • {request.days} дней
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Период:</span>
                      <p className="text-muted-foreground">
                        {new Date(request.startDate).toLocaleDateString('ru-RU')} - {new Date(request.endDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Подано:</span>
                      <p className="text-muted-foreground">
                        {new Date(request.submittedAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Причина:</span>
                      <p className="text-muted-foreground">{request.reason}</p>
                    </div>
                    <div>
                      <span className="font-medium">Рассмотрел:</span>
                      <p className="text-muted-foreground">{request.approvedBy || 'Не рассмотрено'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {request.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Одобрить
                        </Button>
                        <Button size="sm" variant="destructive">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Оценки */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Оценки производительности</h2>
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Новая оценка
            </Button>
          </div>

          <div className="space-y-4">
            {performanceReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{review.employeeName}</CardTitle>
                      <CardDescription>
                        {review.period} • Оценка: {review.rating}/5
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(review.status)}>
                      {getStatusText(review.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Цели:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {review.goals.map((goal, index) => (
                          <li key={index}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Достижения:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {review.achievements.map((achievement, index) => (
                          <li key={index}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Области для улучшения:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {review.areasForImprovement.map((area, index) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Просмотр
                      </Button>
                      <Button size="sm">
                        Редактировать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Обучение */}
        <TabsContent value="training" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Обучение сотрудников</h2>
            <Button>
              <GraduationCap className="h-4 w-4 mr-2" />
              Записать на курс
            </Button>
          </div>

          <div className="space-y-4">
            {trainingRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{record.employeeName}</CardTitle>
                      <CardDescription>
                        {record.courseName} • {record.provider}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {getStatusText(record.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Период:</span>
                      <p className="text-muted-foreground">
                        {new Date(record.startDate).toLocaleDateString('ru-RU')} - {new Date(record.endDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Оценка:</span>
                      <p className="text-muted-foreground">
                        {record.score ? `${record.score}/100` : 'Не оценено'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Сертификат:</span>
                      <p className="text-muted-foreground">
                        {record.certificate ? 'Получен' : 'Не получен'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Статус:</span>
                      <p className="text-muted-foreground">
                        {getStatusText(record.status)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {record.certificate && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Сертификат
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Отчеты */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Отчеты по персоналу</h2>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Создать отчет
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Отчет по сотрудникам
                </CardTitle>
                <CardDescription>
                  Статистика по всем сотрудникам отдела
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Всего сотрудников:</span>
                    <span className="font-medium">{employees.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Активных:</span>
                    <span className="font-medium text-green-600">
                      {employees.filter(e => e.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>В отпуске:</span>
                    <span className="font-medium text-yellow-600">
                      {employees.filter(e => e.status === 'on_leave').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Отчет по отпускам
                </CardTitle>
                <CardDescription>
                  Анализ использования отпусков
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Заявок на рассмотрении:</span>
                    <span className="font-medium text-yellow-600">
                      {leaveRequests.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Одобрено:</span>
                    <span className="font-medium text-green-600">
                      {leaveRequests.filter(r => r.status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Отклонено:</span>
                    <span className="font-medium text-red-600">
                      {leaveRequests.filter(r => r.status === 'rejected').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Отчет по обучению
                </CardTitle>
                <CardDescription>
                  Статистика обучения сотрудников
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Завершено курсов:</span>
                    <span className="font-medium text-green-600">
                      {trainingRecords.filter(t => t.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>В процессе:</span>
                    <span className="font-medium text-blue-600">
                      {trainingRecords.filter(t => t.status === 'in_progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Запланировано:</span>
                    <span className="font-medium text-purple-600">
                      {trainingRecords.filter(t => t.status === 'scheduled').length}
                    </span>
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
