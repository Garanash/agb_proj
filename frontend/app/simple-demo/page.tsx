export default function SimpleDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Приветствие */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Добро пожаловать, Администратор! 👋
          </h1>
          <p className="text-blue-100">
            Панель управления системой Алмазгеобур Platform
          </p>
        </div>

        {/* Основная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Активные пользователи</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Документы</p>
                <p className="text-2xl font-bold text-gray-900">342</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Новости</p>
                <p className="text-2xl font-bold text-gray-900">15</p>
              </div>
            </div>
          </div>
        </div>

        {/* Производительность системы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Производительность системы</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Использование памяти</span>
                  <span>68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Загрузка CPU</span>
                  <span>23%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Использование диска</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Статистика</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего запросов</span>
                <span className="font-semibold text-gray-900">8,942</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ошибки</span>
                <span className="font-semibold text-red-600">0.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Успешные запросы</span>
                <span className="font-semibold text-green-600">99.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Время работы</span>
                <span className="font-semibold text-gray-900">15d 8h 32m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin/users" className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Управление пользователями</h4>
                  <p className="text-sm text-gray-600">Просмотр и редактирование пользователей</p>
                </div>
              </div>
            </a>

            <a href="/admin/settings" className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-500 text-white">
                  <span className="text-xl">⚙️</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Настройки системы</h4>
                  <p className="text-sm text-gray-600">Конфигурация приложения</p>
                </div>
              </div>
            </a>

            <a href="/admin/v3" className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500 text-white">
                  <span className="text-xl">🚀</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Админ панель v3</h4>
                  <p className="text-sm text-gray-600">Новая расширенная панель</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Последняя активность */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Последняя активность</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">admin</p>
                  <p className="text-xs text-gray-600">Вход в систему</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">2025-09-27 19:45:23</p>
                <p className="text-xs text-gray-500">192.168.1.100</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">user123</p>
                  <p className="text-xs text-gray-600">Создание документа</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">2025-09-27 19:44:12</p>
                <p className="text-xs text-gray-500">192.168.1.101</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">manager</p>
                  <p className="text-xs text-gray-600">Ошибка авторизации</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">2025-09-27 19:43:45</p>
                <p className="text-xs text-gray-500">192.168.1.102</p>
              </div>
            </div>
          </div>
        </div>

        {/* Статус системы */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <h4 className="text-green-800 font-medium">Система работает нормально</h4>
              <p className="text-green-600 text-sm">
                Все сервисы функционируют в штатном режиме. Время работы: 15d 8h 32m
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
