# 🔧 Исправление ошибки создания ВЭД паспортов

## 🐛 Проблема
При попытке создать ВЭД паспорт через форму на странице `/ved-passports/create/` возникала ошибка:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
Ошибка при создании паспорта: Error: Not Found
```

## 🔍 Причина
В файле `/frontend/app/ved-passports/create/page.tsx` функция `createSinglePassport` использовала несуществующий endpoint:
- **Неправильный URL**: `/api/v1/ved-passports/bulk/` (404 Not Found)
- **Правильный URL**: `/api/v1/ved-passports-upload/add-single-passport`

## ✅ Исправления

### 1. Изменен URL endpoint
```javascript
// Было:
const response = await fetch(`${getApiUrl()}/api/v1/ved-passports/bulk/`, {

// Стало:
const response = await fetch(`${getApiUrl()}/api/v1/ved-passports-upload/add-single-passport`, {
```

### 2. Адаптирована структура данных запроса
```javascript
// Было (для bulk API):
const requestData = {
  order_number: formData.orderNumber,
  title: selectedNomenclature ? `Паспорт ВЭД ${selectedNomenclature.name}` : undefined,
  items: [{
    code_1c: selectedNomenclature?.code_1c || '',
    quantity: formData.quantity === 0 ? 1 : formData.quantity
  }]
}

// Стало (для single passport API):
const requestData = {
  passport_number: `VED-${formData.orderNumber}-${Date.now()}`,
  order_number: formData.orderNumber,
  title: selectedNomenclature ? `Паспорт ВЭД ${selectedNomenclature.name}` : `Паспорт ВЭД ${formData.orderNumber}`,
  description: selectedNomenclature ? `Паспорт для номенклатуры ${selectedNomenclature.name}` : '',
  quantity: formData.quantity === 0 ? 1 : formData.quantity,
  status: 'active',
  nomenclature_id: formData.nomenclatureId
}
```

### 3. Адаптирована обработка ответа
```javascript
// Было (для bulk API):
const passports: CreatedPassport[] = result.passports.map((passport: any) => ({
  id: passport.id,
  passport_number: passport.passport_number,
  // ...
}))

// Стало (для single passport API):
const passport: CreatedPassport = {
  id: result.data.passport_id,
  passport_number: result.data.passport_number,
  order_number: result.data.order_number,
  // ...
}
```

## 🧪 Тестирование
- ✅ Endpoint `/api/v1/ved-passports-upload/add-single-passport` работает корректно
- ✅ Паспорт успешно создается в базе данных
- ✅ Данные сохраняются с правильными полями

## 📝 Результат
Теперь создание ВЭД паспортов через форму работает корректно без ошибок 404.
