from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
import httpx
from datetime import datetime

from database import get_db
from models import User, TelegramBot, TelegramUser, TelegramNotification, RepairRequest, ContractorResponse, UserRole
from schemas import (
    TelegramBot as TelegramBotSchema,
    TelegramBotCreate,
    TelegramBotUpdate,
    TelegramUser as TelegramUserSchema,
    TelegramUserCreate,
    TelegramUserUpdate,
    TelegramNotification as TelegramNotificationSchema,
    TelegramWebhookUpdate,
    TelegramBotCommand
)
from dependencies import get_current_user

router = APIRouter(prefix="/telegram", tags=["telegram"])


# Функция для отправки сообщения в Telegram
async def send_telegram_message(bot_token: str, chat_id: int, text: str, reply_markup=None):
    """Отправляет сообщение в Telegram"""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    data = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }

    if reply_markup:
        data["reply_markup"] = reply_markup

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data)
        return response.json()


# Функция для установки webhook
async def set_telegram_webhook(bot_token: str, webhook_url: str):
    """Устанавливает webhook для бота"""
    url = f"https://api.telegram.org/bot{bot_token}/setWebhook"

    data = {
        "url": webhook_url,
        "allowed_updates": ["message", "callback_query"]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data)
        return response.json()


# Функция для создания inline клавиатуры
def create_response_keyboard(request_id: int):
    """Создает клавиатуру с кнопкой 'Откликнуться'"""
    keyboard = {
        "inline_keyboard": [
            [
                {
                    "text": "Откликнуться на заявку",
                    "callback_data": f"respond_{request_id}"
                }
            ]
        ]
    }
    return keyboard


@router.post("/bots", response_model=TelegramBotSchema)
async def create_telegram_bot(
    bot_data: TelegramBotCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового Telegram бота"""

    if current_user.role not in [UserRole.ADMIN, UserRole.SERVICE_ENGINEER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания бота"
        )

    # Проверяем, что токен уникален
    result = await db.execute(
        select(TelegramBot).where(TelegramBot.token == bot_data.token)
    )
    existing_bot = result.scalars().first()
    if existing_bot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Бот с таким токеном уже существует"
        )

    new_bot = TelegramBot(
        name=bot_data.name,
        token=bot_data.token,
        is_active=bot_data.is_active,
        webhook_url=bot_data.webhook_url
    )

    db.add(new_bot)
    await db.commit()
    await db.refresh(new_bot)

    return new_bot


@router.get("/bots", response_model=List[TelegramBotSchema])
async def get_telegram_bots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех ботов"""

    if current_user.role not in [UserRole.ADMIN, UserRole.SERVICE_ENGINEER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра ботов"
        )

    result = await db.execute(select(TelegramBot))
    bots = result.scalars().all()

    return bots


@router.put("/bots/{bot_id}", response_model=TelegramBotSchema)
async def update_telegram_bot(
    bot_id: int,
    bot_data: TelegramBotUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление настроек бота"""

    if current_user.role not in [UserRole.ADMIN, UserRole.SERVICE_ENGINEER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для обновления бота"
        )

    result = await db.execute(
        select(TelegramBot).where(TelegramBot.id == bot_id)
    )
    bot = result.scalars().first()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бот не найден"
        )

    # Обновляем поля
    update_data = bot_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bot, field, value)

    bot.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(bot)

    return bot


@router.post("/bots/{bot_id}/webhook")
async def set_bot_webhook(
    bot_id: int,
    webhook_data: TelegramWebhookUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Установка webhook для бота"""

    if current_user.role not in [UserRole.ADMIN, UserRole.SERVICE_ENGINEER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для настройки webhook"
        )

    result = await db.execute(
        select(TelegramBot).where(TelegramBot.id == bot_id)
    )
    bot = result.scalars().first()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бот не найден"
        )

    # Устанавливаем webhook
    webhook_result = await set_telegram_webhook(bot.token, webhook_data.url)

    if webhook_result.get("ok"):
        bot.webhook_url = webhook_data.url
        await db.commit()
        await db.refresh(bot)

        return {"message": "Webhook успешно установлен", "result": webhook_result}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка установки webhook: {webhook_result}"
        )


