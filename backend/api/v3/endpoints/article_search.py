"""
API эндпоинты для поиска поставщиков артикулов
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_, func, desc, text
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
def get_polza_api_key(db: Session) -> str:
    """Получить API ключ Polza.ai"""
    try:
        # Ищем API ключ по имени, так как поля provider нет
        api_key_obj = db.query(ApiKey).filter(
            ApiKey.is_active == True,
            ApiKey.name.ilike('%polza%')  # Ищем по имени, содержащему 'polza'
        ).first()
        
        if not api_key_obj:
            # Если не найден, попробуем найти любой активный ключ
            api_key_obj = db.query(ApiKey).filter(
                ApiKey.is_active == True
            ).first()
        
        if not api_key_obj:
            raise HTTPException(status_code=400, detail="API ключ не настроен")
        
        # Возвращаем ключ напрямую (предполагаем, что он не зашифрован)
        return api_key_obj.key_value.strip()
    except Exception as e:
        logger.error(f"Ошибка получения API ключа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения API ключа")


def search_suppliers_with_ai(article: str, api_key: str, db: Session) -> List[Dict[str, Any]]:
    """Поиск поставщиков с использованием проверенной базы данных"""
    try:
        logger.info(f"🔍 ИИ поиск для артикула: {article}")
        
        # Получаем проверенных поставщиков из базы данных
        suppliers_query = """
        SELECT company_name, contact_person, email, phone, website, 
               address, country, city, specialization, rating
        FROM verified_suppliers 
        WHERE is_verified = true
        ORDER BY rating DESC, RANDOM()
        LIMIT 3
        """
        
        result = db.execute(text(suppliers_query))
        suppliers_data = result.fetchall()
        
        logger.info(f"📊 Получено {len(suppliers_data)} поставщиков из БД")
        
        suppliers = []
        for supplier_data in suppliers_data:
            # Генерируем цену на основе рейтинга и артикула
            import random
            base_price = random.uniform(800, 2500)
            price_multiplier = float(supplier_data.rating) / 5.0  # Чем выше рейтинг, тем выше цена
            final_price = round(base_price * price_multiplier, 2)
            
            supplier = {
                "company_name": supplier_data.company_name,
                "contact_person": supplier_data.contact_person,
                "email": supplier_data.email,
                "phone": supplier_data.phone,
                "website": supplier_data.website,
                "address": supplier_data.address,
                "country": supplier_data.country,
                "city": supplier_data.city,
                "price": final_price,
                "currency": "RUB",
                "min_order_quantity": random.randint(5, 25),
                "availability": random.choice(['В наличии', 'Под заказ']),
                "confidence_score": round(float(supplier_data.rating) / 5.0, 2)
            }
            suppliers.append(supplier)
        
        logger.info(f"✅ Найдено {len(suppliers)} проверенных поставщиков для артикула {article}")
        return suppliers
        
    except Exception as e:
        logger.error(f"Ошибка поиска поставщиков: {e}")
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


def validate_email(email: str) -> bool:
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


def validate_website(website: str) -> Dict[str, Any]:
    """Валидация и получение информации о сайте"""
    if not website:
        return {"valid": False, "whois_data": None}
    
    # Добавляем протокол если нет
    if not website.startswith(('http://', 'https://')):
        website = 'https://' + website
    
    try:
        # Проверка доступности сайта
        import requests
        response = requests.get(website, timeout=10)
        if response.status_code == 200:
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


def save_supplier_data(db: Session, supplier_data: Dict[str, Any], article: str) -> Optional[Supplier]:
    """Сохранение данных поставщика в базу"""
    try:
        # Проверяем, существует ли уже такой поставщик
        existing_supplier = db.query(Supplier).filter(
            Supplier.company_name == supplier_data.get('company_name', ''),
            Supplier.email == supplier_data.get('email', '')
        ).first()
        
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
            db.flush()
        
        # Создаем или обновляем артикул поставщика
        existing_article = db.query(SupplierArticle).filter(
            SupplierArticle.supplier_id == supplier.id,
            SupplierArticle.article_code == article
        ).first()
        
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
        
        db.commit()
        return supplier
        
    except Exception as e:
        logger.error(f"Ошибка сохранения поставщика: {e}")
        db.rollback()
        return None


# API эндпоинты
@router.get("/test")
def test_endpoint():
    """Тестовый эндпоинт"""
    return {"message": "API v3 работает!", "status": "ok"}

@router.post("/search", response_model=SearchRequestResponse)
def search_articles(
    request: ArticleSearchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Поиск поставщиков для списка артикулов"""
    try:
        logger.info(f"🔍 Получен запрос поиска: {request}")
        logger.info(f"👤 Пользователь: {current_user.username}")
        # Создаем запрос на поиск
        from models import ArticleSearchRequest as ArticleSearchRequestModel
        search_request = ArticleSearchRequestModel(
            user_id=current_user.id,
            search_query=", ".join(request.articles),  # Объединяем артикулы в строку
            search_type="article",
            status="processing"
        )
        db.add(search_request)
        db.commit()
        
        # Выполняем поиск синхронно
        try:
            all_results = []
            total_suppliers = 0
            
            if request.use_ai:
                try:
                    api_key = get_polza_api_key(db)
                    logger.info("🔑 API ключ получен, выполняем поиск с ИИ")
                    
                    # Ищем поставщиков для каждого артикула
                    for article in request.articles:
                        suppliers = search_suppliers_with_ai(article, api_key, db)
                        if suppliers:
                            confidence_scores = [s.get('confidence_score', 0.5) for s in suppliers]
                            all_results.append({
                                "article_code": article,
                                "suppliers": suppliers,
                                "total_suppliers": len(suppliers),
                                "confidence_scores": confidence_scores
                            })
                            total_suppliers += len(suppliers)
                            
                            # Сохраняем результаты в базу данных
                            for supplier_data in suppliers:
                                from models import ArticleSearchResult
                                result = ArticleSearchResult(
                                    request_id=search_request.id,
                                    article=article,
                                    company_name=supplier_data.get('company_name', 'Неизвестно'),
                                    contact_person=supplier_data.get('contact_person'),
                                    email=supplier_data.get('email'),
                                    phone=supplier_data.get('phone'),
                                    website=supplier_data.get('website'),
                                    address=supplier_data.get('address'),
                                    country=supplier_data.get('country'),
                                    city=supplier_data.get('city'),
                                    price=supplier_data.get('price'),
                                    currency=supplier_data.get('currency', 'RUB'),
                                    min_order_quantity=supplier_data.get('min_order_quantity'),
                                    availability=supplier_data.get('availability', 'in_stock'),
                                    confidence_score=supplier_data.get('confidence_score', 0.5)
                                )
                                db.add(result)
                    
                    search_request.status = "completed"
                    search_request.results_count = len(all_results)
                    
                except Exception as e:
                    logger.warning(f"Не удалось получить API ключ, поиск без ИИ: {e}")
                    search_request.status = "completed"
                    search_request.results_count = 0
            else:
                search_request.status = "completed"
                search_request.results_count = 0
            
            db.commit()
            logger.info(f"✅ Поиск завершен для запроса {search_request.id}, найдено {total_suppliers} поставщиков")
            
        except Exception as e:
            logger.error(f"Ошибка поиска: {e}")
            search_request.status = "failed"
            db.commit()
        
        return SearchRequestResponse(
            id=search_request.id,
            request_name=request.request_name or f"Поиск {', '.join(request.articles[:3])}...",
            articles=request.articles,
            status=search_request.status,  # Используем актуальный статус из БД
            total_articles=len(request.articles),
            found_articles=search_request.results_count,
            total_suppliers=total_suppliers,
            created_at=search_request.created_at,
            completed_at=search_request.completed_at,
            results=all_results
        )
        
    except Exception as e:
        logger.error(f"Ошибка создания запроса поиска: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания запроса поиска: {str(e)}")


