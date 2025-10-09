from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import ApiKey

async def get_api_key(db: AsyncSession) -> str:
    """Получить активный API ключ для ИИ"""
    try:
        print("🔑 Ищем активный API ключ...")
        result = await db.execute(
            select(ApiKey)
            .where(ApiKey.is_active == True)
            .where(ApiKey.provider == 'polza')
            .order_by(ApiKey.last_used.desc())
            .limit(1)
        )
        api_key = result.scalar_one_or_none()
        
        if api_key:
            print("✅ API ключ найден")
            return api_key.key
        else:
            print("❌ Активный API ключ не найден")
            return None
    except Exception as e:
        print(f"❌ Ошибка получения API ключа: {str(e)}")
        return None







