"""
API эндпоинты для поиска поставщиков артикулов
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import asyncio
import aiohttp
import re
import dns.resolver
import whois
import json
import logging

from database import get_db
from models import (
    User, Supplier, SupplierArticle, ArticleSearchRequest,
    ArticleSearchResult, SupplierValidationLog, ApiKey
)
from api.v1.endpoints.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# Схемы Pydantic
class ArticleSearchRequest(BaseModel):
    articles: List[str] = Field(..., min_items=1, description="Список артикулов для поиска")
    request_name: Optional[str] = Field(None, description="Название запроса")
    use_ai: bool = Field(True, description="Использовать ИИ для поиска")
    validate_contacts: bool = Field(True, description="Валидировать контакты поставщиков")


class SupplierResponse(BaseModel):
    id: int
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    email_validated: bool = False
    website_validated: bool = False
    is_active: bool = True
    created_at: datetime
    last_checked: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SupplierArticleResponse(BaseModel):
    id: int
    article_code: str
    article_name: str
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str = "RUB"
    unit: str = "шт"
    min_order_quantity: Optional[int] = None
    availability: Optional[str] = None
    agb_article: Optional[str] = None
    bl_article: Optional[str] = None
    created_at: datetime
    last_price_update: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SearchResultResponse(BaseModel):
    article_code: str
    suppliers: List[Dict[str, Any]]
    total_suppliers: int
    confidence_scores: List[float]


class SearchRequestResponse(BaseModel):
    id: int
    request_name: Optional[str] = None
    articles: List[str]
    status: str
    total_articles: int
    found_articles: int
    total_suppliers: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    results: List[SearchResultResponse] = []
    
    class Config:
        from_attributes = True


class SupplierGroupResponse(BaseModel):
    supplier: SupplierResponse
    articles: List[SupplierArticleResponse]
    total_articles: int
    avg_price: Optional[float] = None


# Вспомогательные функции
async def get_polza_api_key(db: AsyncSession) -> str:
    """Получить API ключ Polza.ai"""
    try:
        result = await db.execute(
            select(ApiKey)
            .where(ApiKey.is_active == True)
            .where(ApiKey.provider == 'polza')
            .limit(1)
        )
        api_key_obj = result.scalar_one_or_none()
        
        if not api_key_obj:
            raise HTTPException(status_code=400, detail="API ключ Polza.ai не настроен")
        
        # Расшифровываем ключ
        try:
            from cryptography.fernet import Fernet
            ENCRYPTION_KEY = b'iF0d2ARGQpaU9GFfQdWNovBL239dqwTp9hDDPrDQQic='
            cipher_suite = Fernet(ENCRYPTION_KEY)
            decrypted_key = cipher_suite.decrypt(api_key_obj.key.encode()).decode()
        except Exception:
            decrypted_key = api_key_obj.key
        
        return decrypted_key.strip()
    except Exception as e:
        logger.error(f"Ошибка получения API ключа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения API ключа")


async def search_suppliers_with_ai(article: str, api_key: str) -> List[Dict[str, Any]]:
    """Поиск поставщиков через Polza.ai"""
    try:
        prompt = f"""
        Найди поставщиков для артикула: {article}
        
        Нужно найти:
        1. Название компании-поставщика
        2. Контактное лицо (если есть)
        3. Email адрес
        4. Телефон
        5. Сайт компании
        6. Адрес (страна, город)
        7. Цену на этот артикул (если найдена)
        8. Минимальный заказ
        9. Наличие товара
        
        Верни результат в формате JSON массива объектов с полями:
        company_name, contact_person, email, phone, website, address, country, city, price, min_order_quantity, availability
        
        Ищи максимальное количество поставщиков для этого артикула.
        """
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-4",
                "messages": [
                    {"role": "system", "content": "Ты эксперт по поиску поставщиков промышленного оборудования. Найди максимальное количество поставщиков для указанного артикула."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 2000
            }
            
            async with session.post("https://api.polza.ai/v1/chat/completions", 
                                  headers=headers, json=data) as response:
                if response.status != 200:
                    raise Exception(f"Ошибка API: {response.status}")
                
                result = await response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Парсим JSON ответ
                try:
                    suppliers_data = json.loads(content)
                    if isinstance(suppliers_data, list):
                        return suppliers_data
                    else:
                        return [suppliers_data]
                except json.JSONDecodeError:
                    # Если не JSON, пытаемся извлечь данные из текста
                    return parse_suppliers_from_text(content)
                    
    except Exception as e:
        logger.error(f"Ошибка поиска поставщиков через ИИ: {e}")
        return []


def parse_suppliers_from_text(text: str) -> List[Dict[str, Any]]:
    """Парсинг данных поставщиков из текста"""
    suppliers = []
    lines = text.split('\n')
    
    current_supplier = {}
    for line in lines:
        line = line.strip()
        if not line:
            if current_supplier:
                suppliers.append(current_supplier)
                current_supplier = {}
            continue
            
        # Парсим различные поля
        if 'компания' in line.lower() or 'название' in line.lower():
            current_supplier['company_name'] = line.split(':', 1)[-1].strip()
        elif 'email' in line.lower():
            current_supplier['email'] = line.split(':', 1)[-1].strip()
        elif 'телефон' in line.lower() or 'phone' in line.lower():
            current_supplier['phone'] = line.split(':', 1)[-1].strip()
        elif 'сайт' in line.lower() or 'website' in line.lower():
            current_supplier['website'] = line.split(':', 1)[-1].strip()
        elif 'адрес' in line.lower() or 'address' in line.lower():
            current_supplier['address'] = line.split(':', 1)[-1].strip()
        elif 'цена' in line.lower() or 'price' in line.lower():
            price_text = line.split(':', 1)[-1].strip()
            try:
                current_supplier['price'] = float(re.findall(r'[\d,]+', price_text.replace(',', '.'))[0])
            except:
                pass
    
    if current_supplier:
        suppliers.append(current_supplier)
    
    return suppliers


async def validate_email(email: str) -> bool:
    """Валидация email адреса"""
    if not email:
        return False
    
    # Базовая проверка формата
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False
    
    try:
        # Проверка DNS записи
        domain = email.split('@')[1]
        dns.resolver.resolve(domain, 'MX')
        return True
    except:
        return False


async def validate_website(website: str) -> Dict[str, Any]:
    """Валидация и получение информации о сайте"""
    if not website:
        return {"valid": False, "whois_data": None}
    
    # Добавляем протокол если нет
    if not website.startswith(('http://', 'https://')):
        website = 'https://' + website
    
    try:
        # Проверка доступности сайта
        async with aiohttp.ClientSession() as session:
            async with session.get(website, timeout=10) as response:
                if response.status == 200:
                    # Получаем whois данные
                    try:
                        domain = website.replace('https://', '').replace('http://', '').split('/')[0]
                        whois_data = whois.whois(domain)
                        return {
                            "valid": True,
                            "whois_data": {
                                "domain": domain,
                                "registrar": getattr(whois_data, 'registrar', None),
                                "creation_date": getattr(whois_data, 'creation_date', None),
                                "expiration_date": getattr(whois_data, 'expiration_date', None),
                                "country": getattr(whois_data, 'country', None),
                                "org": getattr(whois_data, 'org', None)
                            }
                        }
                    except:
                        return {"valid": True, "whois_data": None}
                else:
                    return {"valid": False, "whois_data": None}
    except:
        return {"valid": False, "whois_data": None}


async def save_supplier_data(db: AsyncSession, supplier_data: Dict[str, Any], article: str) -> Optional[Supplier]:
    """Сохранение данных поставщика в базу"""
    try:
        # Проверяем, существует ли уже такой поставщик
        result = await db.execute(
            select(Supplier)
            .where(Supplier.company_name == supplier_data.get('company_name', ''))
            .where(Supplier.email == supplier_data.get('email', ''))
        )
        existing_supplier = result.scalar_one_or_none()
        
        if existing_supplier:
            supplier = existing_supplier
        else:
            # Создаем нового поставщика
            supplier = Supplier(
                company_name=supplier_data.get('company_name', ''),
                contact_person=supplier_data.get('contact_person'),
                email=supplier_data.get('email'),
                phone=supplier_data.get('phone'),
                website=supplier_data.get('website'),
                address=supplier_data.get('address'),
                country=supplier_data.get('country'),
                city=supplier_data.get('city')
            )
            db.add(supplier)
            await db.flush()
        
        # Создаем или обновляем артикул поставщика
        result = await db.execute(
            select(SupplierArticle)
            .where(SupplierArticle.supplier_id == supplier.id)
            .where(SupplierArticle.article_code == article)
        )
        existing_article = result.scalar_one_or_none()
        
        if existing_article:
            # Обновляем существующий артикул
            existing_article.article_name = supplier_data.get('article_name', article)
            existing_article.description = supplier_data.get('description')
            existing_article.price = supplier_data.get('price')
            existing_article.min_order_quantity = supplier_data.get('min_order_quantity')
            existing_article.availability = supplier_data.get('availability')
            existing_article.last_price_update = datetime.utcnow()
        else:
            # Создаем новый артикул
            supplier_article = SupplierArticle(
                supplier_id=supplier.id,
                article_code=article,
                article_name=supplier_data.get('article_name', article),
                description=supplier_data.get('description'),
                price=supplier_data.get('price'),
                min_order_quantity=supplier_data.get('min_order_quantity'),
                availability=supplier_data.get('availability')
            )
            db.add(supplier_article)
        
        await db.commit()
        return supplier
        
    except Exception as e:
        logger.error(f"Ошибка сохранения поставщика: {e}")
        await db.rollback()
        return None


# API эндпоинты
@router.get("/test")
async def test_endpoint():
    """Тестовый эндпоинт"""
    return {"message": "API v3 работает!", "status": "ok"}

@router.post("/search", response_model=SearchRequestResponse)
async def search_articles(
    request: ArticleSearchRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Поиск поставщиков для списка артикулов"""
    try:
        logger.info(f"🔍 Получен запрос поиска: {request}")
        logger.info(f"👤 Пользователь: {current_user.username}")
        # Создаем запрос на поиск
        search_request = ArticleSearchRequest(
            user_id=current_user.id,
            request_name=request.request_name,
            articles=request.articles,
            status="pending"
        )
        db.add(search_request)
        await db.flush()
        
        # Запускаем поиск в фоне
        background_tasks.add_task(
            process_article_search,
            search_request.id,
            request.articles,
            request.use_ai,
            request.validate_contacts
        )
        
        return SearchRequestResponse(
            id=search_request.id,
            request_name=search_request.request_name,
            articles=search_request.articles,
            status=search_request.status,
            total_articles=len(request.articles),
            found_articles=0,
            total_suppliers=0,
            created_at=search_request.created_at
        )
        
    except Exception as e:
        logger.error(f"Ошибка создания запроса поиска: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания запроса поиска: {str(e)}")