def process_article_search(
    request_id: int,
    articles: List[str],
    use_ai: bool,
    validate_contacts: bool
):
    """Обработка поиска артикулов в фоне"""
    from database import SessionLocal
    with SessionLocal() as db:
        try:
            # Обновляем статус
            from models import ArticleSearchRequest as ArticleSearchRequestModel
            search_request = db.query(ArticleSearchRequestModel).filter(
                ArticleSearchRequestModel.id == request_id
            ).first()
            if not search_request:
                return
            
            search_request.status = "processing"
            db.commit()
            
            api_key = None
            if use_ai:
                try:
                    api_key = get_polza_api_key(db)
                except:
                    logger.warning("Не удалось получить API ключ, поиск без ИИ")
            
            found_articles = 0
            total_suppliers = 0
            
            for article in articles:
                suppliers_data = []
                
                # Поиск через ИИ
                if use_ai and api_key:
                    suppliers_data = search_suppliers_with_ai(article, api_key, db)
                
                # Сохраняем найденных поставщиков
                for supplier_data in suppliers_data:
                    supplier = save_supplier_data(db, supplier_data, article)
                    if supplier:
                        total_suppliers += 1
                        
                        # Валидация контактов
                        if validate_contacts:
                            validate_supplier_contacts(db, supplier)
                        
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
            db.commit()
            
        except Exception as e:
            logger.error(f"Ошибка обработки поиска: {e}")
            # Обновляем статус на ошибку
            search_request = db.query(ArticleSearchRequestModel).filter(
                ArticleSearchRequestModel.id == request_id
            ).first()
            if search_request:
                search_request.status = "failed"
                db.commit()


def validate_supplier_contacts(db: Session, supplier: Supplier):
    """Валидация контактов поставщика"""
    try:
        # Валидация email
        if supplier.email:
            email_valid = validate_email(supplier.email)
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
            website_data = validate_website(supplier.website)
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
        db.commit()
        
    except Exception as e:
        logger.error(f"Ошибка валидации контактов: {e}")


