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
import { PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { getApiUrl } from '../../utils/api'
import axios from 'axios'

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  position: string
  department_id: number
  email?: string
  phone?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at?: string
}

interface SortableEmployeeListProps {
  employees: Employee[]
  onEmployeesChange: (employees: Employee[]) => void
  onEditEmployee: (employee: Employee) => void
  onDeleteEmployee: (employeeId: number) => void
  isAdmin: boolean
}

interface SortableEmployeeItemProps {
  employee: Employee
  onEdit: () => void
  onDelete: () => void
  isAdmin: boolean
}

function SortableEmployeeItem({
  employee,
  onEdit,
  onDelete,
  isAdmin
}: SortableEmployeeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: employee.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        {isAdmin && (
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors cursor-grab active:cursor-grabbing"
            title="Перетащить для изменения порядка"
          >
            <Bars3Icon className="w-4 h-4" />
          </button>
        )}
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {employee.last_name} {employee.first_name} {employee.middle_name}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{employee.position}</div>
          {employee.email && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{employee.email}</div>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function SortableEmployeeList({
  employees,
  onEmployeesChange,
  onEditEmployee,
  onDeleteEmployee,
  isAdmin
}: SortableEmployeeListProps) {
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
      console.log('🔄 Начинаем перетаскивание:', { activeId: active.id, overId: over?.id })
      
      const oldIndex = employees.findIndex((item) => item.id === active.id)
      const newIndex = employees.findIndex((item) => item.id === over?.id)

      console.log('📍 Индексы:', { oldIndex, newIndex })

      const newEmployees = arrayMove(employees, oldIndex, newIndex)
      
      // Обновляем sort_order для всех сотрудников
      const updatedEmployees = newEmployees.map((emp, index) => ({
        ...emp,
        sort_order: index + 1
      }))

      console.log('🔄 Обновленные сотрудники:', updatedEmployees.map(emp => ({ id: emp.id, name: `${emp.last_name} ${emp.first_name}`, sort_order: emp.sort_order })))

      // Сначала обновляем родительский компонент для мгновенной обратной связи
      onEmployeesChange([...updatedEmployees])
      setForceUpdate(prev => prev + 1) // Принудительно обновляем компонент
      console.log('✅ Родительский компонент обновлен')

      // Отправляем обновления на сервер
      try {
        const employeeOrders = updatedEmployees.map((emp, index) => ({
          id: emp.id,
          sort_order: index + 1
        }))

        console.log('📤 Отправляем на сервер:', employeeOrders)
        await axios.put(`${getApiUrl()}/api/v1/company-employees/reorder-employees`, employeeOrders)
        console.log('✅ Порядок сотрудников обновлен на сервере')
        
        // Дополнительно принудительно обновляем после успешного сохранения
        setForceUpdate(prev => prev + 1)
      } catch (error) {
        console.error('❌ Ошибка при обновлении порядка сотрудников:', error)
        // В случае ошибки откатываем изменения
        onEmployeesChange([...employees])
        setForceUpdate(prev => prev + 1) // Принудительно обновляем при откате
      }
    }
  }

  if (employees.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        В отделе пока нет сотрудников
      </div>
    )
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
        items={employees.map(emp => emp.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {employees.map((employee) => (
            <SortableEmployeeItem
              key={`${employee.id}-${forceUpdate}`}
              employee={employee}
              onEdit={() => onEditEmployee(employee)}
              onDelete={() => onDeleteEmployee(employee.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
