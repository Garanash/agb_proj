import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from cairosvg import svg2png
from reportlab.lib.utils import ImageReader


def create_logo_image():
    """Создает изображение логотипа из PNG файла"""
    try:
        # Используем готовый PNG файл
        return 'logo.png'
    except Exception as e:
        print(f"Ошибка при загрузке логотипа: {e}")
        return None


def setup_cyrillic_fonts():
    """Настраивает шрифты с поддержкой кириллицы"""
    try:
        # Пробуем разные пути к шрифтам
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/TTF/DejaVuSans.ttf',
            '/usr/share/fonts/dejavu/DejaVuSans.ttf',
            '/System/Library/Fonts/Arial.ttf',  # macOS
            '/Windows/Fonts/arial.ttf',  # Windows
        ]
        
        normal_font = 'Helvetica'
        for path in font_paths:
            try:
                pdfmetrics.registerFont(TTFont('DejaVuSans', path))
                normal_font = 'DejaVuSans'
                break
            except:
                continue

        # Если DejaVu не найден, попробуем другие шрифты
        if normal_font == 'Helvetica':
            try:
                pdfmetrics.registerFont(TTFont('ArialUnicode', '/usr/share/fonts/truetype/msttcorefonts/Arial_Unicode_MS.ttf'))
                normal_font = 'ArialUnicode'
            except:
                pass
    except:
        normal_font = 'Helvetica'
    
    return normal_font


def create_passport_styles(normal_font):
    """Создает стили для PDF паспорта"""
    styles = getSampleStyleSheet()
    
    # Стили для заголовков и текста с корректной кодировкой
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=20,
        alignment=1,  # Центрирование
        fontName=normal_font,
        encoding='utf-8'
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=15,
        fontName=normal_font,
        encoding='utf-8'
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontName=normal_font,
        fontSize=10,
        encoding='utf-8'
    )
    
    return title_style, subtitle_style, normal_style


def create_passport_pdf_content(passport, normal_font, title_style, subtitle_style, normal_style):
    """Создает содержимое PDF паспорта в новом формате согласно образцу"""
    story = []

    # Создаем контактную информацию в одну строку
    contact_info = """ООО "Алмазгеобур" 125362, г. Москва, улица Водников, дом 2, стр. 14, оф. 11, тел.:+7 495 229 82 94
LLP "Almazgeobur" 125362, Moscow, Vodnikov Street, 2, building. 14, of. 11, tel.:+7 495 229 82 94,
e-mail: contact@almazgeobur.ru                                                                                                                                  almazgeobur.ru"""

    # Создаем внешнюю таблицу для общей рамки
    outer_data = [[None]]  # Будет заполнено позже
    outer_table = Table(outer_data, colWidths=[190*mm])
    outer_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))

    # Создаем внутреннюю таблицу с логотипом и контактными данными
    header_data = [[None, contact_info]]

    # Создаем заголовочную таблицу
    header_table = Table(header_data, colWidths=[45*mm, 143*mm])
    header_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), normal_font),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ENCODING', (0, 0), (-1, -1), 'utf-8'),
    ]))

    # Добавляем логотип
    logo_img = create_logo_image()
    if logo_img:
        logo_cell = Image(logo_img, width=40*mm, height=12*mm)
        header_data[0][0] = logo_cell
        header_table = Table(header_data, colWidths=[45*mm, 143*mm])
        header_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), normal_font),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ENCODING', (0, 0), (-1, -1), 'utf-8'),
        ]))

    story.append(header_table)
    story.append(Spacer(1, 15))

    # Основная таблица с данными паспорта (как на картинке)
    # Генерируем случайный штрихкод
    barcode = f"AGB{passport.nomenclature.article or '3501040'}-{passport.passport_number or '0000125'}"

    # Создаем стиль для переноса текста
    wrapped_style = ParagraphStyle(
        'WrappedText',
        parent=normal_style,
        fontSize=8,
        leading=10,  # Межстрочный интервал
        spaceBefore=0,
        spaceAfter=0,
    )

    # Создаем параграф с названием номенклатуры для автоматического переноса
    tool_type = Paragraph(passport.nomenclature.name or "Алмазная буровая коронка ALFA 3-5", wrapped_style)

    passport_data = [
        ["Артикул / Stock Code", "Типоразмер / Tool size", "Серийный номер / Serial Number"],
        [passport.nomenclature.article or "3501040", passport.nomenclature.matrix or "NQ", passport.passport_number or "AGB 3-5 NQ 0000125"],
        ["Матрица / Matrix", "Высота матрицы / Imp Depth", "Промывочные отверстия / Waterways", "Буровой инструмент / Tool type"],
        [passport.nomenclature.matrix or "3-5", passport.nomenclature.height or "12 mm", "8 mm", tool_type],
        ["2025", barcode, "", ""]
    ]

    # Создаем основную таблицу
    table = Table(passport_data, colWidths=[45*mm, 45*mm, 55*mm, 43*mm])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), normal_font),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('BACKGROUND', (0, 2), (-1, 2), colors.lightgrey),
        ('SPAN', (3, 2), (3, 3)),  # Объединяем ячейку для "Буровой инструмент"
        ('SPAN', (1, 4), (3, 4)),  # Объединяем ячейку для штрихкода
        ('ALIGN', (1, 4), (3, 4), 'CENTER'),  # Центрируем штрихкод
        ('ENCODING', (0, 0), (-1, -1), 'utf-8'),
    ]))

    # Создаем внутреннюю таблицу с отступами
    inner_table = Table([[header_table], [Spacer(1, 8)], [table]], colWidths=[188*mm])
    inner_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 1),
        ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))

    # Обновляем внешнюю таблицу
    outer_data = [[inner_table]]
    outer_table = Table(outer_data, colWidths=[190*mm])
    outer_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('LEFTPADDING', (0, 0), (-1, -1), 1),
        ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))

    story.append(outer_table)

    return story


