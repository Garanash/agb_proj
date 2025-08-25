'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import PageLayout from '@/components/PageLayout'
import { useAuth } from '@/components/AuthContext'
import axios from 'axios'
import CreateDepartmentModal from '@/components/CreateDepartmentModal'
import EditDepartmentModal from '@/components/EditDepartmentModal'

export default function About() {
  const { user } = useAuth()
  const [openDepartment, setOpenDepartment] = useState<string | null>(null)
  const [departments, setDepartments] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = user?.role === 'admin'

  const toggleDepartment = (departmentName: string) => {
    setOpenDepartment(openDepartment === departmentName ? null : departmentName)
  }

  // Загружаем отделы с сервера
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/departments/')
        setDepartments(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке отделов:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  const handleDepartmentCreated = () => {
    // Перезагружаем отделы
    window.location.reload()
  }

  const handleDepartmentUpdated = () => {
    // Перезагружаем отделы
    window.location.reload()
  }

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот отдел?')) return
    
    try {
      await axios.delete(`http://localhost:8000/api/departments/${departmentId}`)
      window.location.reload()
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
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Добавить отдел</span>
                </button>
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
                        <p className="text-sm text-gray-600 mb-4">
                          {department.description}
                        </p>
                        <div className="text-sm text-gray-500">
                          Отдел создан: {new Date(department.created_at).toLocaleDateString('ru-RU')}
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
    </PageLayout>
  )
}