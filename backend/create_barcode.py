import barcode
from barcode.writer import ImageWriter

def create_barcode():
    """Создает штрихкод в формате Code128"""
    # Создаем штрихкод Code128 (поддерживает буквы и цифры)
    code = barcode.Code128('AGB3501040', writer=ImageWriter())
    
    # Сохраняем штрихкод как PNG
    code.save('barcode', options={
        'module_width': 0.2,  # Ширина линий
        'module_height': 8,   # Высота линий
        'quiet_zone': 3,      # Отступы по бокам
        'font_size': 7,       # Размер шрифта
        'text_distance': 1,   # Расстояние от штрихкода до текста
    })

if __name__ == '__main__':
    create_barcode()