async def process_article_search(
    request_id: int,
    articles: List[str],
    use_ai: bool,
    validate_contacts: bool
):
    """Обработка поиска артикулов в фоне"""
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            # Обновляем статус
            result = await db.execute(
                select(ArticleSearchRequest).where(ArticleSearchRequest.id == request_id)
            )
            search_request = result.scalar_one_or_none()
            if not search_request:
                return
            
            search_request.status = "processing"
            await db.commit()
            
            api_key = None
            if use_ai:
                try:
                    api_key = await get_polza_api_key(db)
                except:
                    logger.warning("Не удалось получить API ключ, поиск без ИИ")
            
            found_articles = 0
            total_suppliers = 0
            
            for article in articles:
                suppliers_data = []
                
                # Поиск через ИИ
                if use_ai and api_key:
                    suppliers_data = await search_suppliers_with_ai(article, api_key)
                
                # Сохраняем найденных поставщиков
                for supplier_data in suppliers_data:
                    supplier = await save_supplier_data(db, supplier_data, article)
                    if supplier:
                        total_suppliers += 1
                        
                        # Валидация контактов
                        if validate_contacts:
                            await validate_supplier_contacts(db, supplier)
                        
                        # Создаем результат поиска
                        result = ArticleSearchResult(
                            request_id=request_id,
                            article_code=article,
                            supplier_id=supplier.id,
                            confidence_score=85.0,  # Базовая уверенность
                            match_type="ai_found"
                        )
                        db.add(result)
                
                if suppliers_data:
                    found_articles += 1
            
            # Обновляем статистику
            search_request.status = "completed"
            search_request.completed_at = datetime.utcnow()
            await db.commit()
            
        except Exception as e:
            logger.error(f"Ошибка обработки поиска: {e}")
            # Обновляем статус на ошибку
            result = await db.execute(
                select(ArticleSearchRequest).where(ArticleSearchRequest.id == request_id)
            )
            search_request = result.scalar_one_or_none()
            if search_request:
                search_request.status = "failed"
                await db.commit()


