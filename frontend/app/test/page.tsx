'use client'

import { useState } from 'react'
import { getApiUrl } from '@/utils';
import Link from 'next/link'

export default function TestPage() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Тестовая страница</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Тест состояния</h2>
          <p className="text-gray-600 mb-4">Счетчик: {count}</p>
          <button
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Увеличить счетчик
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Тест навигации</h2>
          <div className="space-y-4">
            <Link 
              href="/"
              className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
            >
              Перейти на главную
            </Link>
            
            <Link 
              href="/ved-passports"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              Перейти к паспортам ВЭД
            </Link>
            
            <Link 
              href="/ved-passports/create"
              className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
            >
              Перейти к созданию паспортов
            </Link>
            
            <Link 
              href="/ved-passports/archive"
              className="block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-center"
            >
              Перейти к архиву паспортов
            </Link>
            
            <Link 
              href="/about"
              className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-center"
            >
              Перейти к странице "О нас"
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Инструкции по тестированию</h2>
          <div className="text-gray-600 space-y-2">
            <p>1. Увеличьте счетчик несколько раз</p>
            <p>2. Попробуйте перейти на любую из страниц выше</p>
            <p>3. Вернитесь на тестовую страницу</p>
            <p>4. Проверьте, сохранился ли счетчик</p>
            <p>5. Попробуйте использовать боковое меню для навигации</p>
          </div>
        </div>
      </div>
    </div>
  )
}

