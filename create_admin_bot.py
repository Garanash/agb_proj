#!/usr/bin/env python3
"""
Скрипт для создания административного бота с VseGPT API ключом.
Используйте свой реальный API ключ от https://vsegpt.ru/
"""

import asyncio
from database import AsyncSessionLocal
from models import ChatBot

async def create_admin_bot():
    async with AsyncSessionLocal() as db:
        try:
            # Создаем административного бота
            admin_bot = ChatBot(
                name='Admin Assistant',
                description='Административный помощник с доступом к VseGPT API',
                api_key='YOUR_VSEGPT_API_KEY_HERE',  # Замените на ваш реальный ключ
                model_id='gpt-4o-mini',
                system_prompt='Вы - административный помощник компании Алмазгеобур. Отвечайте профессионально и помогайте с рабочими вопросами.'
            )
            
            db.add(admin_bot)
            await db.commit()
            await db.refresh(admin_bot)
            
            print(f"Создан бот: {admin_bot.name} (ID: {admin_bot.id})")
            print("Не забудьте заменить 'YOUR_VSEGPT_API_KEY_HERE' на ваш реальный API ключ!")
            
        except Exception as e:
            print(f'Ошибка: {e}')
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(create_admin_bot())