def generate_passport_pdf(passport):
    """Генерирует PDF паспорта с правильной кодировкой и новым макетом"""
    # Используем ту же функцию, что и для массового экспорта, но с одним паспортом
    return generate_bulk_passports_pdf([passport])


def generate_bulk_passports_pdf(passports):
    """Генерирует PDF с несколькими паспортами (по 3 на страницу)"""
    # Создаем PDF в памяти
    buffer = io.BytesIO()
    
    # Устанавливаем отступы страницы
    page_width, page_height = A4
    margin = 20  # уменьшаем отступы для более компактного размещения
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )
    
    # Настраиваем шрифты
    normal_font = setup_cyrillic_fonts()
    
    # Создаем стили для массового экспорта
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=10,
        spaceAfter=8,
        alignment=1,
        fontName=normal_font,
        encoding='utf-8'
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=7,
        fontName=normal_font,
        encoding='utf-8'
    )

    # Создаем стиль для переноса текста
    wrapped_style = ParagraphStyle(
        'WrappedText',
        parent=normal_style,
        fontSize=8,
        leading=10,  # Межстрочный интервал
        spaceBefore=0,
        spaceAfter=0,
    )
    
    story = []

    # Группируем паспорта по 3 на страницу
    for i in range(0, len(passports), 3):
        passport_group = passports[i:i+3]

        for j, passport in enumerate(passport_group):
            # Создаем контактную информацию с правильным переносом
            contact_info = """ООО "Алмазгеобур" 125362, г. Москва, улица Водников, дом 2, стр. 14, оф. 11, \nтел.:+7 495 229 82 94
LLP "Almazgeobur" 125362, Moscow, Vodnikov Street, 2, building. 14, of. 11, \ntel.:+7 495 229 82 94
e-mail: contact@almazgeobur.ru                                                                                almazgeobur.ru"""

            # Создаем таблицу с логотипом и контактными данными
            header_data = [[None, contact_info]]

            # Добавляем логотип
            logo = create_logo_image()
            if logo:
                logo_cell = Image(logo, width=40*mm, height=12*mm)
                header_data[0][0] = logo_cell

            # Создаем заголовочную таблицу
            header_table = Table(header_data, colWidths=[45*mm, page_width - 2*margin - 47*mm])
            header_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), normal_font),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ENCODING', (0, 0), (-1, -1), 'utf-8'),
            ]))

            # Создаем параграф с названием номенклатуры для автоматического переноса
            tool_type = Paragraph("Алмазная буровая коронка / Diamond drill bit", wrapped_style)

            # Создаем стили для заголовков
            header_style = ParagraphStyle(
                'HeaderStyle',
                parent=normal_style,
                fontSize=8,
                leading=10,
                spaceBefore=0,
                spaceAfter=0,
                alignment=0,
            )

            # Создаем параграфы для двухстрочных заголовков
            headers = [
                Paragraph("Артикул / Stock Code", header_style),
                Paragraph("Типоразмер / Tool size", header_style),
                Paragraph("Серийный номер / Serial Number", header_style),
                ""  # Пустая ячейка для tool type
            ]

            sub_headers = [
                Paragraph("Матрица / Matrix", header_style),
                Paragraph("Высота матрицы / Imp Depth", header_style),
                Paragraph("Промывочные отверстия / Waterways", header_style),
                Paragraph("Буровой инструмент / Tool type", header_style)
            ]

            # Основная таблица с данными паспорта
            passport_data = [
                headers,
                [passport.nomenclature.article or "3501040", 
                 passport.nomenclature.matrix or "NQ", 
                 passport.passport_number or "AGB 3-5 NQ 0000125",
                 ""],  # Пустая ячейка для tool type
                sub_headers,
                [passport.nomenclature.matrix or "3-5", 
                 passport.nomenclature.height or "12 mm", 
                 "8 mm",
                 tool_type],  # Tool type перемещен вниз
                ["", "", "", "2025"]  # Дата производства перенесена вправо
            ]
            
            # Добавляем заголовок для даты производства
            date_header = Paragraph("Дата производства / Production date", header_style)
            passport_data.append([date_header, "", "", ""])

            # Создаем основную таблицу
            table = Table(passport_data, colWidths=[45*mm, 45*mm, 55*mm, page_width - 2*margin - 147*mm])
            table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), normal_font),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('BACKGROUND', (0, 2), (-1, 2), colors.lightgrey),
                ('SPAN', (3, 3), (3, 4)),  # Объединяем ячейку для tool type
                ('SPAN', (1, 4), (3, 4)),  # Объединяем последнюю строку
                ('ALIGN', (1, 4), (3, 4), 'CENTER'),
                ('ENCODING', (0, 0), (-1, -1), 'utf-8'),
            ]))

            # Создаем внутреннюю таблицу с отступами
            inner_table = Table([[header_table], [Spacer(1, 5)], [table]], colWidths=[page_width - 2*margin - 2])
            inner_table.setStyle(TableStyle([
                ('LEFTPADDING', (0, 0), (-1, -1), 1),
                ('RIGHTPADDING', (0, 0), (-1, -1), 1),
                ('TOPPADDING', (0, 0), (-1, -1), 1),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ]))

            # Создаем внешнюю таблицу с рамкой
            outer_data = [[inner_table]]
            outer_table = Table(outer_data, colWidths=[page_width - 2*margin])
            outer_table.setStyle(TableStyle([
                ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
                ('LEFTPADDING', (0, 0), (-1, -1), 1),
                ('RIGHTPADDING', (0, 0), (-1, -1), 1),
                ('TOPPADDING', (0, 0), (-1, -1), 1),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ]))

            story.append(outer_table)

            # Добавляем точно рассчитанный интервал между паспортами
            if j < len(passport_group) - 1:
                # Высота A4 = 297mm
                # Отступы сверху и снизу = 20mm * 2 = 40mm
                # Доступная высота = 297mm - 40mm = 257mm
                # Высота одного паспорта ~80mm
                # Общая высота паспортов = 80mm * 3 = 240mm
                # Оставшееся пространство = 257mm - 240mm = 17mm
                # Делим на 2 интервала = 8.5mm каждый
                story.append(Spacer(1, 8.5*mm))

        # Добавляем переход на новую страницу после каждой группы из 3 паспортов
        if i + 3 < len(passports):
            story.append(PageBreak())

    # Генерируем PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer.getvalue()
