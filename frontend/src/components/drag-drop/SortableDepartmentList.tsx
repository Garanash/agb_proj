'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDownIcon, PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { getApiUrl } from '@/utils/api'
import axios from 'axios'
import SortableEmployeeList from './SortableEmployeeList'

interface Department {
  id: number
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface SortableDepartmentListProps {
  departments: Department[]
  onDepartmentsChange: (departments: Department[]) => void
  onEditDepartment: (department: Department) => void
  onDeleteDepartment: (departmentId: number) => void
  isAdmin: boolean
  openDepartment: string | null
  onToggleDepartment: (departmentName: string) => void
  companyEmployees: any[]
  onEmployeesChange: (employees: any[]) => void
  onEditEmployee: (employee: any) => void
  onDeleteEmployee: (employeeId: number) => void
}

interface SortableDepartmentItemProps {
  department: Department
  isOpen: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  isAdmin: boolean
  companyEmployees: any[]
  onEmployeesChange: (employees: any[]) => void
  onEditEmployee: (employee: any) => void
  onDeleteEmployee: (employeeId: number) => void
  forceUpdate: number
}

function SortableDepartmentItem({
  department,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  isAdmin,
  companyEmployees,
  onEmployeesChange,
  onEditEmployee,
  onDeleteEmployee,
  forceUpdate
}: SortableDepartmentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: department.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const departmentEmployees = companyEmployees?.filter(emp => {
    const empDeptId = parseInt(emp.department_id.toString())
    const deptId = parseInt(department.id.toString())
    const isActive = emp.is_active === true || emp.is_active === 'true' || emp.is_active === undefined
    return empDeptId === deptId && isActive
  }) || []

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 px-6 py-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {department.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {department.description}
            </p>
          </div>
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        
        {isAdmin && (
          <div className="flex items-center space-x-2 px-4">
            <button
              {...attributes}
              {...listeners}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-grab active:cursor-grabbing"
              title="Перетащить для изменения порядка"
            >
              <Bars3Icon className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="px-6 py-4 bg-white dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <SortableEmployeeList
                key={`${department.id}-${forceUpdate}`}
                employees={departmentEmployees}
                onEmployeesChange={(updatedEmployees) => {
                  console.log('🔄 SortableDepartmentList: получены обновленные сотрудники:', updatedEmployees.map(emp => ({ id: emp.id, name: `${emp.last_name} ${emp.first_name}`, sort_order: emp.sort_order })))
                  
                  // Обновляем общий список сотрудников
                  const updatedCompanyEmployees = companyEmployees.map(emp => {
                    const updatedEmp = updatedEmployees.find(ue => ue.id === emp.id)
                    return updatedEmp || emp
                  })
                  
                  console.log('🔄 SortableDepartmentList: обновляем общий список сотрудников:', updatedCompanyEmployees.map(emp => ({ id: emp.id, name: `${emp.last_name} ${emp.first_name}`, sort_order: emp.sort_order })))
                  
                  onEmployeesChange([...updatedCompanyEmployees]) // Создаем новый массив для принудительного обновления
                }}
                onEditEmployee={onEditEmployee}
                onDeleteEmployee={onDeleteEmployee}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SortableDepartmentList({
  departments,
  onDepartmentsChange,
  onEditDepartment,
  onDeleteDepartment,
  isAdmin,
  openDepartment,
  onToggleDepartment,
  companyEmployees,
  onEmployeesChange,
  onEditEmployee,
  onDeleteEmployee
}: SortableDepartmentListProps) {
  const [forceUpdate, setForceUpdate] = useState(0)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = departments.findIndex((item) => item.id === active.id)
      const newIndex = departments.findIndex((item) => item.id === over?.id)

      const newDepartments = arrayMove(departments, oldIndex, newIndex)
      
      // Обновляем sort_order для всех отделов
      const updatedDepartments = newDepartments.map((dept, index) => ({
        ...dept,
        sort_order: index + 1
      }))

      onDepartmentsChange(updatedDepartments)
      setForceUpdate(prev => prev + 1) // Принудительно обновляем компонент

      // Отправляем обновления на сервер
      try {
        const departmentOrders = updatedDepartments.map((dept, index) => ({
          id: dept.id,
          sort_order: index + 1
        }))

        await axios.put(`${getApiUrl()}/api/v1/departments/reorder`, departmentOrders)
        console.log('✅ Порядок отделов обновлен на сервере')
        setForceUpdate(prev => prev + 1) // Дополнительно принудительно обновляем после успешного сохранения
      } catch (error) {
        console.error('❌ Ошибка при обновлении порядка отделов:', error)
        // В случае ошибки можно откатить изменения
        onDepartmentsChange(departments)
        setForceUpdate(prev => prev + 1) // Принудительно обновляем при откате
      }
    }
  }

  return (
    <DndContext
      key={forceUpdate}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        key={forceUpdate}
        items={departments.map(dept => dept.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {departments.map((department) => (
            <SortableDepartmentItem
              key={`${department.id}-${forceUpdate}`}
              department={department}
              isOpen={openDepartment === department.name}
              onToggle={() => onToggleDepartment(department.name)}
              onEdit={() => onEditDepartment(department)}
              onDelete={() => onDeleteDepartment(department.id)}
              isAdmin={isAdmin}
              companyEmployees={companyEmployees}
              onEmployeesChange={onEmployeesChange}
              onEditEmployee={onEditEmployee}
              onDeleteEmployee={onDeleteEmployee}
              forceUpdate={forceUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
