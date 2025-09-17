'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../../src/utils/api';
import Image from 'next/image'
import { ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import PageLayout from '../../src/components/layout/PageLayout'
import { useAuth } from '../../src/hooks/useAuth'
import axios from 'axios'
import CreateDepartmentModal from '../../src/components/modals/CreateDepartmentModal'
import EditDepartmentModal from '../../src/components/modals/EditDepartmentModal'
import CompanyEmployeeModal from '../../src/components/modals/CompanyEmployeeModal'

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
          axios.get(`${getApiUrl()}/api/v1/departments/list`),
          axios.get(`${getApiUrl()}/api/v1/company-employees/`)
        ])
        setDepartments(departmentsResponse.data.departments || [])
        setCompanyEmployees(employeesResponse.data.employees || [])
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
        const response = await axios.get(`${getApiUrl()}/api/v1/departments/list`)
        console.log('Обновляем список отделов:', response.data)
        setDepartments(response.data.departments || [])
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
        const response = await axios.get(`${getApiUrl()}/api/v1/departments/list`)
        console.log('Обновляем список отделов после редактирования:', response.data)
        setDepartments(response.data.departments || [])
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
        const response = await axios.get(`${getApiUrl()}/api/v1/company-employees/`)
        console.log('Обновляем список сотрудников:', response.data)
        setCompanyEmployees(response.data.employees || [])
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
        const response = await axios.get(`${getApiUrl()}/api/v1/company-employees/`)
        console.log('Обновляем список сотрудников после редактирования:', response.data)
        setCompanyEmployees(response.data.employees || [])
      } catch (error) {
        console.error('Ошибка при загрузке сотрудников:', error)
      }
    }, 500)
  }

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return
    
    try {
      await axios.delete(`${getApiUrl()}/api/v1/company-employees/${employeeId}`)
      // Обновляем список сотрудников без перезагрузки страницы
      setCompanyEmployees(prev => prev && Array.isArray(prev) ? prev.filter(emp => emp.id !== employeeId) : [])
    } catch (error) {
      console.error('Ошибка при удалении сотрудника:', error)
      alert('Ошибка при удалении сотрудника')
    }
  }

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот отдел?')) return
    
    try {
      await axios.delete(`${getApiUrl()}/api/v1/departments/${departmentId}`)
      // Обновляем список отделов без перезагрузки страницы
      setDepartments(prev => prev && Array.isArray(prev) ? prev.filter(dept => dept.id !== departmentId) : [])
    } catch (error) {
      console.error('Ошибка при удалении отдела:', error)
      alert('Ошибка при удалении отдела')
    }
  }

  return (
    <PageLayout 
      title="О нас"
      subtitle="ООО «Алмазгеобур» - НАДЁЖНЫЙ ПРОИЗВОДИТЕЛЬ бурового оборудования и запасных частей для всех видов горных работ"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Информация о компании */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Наша компания</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                Алмазгеобур осуществляет деятельность с 2013 года.
                С 2019 года производственной деятельности компания поставила рекорд на российском рынке, 
                реализовав более 100 единиц бурового оборудования для геологоразведочных работ.
                </p>
                <p>
                Благодаря накопленным знаниям о методах проведения горных работ во всех уголках земного шара, 
                успешной интеграции зарубежного и отечественного опыта реализации конструкторских проектов и 
                ежедневной обратной связи от заказчиков, компания производит буровое оборудование, 
                которое ценят не только самые крупные коммерческие компании, но и системообразующие 
                предприятия России и мира.
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Мы производим и обслуживаем оборудование для всех видов горных работ</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">ГЕОЛОГОРАЗВЕДОЧНЫЕ РАБОТЫ</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700"> БУРОВЗРЫВНЫЕ РАБОТЫ</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700"> ПОДЗЕМНЫЕ ГОРНЫЕ РАБОТЫ</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">ТЕХНИКА NORMET</span>
                </div>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 p-6 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">12+</div>
              <div className="text-sm text-gray-600">Лет опыта</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">3000+</div>
              <div className="text-sm text-gray-600">крупных проектов по импортозамещению
на самую дефицитную
технику в России</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">13+</div>
              <div className="text-sm text-gray-600">филиалов
с каждым годом наше
покрытие в мире
только растет</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-sm text-gray-600">единиц капитального
бурового оборудования
с 2019 года производственной деятельности</div>
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
              {departments && departments.length > 0 ? departments.map((department) => (
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
                            {companyEmployees && Array.isArray(companyEmployees) && companyEmployees.length > 0 ? companyEmployees
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
                              )) : null}
                            {(!companyEmployees || !Array.isArray(companyEmployees) || companyEmployees.length === 0 || 
                              companyEmployees.filter(emp => emp.department_id === department.id && emp.is_active).length === 0) && (
                              <div className="text-sm text-gray-500 italic">В отделе пока нет сотрудников</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoading ? 'Загрузка отделов...' : 'Отделы не найдены'}
                </div>
              )}
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