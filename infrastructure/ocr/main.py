from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import io
import os

app = FastAPI(title="OCR Service", version="1.0.0")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ocr/")
async def extract_text_from_image(file: UploadFile = File(...)):
    """Извлечь текст из изображения с помощью OCR"""
    try:
        # Проверяем тип файла
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Файл должен быть изображением")
        
        # Читаем содержимое файла
        contents = await file.read()
        
        # Открываем изображение
        image = Image.open(io.BytesIO(contents))
        
        # Извлекаем текст с помощью Tesseract
        text = pytesseract.image_to_string(image, lang='rus+eng')
        
        return {
            "success": True,
            "text": text.strip(),
            "filename": file.filename,
            "file_size": len(contents)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка OCR обработки: {str(e)}")

@app.get("/health")
async def health_check():
    """Проверка здоровья сервиса"""
    return {
        "status": "healthy",
        "service": "OCR Service",
        "tesseract_version": pytesseract.get_tesseract_version()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