@router.post("/users", response_model=TelegramUserSchema)
async def link_telegram_user(
    user_data: TelegramUserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Связывание пользователя с Telegram аккаунтом"""

    # Проверяем, что пользователь существует
    result = await db.execute(
        select(User).where(User.id == user_data.user_id)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    # Проверяем, что Telegram ID не занят
    result = await db.execute(
        select(TelegramUser).where(TelegramUser.telegram_id == user_data.telegram_id)
    )
    existing_link = result.scalars().first()

    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот Telegram аккаунт уже связан с другим пользователем"
        )

    new_telegram_user = TelegramUser(
        user_id=user_data.user_id,
        telegram_id=user_data.telegram_id,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        is_bot_user=user_data.is_bot_user
    )

    db.add(new_telegram_user)
    await db.commit()
    await db.refresh(new_telegram_user)

    return new_telegram_user


@router.get("/users", response_model=List[TelegramUserSchema])
async def get_telegram_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка связанных Telegram пользователей"""

    if current_user.role not in [UserRole.ADMIN, UserRole.SERVICE_ENGINEER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра Telegram пользователей"
        )

    result = await db.execute(select(TelegramUser))
    telegram_users = result.scalars().all()

    return telegram_users


@router.post("/notify/new-request/{request_id}")
async def notify_new_request(
    request_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отправка уведомления о новой заявке всем исполнителям в Telegram"""

    if current_user.role not in [UserRole.ADMIN, UserRole.SERVICE_ENGINEER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для отправки уведомлений"
        )

    # Получаем заявку
    result = await db.execute(
        select(RepairRequest).where(RepairRequest.id == request_id)
    )
    request = result.scalars().first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )

    # Получаем всех активных ботов
    result = await db.execute(
        select(TelegramBot).where(TelegramBot.is_active == True)
    )
    bots = result.scalars().all()

    if not bots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нет активных Telegram ботов"
        )

    # Получаем всех исполнителей, связанных с Telegram
    result = await db.execute(
        select(TelegramUser).join(User).where(User.role == UserRole.CONTRACTOR)
    )
    telegram_contractors = result.scalars().all()

    if not telegram_contractors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нет исполнителей, связанных с Telegram"
        )

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

    # Отправляем уведомления всем исполнителям
    notifications_sent = 0

    for bot in bots:
        for contractor in telegram_contractors:
            try:
                keyboard = create_response_keyboard(request.id)
                result = await send_telegram_message(
                    bot.token,
                    contractor.telegram_id,
                    message,
                    keyboard
                )

                if result.get("ok"):
                    # Сохраняем уведомление в БД
                    notification = TelegramNotification(
                        telegram_user_id=contractor.id,
                        message_type="new_request",
                        message_text=message,
                        message_id=result["result"]["message_id"],
                        chat_id=contractor.telegram_id,
                        repair_request_id=request.id
                    )
                    db.add(notification)
                    notifications_sent += 1

            except Exception as e:
                print(f"Ошибка отправки уведомления: {e}")
                continue

    await db.commit()

    return {
        "message": f"Уведомления отправлены {notifications_sent} исполнителям",
        "request_id": request_id,
        "contractors_notified": len(telegram_contractors)
    }


@router.post("/webhook/{bot_token}")
async def telegram_webhook(
    bot_token: str,
    update_data: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Обработка webhook от Telegram"""

    # Находим бота по токену
    result = await db.execute(
        select(TelegramBot).where(TelegramBot.token == bot_token)
    )
    bot = result.scalars().first()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бот не найден"
        )

    # Обрабатываем callback query (нажатие кнопки)
    if "callback_query" in update_data:
        callback_query = update_data["callback_query"]
        callback_data = callback_query["data"]

        if callback_data.startswith("respond_"):
            request_id = int(callback_data.split("_")[1])

            # Находим пользователя по Telegram ID
            result = await db.execute(
                select(TelegramUser).where(TelegramUser.telegram_id == callback_query["from"]["id"])
            )
            telegram_user = result.scalars().first()

            if telegram_user:
                # Создаем отклик на заявку
                contractor_response = ContractorResponse(
                    request_id=request_id,
                    contractor_id=telegram_user.user_id,
                    response_text="Отклик через Telegram бот",
                    status="pending"
                )

                db.add(contractor_response)
                await db.commit()

                # Отправляем подтверждение пользователю
                await send_telegram_message(
                    bot.token,
                    telegram_user.telegram_id,
                    "✅ Ваш отклик на заявку принят! Мы свяжемся с вами в ближайшее время."
                )

    # Обрабатываем обычные сообщения
    elif "message" in update_data:
        message = update_data["message"]
        chat_id = message["chat"]["id"]
        text = message.get("text", "")

        # Сохраняем информацию о пользователе
        telegram_user_data = message["from"]
        telegram_id = telegram_user_data["id"]

        # Проверяем, есть ли уже связь с пользователем
        result = await db.execute(
            select(TelegramUser).where(TelegramUser.telegram_id == telegram_id)
        )
        existing_user = result.scalars().first()

        if not existing_user:
            # Создаем новую связь (пока без привязки к системному пользователю)
            new_telegram_user = TelegramUser(
                user_id=1,  # Временный ID, нужно будет привязать к реальному пользователю
                telegram_id=telegram_id,
                username=telegram_user_data.get("username"),
                first_name=telegram_user_data.get("first_name"),
                last_name=telegram_user_data.get("last_name")
            )
            db.add(new_telegram_user)
            await db.commit()

        # Обрабатываем команды
        if text.startswith("/start"):
            welcome_message = """
🤖 <b>Привет! Я бот для работы с заявками на ремонт.</b>

Я буду уведомлять вас о новых заявках и помогать управлять откликами.

<b>Доступные команды:</b>
/help - Показать справку
/requests - Показать активные заявки
"""
            await send_telegram_message(bot.token, chat_id, welcome_message)

        elif text.startswith("/help"):
            help_message = """
<b>Справка по командам:</b>

/start - Запустить бота
/help - Показать эту справку
/requests - Показать активные заявки

Вы также будете автоматически получать уведомления о новых заявках с кнопкой "Откликнуться".
"""
            await send_telegram_message(bot.token, chat_id, help_message)

    return {"ok": True}


@router.get("/stats")
async def get_telegram_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение статистики по Telegram интеграции"""

    if current_user.role not in [UserRole.ADMIN, UserRole.SERVICE_ENGINEER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра статистики"
        )

    # Статистика ботов
    result = await db.execute(select(TelegramBot))
    bots = result.scalars().all()

    # Статистика пользователей
    result = await db.execute(select(TelegramUser))
    telegram_users = result.scalars().all()

    # Статистика уведомлений
    result = await db.execute(select(TelegramNotification))
    notifications = result.scalars().all()

    return {
        "bots": {
            "total": len(bots),
            "active": len([b for b in bots if b.is_active])
        },
        "users": {
            "total": len(telegram_users),
            "contractors": len([u for u in telegram_users if not u.is_bot_user])
        },
        "notifications": {
            "total": len(notifications),
            "unread": len([n for n in notifications if not n.is_read])
        }
    }
