"""
Telegram Bot Service для работы с заявками на ремонт
"""
import asyncio
import logging
from typing import Dict, Any
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os

from models import TelegramBot, TelegramUser, TelegramNotification, RepairRequest, ContractorResponse, UserRole
from database import get_db

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TelegramBotService:
    """Сервис для управления Telegram ботом"""

    def __init__(self):
        self.bots: Dict[str, Bot] = {}
        self.dispatchers: Dict[str, Dispatcher] = {}
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://felix_user:felix_password@postgres:5432/agb_felix"
        )

        # Создаем асинхронный engine для бота
        self.engine = create_async_engine(self.database_url, echo=False)
        self.async_session = sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    async def init_bots(self):
        """Инициализация всех активных ботов"""
        async with self.async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(TelegramBot).where(TelegramBot.is_active == True)
            )
            bots = result.scalars().all()

            for bot_data in bots:
                try:
                    bot = Bot(
                        token=bot_data.token,
                        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
                    )
                    dp = Dispatcher()

                    # Регистрируем обработчики
                    self.register_handlers(dp, session)

                    self.bots[bot_data.token] = bot
                    self.dispatchers[bot_data.token] = dp

                    logger.info(f"✅ Бот {bot_data.name} инициализирован")

                except Exception as e:
                    logger.error(f"❌ Ошибка инициализации бота {bot_data.name}: {e}")

    def register_handlers(self, dp: Dispatcher, session: AsyncSession):
        """Регистрация обработчиков команд"""

        @dp.message()
        async def handle_message(message: Message):
            """Обработка входящих сообщений"""
            try:
                async with self.async_session() as session:
                    await self.process_message(message, session)
            except Exception as e:
                logger.error(f"Ошибка обработки сообщения: {e}")

        @dp.callback_query()
        async def handle_callback(callback: CallbackQuery):
            """Обработка нажатий на inline кнопки"""
            try:
                async with self.async_session() as session:
                    await self.process_callback(callback, session)
            except Exception as e:
                logger.error(f"Ошибка обработки callback: {e}")

    async def process_message(self, message: Message, session: AsyncSession):
        """Обработка входящего сообщения"""
        chat_id = message.chat.id
        text = message.text or ""
        user = message.from_user

        logger.info(f"Получено сообщение от {user.username} ({user.id}): {text}")

        # Сохраняем информацию о пользователе
        await self.save_telegram_user(session, user, chat_id)

        # Обрабатываем команды
        if text.startswith("/start"):
            await self.handle_start_command(message, session)
        elif text.startswith("/help"):
            await self.handle_help_command(message, session)
        elif text.startswith("/requests"):
            await self.handle_requests_command(message, session)
        else:
            # Неизвестная команда
            await message.reply(
                "Неизвестная команда. Используйте /help для получения справки."
            )

    async def process_callback(self, callback: CallbackQuery, session: AsyncSession):
        """Обработка нажатия на inline кнопку"""
        callback_data = callback.data

        if callback_data.startswith("respond_"):
            request_id = int(callback_data.split("_")[1])
            await self.handle_response_callback(callback, request_id, session)
        else:
            await callback.answer("Неизвестная команда")

    async def handle_start_command(self, message: Message, session: AsyncSession):
        """Обработка команды /start"""
        welcome_text = """
🤖 <b>Привет! Я бот для работы с заявками на ремонт.</b>

Я буду уведомлять вас о новых заявках и помогать управлять откликами.

<b>Доступные команды:</b>
/help - Показать справку
/requests - Показать активные заявки
/my_responses - Мои отклики

Вы также будете автоматически получать уведомления о новых заявках с кнопкой "Откликнуться".
"""

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📋 Активные заявки", callback_data="show_requests")],
            [InlineKeyboardButton(text="❓ Помощь", callback_data="show_help")]
        ])

        await message.reply(welcome_text, reply_markup=keyboard)

    async def handle_help_command(self, message: Message, session: AsyncSession):
        """Обработка команды /help"""
        help_text = """
<b>Справка по командам:</b>

/start - Запустить бота
/help - Показать эту справку
/requests - Показать активные заявки
/my_responses - Показать мои отклики

<b>Как работать с заявками:</b>
1. Я автоматически присылаю уведомления о новых заявках
2. Нажмите "Откликнуться" чтобы выразить интерес
3. Ваши отклики будут переданы заказчику

<b>Контакты:</b>
Если у вас возникли вопросы, обратитесь к администратору системы.
"""

        await message.reply(help_text)

    async def handle_requests_command(self, message: Message, session: AsyncSession):
        """Обработка команды /requests"""
        # Получаем активные заявки
        from sqlalchemy import select
        result = await session.execute(
            select(RepairRequest).where(RepairRequest.status == "active").limit(10)
        )
        requests = result.scalars().all()

        if not requests:
            await message.reply("📭 Активных заявок нет")
            return

        response_text = "<b>📋 Активные заявки:</b>\n\n"

        for req in requests:
            response_text += f"""
🆔 <b>Заявка #{req.id}</b>
📝 {req.description[:100]}{'...' if len(req.description) > 100 else ''}
🏢 {req.city or 'Город не указан'}
📅 {req.preferred_date.strftime('%d.%m.%Y') if req.preferred_date else 'Дата не указана'}
---
"""

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔄 Обновить", callback_data="refresh_requests")]
        ])

        await message.reply(response_text, reply_markup=keyboard)

    async def handle_response_callback(self, callback: CallbackQuery, request_id: int, session: AsyncSession):
        """Обработка отклика на заявку"""
        user = callback.from_user

        # Находим пользователя в системе
        from sqlalchemy import select
        result = await session.execute(
            select(TelegramUser).where(TelegramUser.telegram_id == user.id)
        )
        telegram_user = result.scalars().first()

        if not telegram_user:
            await callback.answer("❌ Вы не привязаны к системе. Обратитесь к администратору.")
            return

        # Проверяем, не откликался ли уже пользователь
        result = await session.execute(
            select(ContractorResponse).where(
                ContractorResponse.request_id == request_id,
                ContractorResponse.contractor_id == telegram_user.user_id
            )
        )
        existing_response = result.scalars().first()

        if existing_response:
            await callback.answer("✅ Вы уже откликнулись на эту заявку")
            return

        # Создаем отклик
        from models import ContractorResponse, ResponseStatus
        new_response = ContractorResponse(
            request_id=request_id,
            contractor_id=telegram_user.user_id,
            response_text="Отклик через Telegram бот",
            status=ResponseStatus.PENDING
        )

        session.add(new_response)
        await session.commit()

        await callback.answer("✅ Ваш отклик принят! Мы свяжемся с вами в ближайшее время.")

        # Отправляем подтверждение в чат
        bot = self.bots.get(list(self.bots.keys())[0])  # Берем первого активного бота
        if bot:
            await bot.send_message(
                chat_id=user.id,
                text="✅ <b>Отклик успешно отправлен!</b>\n\nМы передали вашу заявку заказчику. Ожидайте связи."
            )

    async def send_new_request_notification(self, request_id: int, session: AsyncSession):
        """Отправка уведомления о новой заявке всем исполнителям"""
        # Получаем заявку
        from sqlalchemy import select
        result = await session.execute(
            select(RepairRequest).where(RepairRequest.id == request_id)
        )
        request = result.scalars().first()

        if not request:
            return

        # Получаем всех исполнителей с Telegram
        result = await session.execute(
            select(TelegramUser).join(User).where(User.role == UserRole.CONTRACTOR)
        )
        contractors = result.scalars().all()

        # Формируем сообщение
        message = f"""
🛠️ <b>Новая заявка на ремонт!</b>

📋 <b>Описание:</b> {request.description}
📍 <b>Адрес:</b> {request.address or 'Не указан'}
🏢 <b>Город:</b> {request.city or 'Не указан'}
📞 <b>Телефон:</b> {request.preferred_phone or 'Не указан'}
⚡ <b>Срочность:</b> {request.urgency or 'Не указана'}
📅 <b>Предпочтительная дата:</b> {request.preferred_date.strftime('%d.%m.%Y') if request.preferred_date else 'Не указана'}

Заказчик: {request.customer_name or 'Не указан'}
"""

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="Откликнуться на заявку",
                callback_data=f"respond_{request.id}"
            )]
        ])

        # Отправляем уведомления
        for bot_token, bot in self.bots.items():
            for contractor in contractors:
                try:
                    result = await bot.send_message(
                        chat_id=contractor.telegram_id,
                        text=message,
                        reply_markup=keyboard
                    )

                    # Сохраняем уведомление в БД
                    notification = TelegramNotification(
                        telegram_user_id=contractor.id,
                        message_type="new_request",
                        message_text=message,
                        message_id=result.message_id,
                        chat_id=contractor.telegram_id,
                        repair_request_id=request.id
                    )
                    session.add(notification)

                except Exception as e:
                    logger.error(f"Ошибка отправки уведомления: {e}")

        await session.commit()

    async def save_telegram_user(self, session: AsyncSession, user, chat_id: int):
        """Сохранение информации о Telegram пользователе"""
        from sqlalchemy import select

        result = await session.execute(
            select(TelegramUser).where(TelegramUser.telegram_id == user.id)
        )
        existing_user = result.scalars().first()

        if not existing_user:
            # Создаем нового пользователя (пока без привязки к системному пользователю)
            telegram_user = TelegramUser(
                user_id=1,  # Временный ID, нужно будет привязать к реальному пользователю
                telegram_id=user.id,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name
            )
            session.add(telegram_user)
            await session.commit()

    async def start_polling(self):
        """Запуск polling для всех ботов"""
        if not self.bots:
            logger.warning("Нет активных ботов для запуска")
            return

        tasks = []

        for bot_token, dp in self.dispatchers.items():
            bot = self.bots[bot_token]
            task = asyncio.create_task(dp.start_polling(bot))
            tasks.append(task)
            logger.info(f"🚀 Запущен polling для бота с токеном {bot_token[:10]}...")

        # Ждем завершения всех задач
        await asyncio.gather(*tasks, return_exceptions=True)

    async def stop_bots(self):
        """Остановка всех ботов"""
        for bot in self.bots.values():
            await bot.session.close()
        logger.info("🛑 Все боты остановлены")


# Глобальный экземпляр сервиса
telegram_service = TelegramBotService()


async def start_telegram_service():
    """Запуск Telegram сервиса"""
    await telegram_service.init_bots()

    if telegram_service.bots:
        logger.info("🤖 Запуск Telegram ботов...")
        await telegram_service.start_polling()
    else:
        logger.warning("⚠️ Нет активных Telegram ботов")


async def notify_new_request(request_id: int):
    """Отправка уведомления о новой заявке (вызывается из основного приложения)"""
    async with telegram_service.async_session() as session:
        await telegram_service.send_new_request_notification(request_id, session)


if __name__ == "__main__":
    # Запуск для тестирования
    asyncio.run(start_telegram_service())
