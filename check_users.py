#!/usr/bin/env python3
"""
Проверка пользователей в базе данных
"""

import asyncio
from database import AsyncSessionLocal
from sqlalchemy import select
from models import User

async def check_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print(f"📊 Найдено пользователей: {len(users)}")
        for user in users:
            print(f"   - {user.username} ({user.email}) - роль: {user.role}")

if __name__ == "__main__":
    asyncio.run(check_users())