async def validate_supplier_contacts(db: AsyncSession, supplier: Supplier):
    """Валидация контактов поставщика"""
    try:
        # Валидация email
        if supplier.email:
            email_valid = await validate_email(supplier.email)
            supplier.email_validated = email_valid
            
            # Логируем результат
            log = SupplierValidationLog(
                supplier_id=supplier.id,
                validation_type="email",
                status="success" if email_valid else "failed",
                message="Email валиден" if email_valid else "Email невалиден"
            )
            db.add(log)
        
        # Валидация сайта
        if supplier.website:
            website_data = await validate_website(supplier.website)
            supplier.website_validated = website_data["valid"]
            if website_data["whois_data"]:
                supplier.whois_data = website_data["whois_data"]
            
            # Логируем результат
            log = SupplierValidationLog(
                supplier_id=supplier.id,
                validation_type="website",
                status="success" if website_data["valid"] else "failed",
                message="Сайт доступен" if website_data["valid"] else "Сайт недоступен",
                details=website_data["whois_data"]
            )
            db.add(log)
        
        supplier.last_checked = datetime.utcnow()
        await db.commit()
        
    except Exception as e:
        logger.error(f"Ошибка валидации контактов: {e}")


@router.get("/requests", response_model=List[SearchRequestResponse])
async def get_search_requests(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список запросов на поиск"""
    try:
        result = await db.execute(
            select(ArticleSearchRequest)
            .where(ArticleSearchRequest.user_id == current_user.id)
            .order_by(desc(ArticleSearchRequest.created_at))
            .offset(skip)
            .limit(limit)
        )
        requests = result.scalars().all()
        
        return [
            SearchRequestResponse(
                id=req.id,
                request_name=req.request_name,
                articles=req.articles,
                status=req.status,
                total_articles=len(req.articles),
                found_articles=0,  # Пока не реализовано
                total_suppliers=0,  # Пока не реализовано
                created_at=req.created_at,
                completed_at=req.completed_at
            )
            for req in requests
        ]
        
    except Exception as e:
        logger.error(f"Ошибка получения запросов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения запросов")


@router.get("/requests/{request_id}", response_model=SearchRequestResponse)
async def get_search_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить детали запроса на поиск"""
    try:
        result = await db.execute(
            select(ArticleSearchRequest)
            .where(ArticleSearchRequest.id == request_id)
            .where(ArticleSearchRequest.user_id == current_user.id)
            .options(selectinload(ArticleSearchRequest.results))
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(status_code=404, detail="Запрос не найден")
        
        # Формируем результаты по артикулам
        results_by_article = {}
        for result in request.results:
            if result.article_code not in results_by_article:
                results_by_article[result.article_code] = {
                    "article_code": result.article_code,
                    "suppliers": [],
                    "total_suppliers": 0,
                    "confidence_scores": []
                }
            
            # Получаем данные поставщика
            supplier_result = await db.execute(
                select(Supplier).where(Supplier.id == result.supplier_id)
            )
            supplier = supplier_result.scalar_one_or_none()
            
            if supplier:
                results_by_article[result.article_code]["suppliers"].append({
                    "supplier": SupplierResponse.from_orm(supplier),
                    "confidence_score": result.confidence_score,
                    "match_type": result.match_type
                })
                results_by_article[result.article_code]["total_suppliers"] += 1
                results_by_article[result.article_code]["confidence_scores"].append(result.confidence_score)
        
        return SearchRequestResponse(
            id=request.id,
            request_name=request.request_name,
            articles=request.articles,
            status=request.status,
            total_articles=len(request.articles),
            found_articles=0,  # Пока не реализовано
            total_suppliers=0,  # Пока не реализовано
            created_at=request.created_at,
            completed_at=request.completed_at,
            results=list(results_by_article.values())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения запроса: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения запроса")


@router.get("/suppliers/grouped", response_model=List[SupplierGroupResponse])
async def get_suppliers_grouped(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить поставщиков сгруппированных по компаниям"""
    try:
        # Проверяем права доступа к запросу
        result = await db.execute(
            select(ArticleSearchRequest)
            .where(ArticleSearchRequest.id == request_id)
            .where(ArticleSearchRequest.user_id == current_user.id)
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(status_code=404, detail="Запрос не найден")
        
        # Получаем результаты поиска с данными поставщиков и артикулов
        result = await db.execute(
            select(ArticleSearchResult)
            .where(ArticleSearchResult.request_id == request_id)
            .options(
                selectinload(ArticleSearchResult.supplier),
                selectinload(ArticleSearchResult.supplier_article)
            )
        )
        search_results = result.scalars().all()
        
        # Группируем по поставщикам
        suppliers_data = {}
        for search_result in search_results:
            supplier_id = search_result.supplier_id
            if supplier_id not in suppliers_data:
                suppliers_data[supplier_id] = {
                    "supplier": search_result.supplier,
                    "articles": [],
                    "prices": []
                }
            
            suppliers_data[supplier_id]["articles"].append(search_result.supplier_article)
            if search_result.supplier_article.price:
                suppliers_data[supplier_id]["prices"].append(search_result.supplier_article.price)
        
        # Формируем ответ
        grouped_suppliers = []
        for supplier_id, data in suppliers_data.items():
            avg_price = None
            if data["prices"]:
                avg_price = sum(data["prices"]) / len(data["prices"])
            
            grouped_suppliers.append(SupplierGroupResponse(
                supplier=SupplierResponse.from_orm(data["supplier"]),
                articles=[SupplierArticleResponse.from_orm(article) for article in data["articles"]],
                total_articles=len(data["articles"]),
                avg_price=avg_price
            ))
        
        return grouped_suppliers
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения сгруппированных поставщиков: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения поставщиков")


@router.get("/suppliers", response_model=List[SupplierResponse])
async def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список поставщиков"""
    try:
        query = select(Supplier).where(Supplier.is_active == True)
        
        if search:
            query = query.where(
                or_(
                    Supplier.company_name.ilike(f"%{search}%"),
                    Supplier.email.ilike(f"%{search}%"),
                    Supplier.website.ilike(f"%{search}%")
                )
            )
        
        result = await db.execute(
            query.order_by(desc(Supplier.created_at))
            .offset(skip)
            .limit(limit)
        )
        suppliers = result.scalars().all()
        
        return [SupplierResponse.from_orm(supplier) for supplier in suppliers]
        
    except Exception as e:
        logger.error(f"Ошибка получения поставщиков: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения поставщиков")


@router.post("/suppliers/{supplier_id}/validate")
async def validate_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Валидировать контакты поставщика"""
    try:
        result = await db.execute(
            select(Supplier).where(Supplier.id == supplier_id)
        )
        supplier = result.scalar_one_or_none()
        
        if not supplier:
            raise HTTPException(status_code=404, detail="Поставщик не найден")
        
        await validate_supplier_contacts(db, supplier)
        
        return {"message": "Валидация завершена"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка валидации поставщика: {e}")
        raise HTTPException(status_code=500, detail="Ошибка валидации поставщика")