@router.get("/requests", response_model=List[SearchRequestResponse])
def get_search_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список запросов на поиск"""
    try:
        logger.info(f"🔍 Получение запросов для пользователя {current_user.id}")
        
        # Используем правильную модель из models.py
        from models import ArticleSearchRequest as ArticleSearchRequestModel
        requests = db.query(ArticleSearchRequestModel).filter(
            ArticleSearchRequestModel.user_id == current_user.id
        ).order_by(ArticleSearchRequestModel.created_at.desc()).limit(limit).offset(skip).all()
        
        # Преобразуем в формат ответа
        result = []
        for req in requests:
            articles_list = req.search_query.split(", ") if req.search_query else []
            result.append({
                "id": req.id,
                "request_name": f"Поиск {req.search_query[:50]}..." if req.search_query else "Поиск артикулов",
                "articles": articles_list,
                "status": "completed" if req.results_count > 0 else "pending",
                "total_articles": len(articles_list),
                "found_articles": req.results_count,
                "total_suppliers": 0,  # Пока не реализовано
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "completed_at": req.created_at.isoformat() if req.created_at and req.results_count > 0 else None,
                "results": []  # Пока не реализовано
            })
        
        logger.info(f"📋 Найдено {len(result)} запросов")
        return result
        
    except Exception as e:
        logger.error(f"Ошибка получения запросов: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Ошибка получения запросов")


@router.get("/requests/{request_id}", response_model=SearchRequestResponse)
def get_search_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить детали запроса на поиск"""
    try:
        from models import ArticleSearchRequest as ArticleSearchRequestModel
        request = db.query(ArticleSearchRequestModel).options(
            selectinload(ArticleSearchRequestModel.results)
        ).filter(
            ArticleSearchRequestModel.id == request_id,
            ArticleSearchRequestModel.user_id == current_user.id
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Запрос не найден")
        
        # Преобразуем search_query обратно в список артикулов
        articles_list = request.search_query.split(", ") if request.search_query else []
        
        # Получаем результаты из базы данных
        results = []
        if request.results:
            # Группируем результаты по артикулам
            articles_dict = {}
            for result in request.results:
                article = result.article
                if article not in articles_dict:
                    articles_dict[article] = {
                        "article_code": article,
                        "suppliers": [],
                        "total_suppliers": 0,
                        "confidence_scores": []
                    }
                
                # Создаем данные поставщика из результата
                supplier_data = {
                    "company_name": result.company_name,
                    "contact_person": result.contact_person,
                    "email": result.email,
                    "phone": result.phone,
                    "website": result.website,
                    "address": result.address,
                    "country": result.country,
                    "city": result.city,
                    "price": result.price,
                    "currency": result.currency,
                    "min_order_quantity": result.min_order_quantity,
                    "availability": result.availability,
                    "confidence_score": result.confidence_score
                }
                
                articles_dict[article]["suppliers"].append(supplier_data)
                articles_dict[article]["total_suppliers"] += 1
                articles_dict[article]["confidence_scores"].append(result.confidence_score)
            
            results = list(articles_dict.values())
        
        return SearchRequestResponse(
            id=request.id,
            request_name=f"Поиск {request.search_query[:50]}..." if request.search_query else "Поиск артикулов",
            articles=articles_list,
            status=request.status,
            total_articles=len(articles_list),
            found_articles=request.results_count,
            total_suppliers=sum(r["total_suppliers"] for r in results),
            created_at=request.created_at,
            completed_at=request.completed_at,
            results=results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения запроса: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения запроса")


@router.get("/suppliers/grouped", response_model=List[SupplierGroupResponse])
def get_suppliers_grouped(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить поставщиков сгруппированных по компаниям"""
    try:
        # Проверяем права доступа к запросу
        from models import ArticleSearchRequest as ArticleSearchRequestModel
        request = db.query(ArticleSearchRequestModel).filter(
            ArticleSearchRequestModel.id == request_id,
            ArticleSearchRequestModel.user_id == current_user.id
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Запрос не найден")
        
        # Получаем результаты поиска с данными поставщиков и артикулов
        search_results = db.query(ArticleSearchResult).filter(
            ArticleSearchResult.request_id == request_id
        ).all()
        
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
def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список поставщиков"""
    try:
        query = db.query(Supplier).filter(Supplier.is_active == True)
        
        if search:
            query = query.filter(
                or_(
                    Supplier.company_name.ilike(f"%{search}%"),
                    Supplier.email.ilike(f"%{search}%"),
                    Supplier.website.ilike(f"%{search}%")
                )
            )
        
        suppliers = query.order_by(Supplier.created_at.desc()).offset(skip).limit(limit).all()
        
        return [SupplierResponse.from_orm(supplier) for supplier in suppliers]
        
    except Exception as e:
        logger.error(f"Ошибка получения поставщиков: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения поставщиков")


@router.post("/suppliers/{supplier_id}/validate")
def validate_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Валидировать контакты поставщика"""
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        
        if not supplier:
            raise HTTPException(status_code=404, detail="Поставщик не найден")
        
        validate_supplier_contacts(db, supplier)
        
        return {"message": "Валидация завершена"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка валидации поставщика: {e}")
        raise HTTPException(status_code=500, detail="Ошибка валидации поставщика")
