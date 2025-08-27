'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import PageLayout from '@/components/PageLayout'
import { useAuth } from '@/components/AuthContext'
import axios from 'axios'
import CreateDepartmentModal from '@/components/CreateDepartmentModal'
import EditDepartmentModal from '@/components/EditDepartmentModal'
import CompanyEmployeeModal from '@/components/CompanyEmployeeModal'

export default function About() {
  const { user } = useAuth()
  const [openDepartment, setOpenDepartment] = useState<string | null>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<any>(null)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = user?.role === 'admin'

  const toggleDepartment = (departmentName: string) => {
    setOpenDepartment(openDepartment === departmentName ? null : departmentName)
  }

  // Загружаем отделы и сотрудников с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsResponse, employeesResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/departments/'),
          axios.get('http://localhost:8000/api/company-employees/')
        ])
        setDepartments(departmentsResponse.data)
        setCompanyEmployees(employeesResponse.data)
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDepartmentCreated = () => {
    // Перезагружаем отделы без перезагрузки страницы
    // Добавляем небольшую задержку, чтобы backend успел обработать запрос
    setTimeout(async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/departments/')
        console.log('Обновляем список отделов:', response.data)
        setDepartments(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке отделов:', error)
      }
    }, 500)
  }

  const handleDepartmentUpdated = () => {
    // Перезагружаем отделы без перезагрузки страницы
    // Добавляем небольшую задержку, чтобы backend успел обработать запрос
    setTimeout(async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/departments/')
        console.log('Обновляем список отделов после редактирования:', response.data)
        setDepartments(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке отделов:', error)
      }
    }, 500)
  }

  const handleEmployeeCreated = () => {
    // Перезагружаем сотрудников без перезагрузки страницы
    // Добавляем небольшую задержку, чтобы backend успел обработать запрос
    setTimeout(async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/company-employees/')
        console.log('Обновляем список сотрудников:', response.data)
        setCompanyEmployees(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке сотрудников:', error)
      }
    }, 500)
  }

  const handleEmployeeUpdated = () => {
    // Перезагружаем сотрудников без перезагрузки страницы
    // Добавляем небольшую задержку, чтобы backend успел обработать запрос
    setTimeout(async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/company-employees/')
        console.log('Обновляем список сотрудников после редактирования:', response.data)
        setCompanyEmployees(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке сотрудников:', error)
      }
    }, 500)
  }

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return
    
    try {
      await axios.delete(`http://localhost:8000/api/company-employees/${employeeId}`)
      // Обновляем список сотрудников без перезагрузки страницы
      setCompanyEmployees(prev => prev.filter(emp => emp.id !== employeeId))
    } catch (error) {
      console.error('Ошибка при удалении сотрудника:', error)
      alert('Ошибка при удалении сотрудника')
    }
  }

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот отдел?')) return
    
    try {
      await axios.delete(`http://localhost:8000/api/departments/${departmentId}`)
      // Обновляем список отделов без перезагрузки страницы
      setDepartments(prev => prev.filter(dept => dept.id !== departmentId))
    } catch (error) {
      console.error('Ошибка при удалении отдела:', error)
      alert('Ошибка при удалении отдела')
    }
  }

  return (
    <PageLayout 
      title="О нас"
      subtitle="ООО «Алмазгеобур» - ведущая компания в области геологоразведки"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Информация о компании */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Наша компания</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  ООО «Алмазгеобур» является ведущей компанией в области геологоразведочных работ, 
                  специализирующейся на алмазном бурении и комплексных геологических исследованиях.
                </p>
                <p>
                  Наша команда высококвалифицированных специалистов обладает многолетним опытом 
                  в проведении геологоразведочных работ различной сложности.
                </p>
                <p>
                  Мы используем современное оборудование и передовые технологии для обеспечения 
                  высокого качества выполняемых работ и соблюдения всех требований безопасности.
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Наши услуги</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Алмазное бурение геологоразведочных скважин</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Комплексные геологические исследования</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Инженерно-геологические изыскания</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Лабораторные исследования керна</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Консультационные услуги</span>
                </div>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 p-6 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
              <div className="text-sm text-gray-600">Лет опыта</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-sm text-gray-600">Проектов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-sm text-gray-600">Специалистов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">99%</div>
              <div className="text-sm text-gray-600">Довольных клиентов</div>
            </div>
          </div>

          {/* Сотрудники по отделам */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Наша команда</h2>
              {isAdmin && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEmployeeModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Добавить сотрудника</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Добавить отдел</span>
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {departments.map((department) => (
                <div key={department.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleDepartment(department.name)}
                      className="flex-1 px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                        <p className="text-sm text-gray-600">{department.description}</p>
                      </div>
                      <ChevronDownIcon 
                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                          openDepartment === department.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isAdmin && (
                      <div className="flex items-center space-x-2 px-4">
                        <button
                          onClick={() => setEditingDepartment(department)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {openDepartment === department.name && (
                    <div className="px-6 py-4 bg-white">
                      <div className="space-y-4">
                        
                        
                        
                        {/* Сотрудники отдела */}
                        <div>
                          <div className="space-y-2">
                            {companyEmployees
                              .filter(emp => emp.department_id === department.id && emp.is_active)
                              .map(employee => (
                                <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {employee.last_name} {employee.first_name} {employee.middle_name}
                                    </div>
                                    <div className="text-sm text-gray-600">{employee.position}</div>
                                    {employee.email && (
                                      <div className="text-xs text-gray-500">{employee.email}</div>
                                    )}
                                  </div>
                                  {isAdmin && (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setEditingEmployee(employee)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      >
                                        <PencilIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEmployee(employee.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            {companyEmployees.filter(emp => emp.department_id === department.id && emp.is_active).length === 0 && (
                              <div className="text-sm text-gray-500 italic">В отделе пока нет сотрудников</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Модальные окна для управления отделами */}
      {showCreateModal && (
        <CreateDepartmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onDepartmentCreated={handleDepartmentCreated}
        />
      )}

      {editingDepartment && (
        <EditDepartmentModal
          isOpen={!!editingDepartment}
          onClose={() => setEditingDepartment(null)}
          onDepartmentUpdated={handleDepartmentUpdated}
          department={editingDepartment}
        />
      )}

      {/* Модальные окна для управления сотрудниками */}
      {showEmployeeModal && (
        <CompanyEmployeeModal
          isOpen={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          onEmployeeCreated={handleEmployeeCreated}
          onEmployeeUpdated={handleEmployeeUpdated}
        />
      )}

      {editingEmployee && (
        <CompanyEmployeeModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onEmployeeCreated={handleEmployeeCreated}
          onEmployeeUpdated={handleEmployeeUpdated}
          employee={editingEmployee}
        />
      )}
    </PageLayout>
  )
}