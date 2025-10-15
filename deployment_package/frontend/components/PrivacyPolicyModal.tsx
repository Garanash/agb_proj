'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  const [scrollProgress, setScrollProgress] = useState(0)

  const contentRef = useRef<HTMLDivElement>(null)
  const scrollHandlerRef = useRef<(() => void) | null>(null)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Функция обновления скролла (только для отображения прогресса)
  const updateScrollProgress = useCallback(() => {
    if (!contentRef.current) return

    const element = contentRef.current
    const { scrollTop, scrollHeight, clientHeight } = element as any

    // Если контент помещается полностью
    if (scrollHeight <= clientHeight) {
      setScrollProgress(100)
      return
    }

    const maxScroll = scrollHeight - clientHeight
    const progress = Math.min((scrollTop / maxScroll) * 100, 100)
    
    // Обновляем прогресс
    setScrollProgress(progress)
  }, [])

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
    }
    
    throttleTimeoutRef.current = setTimeout(() => {
      updateScrollProgress()
    }, 16) // ~60fps
  }, [updateScrollProgress])

  // Установка scroll listener
  const setupScrollListener = useCallback(() => {
    if (!contentRef.current || scrollHandlerRef.current) return

    const element = contentRef.current
    scrollHandlerRef.current = handleScroll
    console.log('Scroll listener setup')
    
    // Первоначальная проверка
    updateScrollProgress()
  }, [handleScroll, updateScrollProgress])

  // Удаление scroll listener
  const removeScrollListener = useCallback(() => {
    if (contentRef.current && scrollHandlerRef.current) {
      (contentRef.current as any).removeEventListener('scroll', scrollHandlerRef.current)
      scrollHandlerRef.current = null
    }
    
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
      throttleTimeoutRef.current = null
    }
  }, [])

  // Сброс состояния при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      // Сбрасываем только прогресс скролла
      setScrollProgress(0)
      
      // Удаляем старые listeners
      removeScrollListener()
      
      // Устанавливаем новые listeners с небольшой задержкой
      const timer = setTimeout(() => {
        setupScrollListener()
      }, 100)
      
      return () => {
        clearTimeout(timer)
        removeScrollListener()
      }
    } else {
      removeScrollListener()
    }
  }, [isOpen, setupScrollListener, removeScrollListener])

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      removeScrollListener()
    }
  }, [removeScrollListener])

  const handleAccept = () => {
    onAccept()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      style={{ pointerEvents: 'auto' as any }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col shadow-2xl"
        style={{ pointerEvents: 'auto' as any }}
      >
        {/* Заголовок */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Политика обработки персональных данных
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap={"round" as const} strokeLinejoin={"round" as const} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Содержимое с прокруткой */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
          style={{
            maxHeight: '400px',
            pointerEvents: 'auto' as any,
            touchAction: 'auto'
          }}

        >
          <div
            className="p-6 min-h-[1200px]"
          >
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold mb-4">1. Общие положения</h3>
              <p className="mb-4">
                Настоящая политика обработки персональных данных (далее — Политика) применяется к информации,
                которую ООО "АГБ Сервис" (далее — Компания) может получить о пользователе во время использования
                им сайта и сервисов Компании.
              </p>

              <h3 className="text-lg font-semibold mb-4">2. Персональные данные пользователей</h3>
              <p className="mb-4">
                Под персональными данными понимается любая информация, относящаяся прямо или косвенно
                к определенному или определяемому физическому лицу (субъекту персональных данных).
              </p>
              <p className="mb-4">
                Компания может обрабатывать следующие категории персональных данных:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Фамилия, имя, отчество</li>
                <li>Контактная информация (телефон, email)</li>
                <li>Информация о профессиональной деятельности</li>
                <li>Техническая информация (IP-адрес, данные браузера)</li>
                <li>Информация о предпочтениях и интересах</li>
              </ul>

              <h3 className="text-lg font-semibold mb-4">3. Цели обработки персональных данных</h3>
              <p className="mb-4">
                Компания обрабатывает персональные данные пользователей в следующих целях:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Регистрация и аутентификация пользователей</li>
                <li>Предоставление доступа к сервисам Компании</li>
                <li>Связь с пользователями для предоставления информации</li>
                <li>Улучшение качества предоставляемых услуг</li>
                <li>Выполнение договорных обязательств</li>
                <li>Анализ использования сервисов</li>
              </ul>

              <h3 className="text-lg font-semibold mb-4">4. Правовые основания обработки</h3>
              <p className="mb-4">
                Обработка персональных данных осуществляется на следующих правовых основаниях:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Согласие субъекта персональных данных</li>
                <li>Необходимость исполнения договора</li>
                <li>Законные интересы Компании</li>
                <li>Требования законодательства</li>
              </ul>

              <h3 className="text-lg font-semibold mb-4">5. Передача персональных данных</h3>
              <p className="mb-4">
                Компания не передает персональные данные третьим лицам, за исключением случаев:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Получено согласие пользователя</li>
                <li>Необходимо для выполнения договорных обязательств</li>
                <li>Требуется законодательством</li>
                <li>Для защиты прав и интересов Компании</li>
              </ul>

              <h3 className="text-lg font-semibold mb-4">6. Защита персональных данных</h3>
              <p className="mb-4">
                Компания принимает необходимые организационные и технические меры для защиты
                персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения.
              </p>
              <p className="mb-4">
                Используются современные методы шифрования, многоуровневая система защиты и регулярные аудиты безопасности.
              </p>

              <h3 className="text-lg font-semibold mb-4">7. Права субъектов персональных данных</h3>
              <p className="mb-4">
                Субъекты персональных данных имеют право:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Получать информацию о обработке своих данных</li>
                <li>Требовать исправления или удаления данных</li>
                <li>Отозвать согласие на обработку</li>
                <li>Обжаловать действия Компании в уполномоченные органы</li>
              </ul>

              <h3 className="text-lg font-semibold mb-4">8. Cookies и аналитика</h3>
              <p className="mb-4">
                Сайт использует cookies и аналогичные технологии для улучшения работы сервиса,
                анализа трафика и персонализации контента. Вы можете отключить cookies в настройках браузера.
              </p>

              <h3 className="text-lg font-semibold mb-4">9. Изменения в Политике</h3>
              <p className="mb-4">
                Компания оставляет за собой право вносить изменения в настоящую Политику.
                Новая версия вступает в силу с момента ее размещения на сайте.
              </p>

              <h3 className="text-lg font-semibold mb-4">10. Контакты</h3>
              <p className="mb-4">
                По вопросам, связанным с обработкой персональных данных, вы можете обратиться:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p><strong>Email:</strong> privacy@agb-service.ru</p>
                <p><strong>Телефон:</strong> +7 (495) 123-45-67</p>
                <p><strong>Адрес:</strong> г. Москва, ул. Примерная, д. 1</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Важно!</h4>
                <p className="text-blue-800 text-sm mb-4">
                  Продолжая использовать наши сервисы, вы подтверждаете, что ознакомились с данной
                  Политикой и согласны с условиями обработки ваших персональных данных.
                </p>
                <p className="text-blue-800 text-sm">
                  Ваше согласие является добровольным и может быть отозвано в любое время путем направления
                  соответствующего уведомления на адрес электронной почты privacy@agb-service.ru.
                </p>
              </div>

              <h3 className="text-lg font-semibold mb-4">11. Сроки хранения персональных данных</h3>
              <p className="mb-4">
                Компания хранит персональные данные пользователей в течение срока, необходимого для достижения
                целей обработки, если более длительный срок не предусмотрен законодательством или договором.
              </p>
              <p className="mb-4">
                После достижения целей обработки или в случае отзыва согласия персональные данные подлежат
                уничтожению или обезличиванию в соответствии с установленными процедурами.
              </p>

              <h3 className="text-lg font-semibold mb-4">12. Международная передача данных</h3>
              <p className="mb-4">
                В случае необходимости передачи персональных данных за пределы Российской Федерации
                Компания обеспечивает адекватную защиту данных в соответствии с требованиями законодательства.
              </p>
              <p className="mb-4">
                Передача осуществляется только в юрисдикции с сопоставимым уровнем защиты персональных данных
                или при наличии соответствующих гарантий безопасности.
              </p>

              <h3 className="text-lg font-semibold mb-4">13. Автоматизированная обработка</h3>
              <p className="mb-4">
                Компания вправе осуществлять автоматизированную обработку персональных данных для принятия
                решений, порождающих юридические последствия для субъекта персональных данных или иным образом
                затрагивающих его права и законные интересы.
              </p>
              <p className="mb-4">
                В этом случае субъект персональных данных имеет право на получение объяснений относительно
                принятого решения и обжалование такого решения.
              </p>

              <h3 className="text-lg font-semibold mb-4">14. Обновление Политики</h3>
              <p className="mb-4">
                Компания регулярно пересматривает и обновляет настоящую Политику для обеспечения соответствия
                изменениям в законодательстве и практике обработки персональных данных.
              </p>
              <p className="mb-4">
                О существенных изменениях Политики пользователи будут уведомлены путем размещения
                соответствующего объявления на сайте или отправки уведомления на адрес электронной почты.
              </p>

              <h3 className="text-lg font-semibold mb-4">15. Ответственность</h3>
              <p className="mb-4">
                Компания несет ответственность за соблюдение требований законодательства о персональных данных
                и принимает все необходимые меры для обеспечения безопасности обрабатываемой информации.
              </p>
              <p className="mb-4">
                В случае нарушения прав субъектов персональных данных Компания принимает меры по устранению
                нарушений и компенсации причиненного ущерба в соответствии с законодательством.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Обратите внимание</h4>
                <p className="text-yellow-800 text-sm mb-2">
                  Эта политика конфиденциальности является юридически обязательным документом.
                </p>
                <p className="text-yellow-800 text-sm mb-2">
                  Ознакомьтесь со всеми разделами внимательно, так как они содержат важную информацию
                  о том, как мы обрабатываем ваши персональные данные.
                </p>
                <p className="text-yellow-800 text-sm">
                  Если у вас есть вопросы по поводу данной политики, пожалуйста, свяжитесь с нами
                  по адресу privacy@agb-service.ru.
                </p>
              </div>

              <div className="text-center py-8 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Спасибо за внимание к вашей конфиденциальности!</h4>
                <p className="text-gray-600">
                  Мы стремимся обеспечивать максимальную защиту ваших персональных данных и соблюдать
                  все требования законодательства в области обработки персональных данных.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Футер с кнопками */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex-1 mr-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Политика обработки персональных данных
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2 rounded-lg font-semibold transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Прочитал и соглашаюсь
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyModal
