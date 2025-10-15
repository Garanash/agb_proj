"""
Клиент для работы с Polza.ai API для поиска поставщиков через Perplexity/Sonar Deep Research
"""

import httpx
import asyncio
import logging
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class SupplierInfo:
    """Информация о поставщике"""
    company_name: str
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    confidence_score: float = 0.0
    verification_status: str = "unverified"

class PolzaAIClient:
    """Клиент для работы с Polza.ai API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.polza.ai"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def search_suppliers_global(self, article_codes: List[str]) -> Dict[str, List[SupplierInfo]]:
        """
        Поиск поставщиков по артикулам по всему миру через Perplexity/Sonar Deep Research
        
        Args:
            article_codes: Список артикулов для поиска
            
        Returns:
            Словарь с артикулами и найденными поставщиками
        """
        results = {}
        
        for article_code in article_codes:
            try:
                logger.info(f"🔍 Поиск поставщиков для артикула: {article_code}")
                
                # Формируем запрос для глубокого поиска
                search_query = self._build_search_query(article_code)
                
                # Выполняем поиск через Perplexity/Sonar Deep Research
                suppliers = await self._perform_deep_search(search_query, article_code)
                
                # Фильтруем только существующих поставщиков
                verified_suppliers = await self._verify_suppliers(suppliers)
                
                results[article_code] = verified_suppliers
                
                logger.info(f"✅ Найдено {len(verified_suppliers)} поставщиков для артикула {article_code}")
                
            except Exception as e:
                logger.error(f"❌ Ошибка поиска для артикула {article_code}: {e}")
                results[article_code] = []
        
        return results
    
    def _build_search_query(self, article_code: str) -> str:
        """Формирует запрос для глубокого поиска поставщиков"""
        return f"""
        Найди реально существующих поставщиков и производителей для артикула/товара: {article_code}
        
        Требования:
        1. Только реально существующие компании с верифицированными данными
        2. Поиск по всему миру (Россия, Китай, Европа, США, Азия)
        3. Включи официальные сайты, контактную информацию
        4. Проверь актуальность данных
        5. Если компания не существует или данные недостоверны - НЕ включай в результат
        
        Формат ответа:
        - Название компании
        - Официальный сайт
        - Email для связи
        - Телефон
        - Адрес (страна, город)
        - Краткое описание деятельности
        - Уровень уверенности в достоверности (0-100%)
        """
    
    async def _perform_deep_search(self, query: str, article_code: str) -> List[SupplierInfo]:
        """Выполняет глубокий поиск через Perplexity/Sonar Deep Research"""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Используем Perplexity API для глубокого поиска
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "sonar-deep-research",
                        "messages": [
                            {
                                "role": "system",
                                "content": "Ты эксперт по поиску поставщиков. Найди только реально существующих поставщиков с верифицированными данными. Если поставщик не существует или данные недостоверны - НЕ включай его в результат."
                            },
                            {
                                "role": "user",
                                "content": query
                            }
                        ],
                        "max_tokens": 4000,
                        "temperature": 0.1
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # Парсим результаты
                    suppliers = self._parse_search_results(content, article_code)
                    return suppliers
                else:
                    logger.error(f"Ошибка API Perplexity: {response.status_code} - {response.text}")
                    return []
                    
        except Exception as e:
            logger.error(f"Ошибка выполнения поиска: {e}")
            return []
    
    def _parse_search_results(self, content: str, article_code: str) -> List[SupplierInfo]:
        """Парсит результаты поиска и извлекает информацию о поставщиках"""
        suppliers = []
        
        try:
            # Разбиваем контент на блоки по компаниям
            lines = content.split('\n')
            current_supplier = {}
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Определяем начало новой компании
                if any(keyword in line.lower() for keyword in ['компания:', 'название:', 'company:', 'supplier:']):
                    if current_supplier:
                        supplier = self._create_supplier_from_data(current_supplier, article_code)
                        if supplier:
                            suppliers.append(supplier)
                    current_supplier = {}
                
                # Извлекаем данные
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower()
                    value = value.strip()
                    
                    if 'название' in key or 'компания' in key or 'company' in key:
                        current_supplier['company_name'] = value
                    elif 'сайт' in key or 'website' in key or 'url' in key:
                        current_supplier['website'] = value
                    elif 'email' in key or 'почта' in key:
                        current_supplier['email'] = value
                    elif 'телефон' in key or 'phone' in key:
                        current_supplier['phone'] = value
                    elif 'адрес' in key or 'address' in key:
                        current_supplier['address'] = value
                    elif 'страна' in key or 'country' in key:
                        current_supplier['country'] = value
                    elif 'город' in key or 'city' in key:
                        current_supplier['city'] = value
                    elif 'описание' in key or 'description' in key:
                        current_supplier['description'] = value
                    elif 'уверенность' in key or 'confidence' in key or '%' in value:
                        try:
                            confidence = float(value.replace('%', '').strip())
                            current_supplier['confidence_score'] = confidence
                        except:
                            pass
            
            # Добавляем последнего поставщика
            if current_supplier:
                supplier = self._create_supplier_from_data(current_supplier, article_code)
                if supplier:
                    suppliers.append(supplier)
        
        except Exception as e:
            logger.error(f"Ошибка парсинга результатов: {e}")
        
        return suppliers
    
    def _create_supplier_from_data(self, data: Dict[str, Any], article_code: str) -> Optional[SupplierInfo]:
        """Создает объект SupplierInfo из извлеченных данных"""
        try:
            company_name = data.get('company_name', '').strip()
            if not company_name:
                return None
            
            # Проверяем базовые требования
            if len(company_name) < 2:
                return None
            
            # Очищаем и валидируем данные
            website = self._clean_website(data.get('website', ''))
            email = self._clean_email(data.get('email', ''))
            phone = self._clean_phone(data.get('phone', ''))
            
            # Определяем страну и город
            country, city = self._parse_location(data.get('address', ''), data.get('country', ''), data.get('city', ''))
            
            # Рассчитываем уверенность
            confidence_score = self._calculate_confidence(data)
            
            return SupplierInfo(
                company_name=company_name,
                website=website,
                email=email,
                phone=phone,
                address=data.get('address', ''),
                country=country,
                city=city,
                description=data.get('description', ''),
                confidence_score=confidence_score,
                verification_status="verified" if confidence_score > 70 else "unverified"
            )
            
        except Exception as e:
            logger.error(f"Ошибка создания поставщика: {e}")
            return None
    
    def _clean_website(self, website: str) -> Optional[str]:
        """Очищает и валидирует веб-сайт"""
        if not website:
            return None
        
        website = website.strip()
        if not website.startswith(('http://', 'https://')):
            website = 'https://' + website
        
        # Простая валидация URL
        if '.' in website and len(website) > 10:
            return website
        return None
    
    def _clean_email(self, email: str) -> Optional[str]:
        """Очищает и валидирует email"""
        if not email:
            return None
        
        email = email.strip()
        if '@' in email and '.' in email and len(email) > 5:
            return email
        return None
    
    def _clean_phone(self, phone: str) -> Optional[str]:
        """Очищает и валидирует телефон"""
        if not phone:
            return None
        
        phone = phone.strip()
        # Удаляем все кроме цифр и +, -, (, ), пробелов
        clean_phone = ''.join(c for c in phone if c.isdigit() or c in '+-() ')
        if len(clean_phone) >= 7:
            return clean_phone
        return None
    
    def _parse_location(self, address: str, country: str, city: str) -> Tuple[Optional[str], Optional[str]]:
        """Парсит адрес и извлекает страну и город"""
        country = country.strip() if country else ''
        city = city.strip() if city else ''
        
        # Если страна и город не указаны, пытаемся извлечь из адреса
        if not country and not city and address:
            parts = address.split(',')
            if len(parts) >= 2:
                city = parts[-2].strip()
                country = parts[-1].strip()
        
        return country if country else None, city if city else None
    
    def _calculate_confidence(self, data: Dict[str, Any]) -> float:
        """Рассчитывает уровень уверенности в достоверности данных"""
        confidence = 0.0
        
        # Базовые поля
        if data.get('company_name'):
            confidence += 20
        if data.get('website'):
            confidence += 25
        if data.get('email'):
            confidence += 20
        if data.get('phone'):
            confidence += 15
        if data.get('address'):
            confidence += 10
        if data.get('description'):
            confidence += 10
        
        # Дополнительные бонусы
        if data.get('confidence_score'):
            try:
                ai_confidence = float(str(data['confidence_score']).replace('%', ''))
                confidence += ai_confidence * 0.3  # 30% от AI уверенности
            except:
                pass
        
        return min(confidence, 100.0)
    
    async def _verify_suppliers(self, suppliers: List[SupplierInfo]) -> List[SupplierInfo]:
        """Дополнительная верификация поставщиков"""
        verified_suppliers = []
        
        for supplier in suppliers:
            # Проверяем минимальные требования
            if (supplier.company_name and 
                len(supplier.company_name) > 2 and
                supplier.confidence_score > 30):
                
                # Дополнительная проверка на реальность
                if await self._is_supplier_real(supplier):
                    verified_suppliers.append(supplier)
                else:
                    logger.info(f"Поставщик {supplier.company_name} не прошел верификацию")
        
        return verified_suppliers
    
    async def _is_supplier_real(self, supplier: SupplierInfo) -> bool:
        """Проверяет, является ли поставщик реальным"""
        try:
            # Проверяем веб-сайт если есть
            if supplier.website:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    try:
                        response = await client.head(supplier.website)
                        if response.status_code == 200:
                            return True
                    except:
                        pass
            
            # Если есть контактная информация, считаем реальным
            if supplier.email or supplier.phone:
                return True
            
            # Если только название, но высокая уверенность
            if supplier.confidence_score > 80:
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Ошибка верификации поставщика {supplier.company_name}: {e}")
            return False
