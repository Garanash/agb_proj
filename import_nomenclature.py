#!/usr/bin/env python3
import requests
import json

# Данные номенклатуры для импорта
nomenclature_data = [
    {
        "code_1c": "УТ-00047870",
        "name": "Коронка импрегнированная",
        "article": "3501040",
        "matrix": "NQ",
        "drilling_depth": "03-05",
        "height": "12 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047871",
        "name": "Коронка импрегнированная",
        "article": "3501041",
        "matrix": "NQ",
        "drilling_depth": "05-07",
        "height": "12 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047872",
        "name": "Коронка импрегнированная",
        "article": "3501042",
        "matrix": "NQ",
        "drilling_depth": "07-09",
        "height": "13 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047873",
        "name": "Коронка импрегнированная",
        "article": "3501043",
        "matrix": "NQ",
        "drilling_depth": "09-12",
        "height": "14 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047874",
        "name": "Коронка импрегнированная",
        "article": "3501044",
        "matrix": "HQ",
        "drilling_depth": "11-13",
        "height": "15 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047875",
        "name": "Коронка импрегнированная",
        "article": "3501045",
        "matrix": "HQ",
        "drilling_depth": "03-05",
        "height": "16 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047876",
        "name": "Коронка импрегнированная",
        "article": "3501046",
        "matrix": "HQ",
        "drilling_depth": "05-07",
        "height": "17 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047877",
        "name": "Коронка импрегнированная",
        "article": "3501047",
        "matrix": "HQ",
        "drilling_depth": "07-09",
        "height": "18 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047878",
        "name": "Коронка импрегнированная",
        "article": "3501048",
        "matrix": "HQ",
        "drilling_depth": "09-12",
        "height": "19 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047879",
        "name": "Коронка импрегнированная",
        "article": "3501049",
        "matrix": "HQ",
        "drilling_depth": "11-13",
        "height": "20 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047880",
        "name": "Коронка импрегнированная",
        "article": "3501050",
        "matrix": "PQ",
        "drilling_depth": "03-05",
        "height": "21 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047881",
        "name": "Коронка импрегнированная",
        "article": "3501051",
        "matrix": "PQ",
        "drilling_depth": "05-07",
        "height": "22 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047882",
        "name": "Коронка импрегнированная",
        "article": "3501052",
        "matrix": "PQ",
        "drilling_depth": "07-09",
        "height": "23 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047883",
        "name": "Коронка импрегнированная",
        "article": "3501053",
        "matrix": "PQ",
        "drilling_depth": "09-12",
        "height": "24 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00047884",
        "name": "Коронка импрегнированная",
        "article": "3501054",
        "matrix": "PQ",
        "drilling_depth": "11-13",
        "height": "25 мм",
        "thread": None
    },
    {
        "code_1c": "УТ-00050693",
        "name": "Коронка импрегнированная",
        "article": "3501062",
        "matrix": "HQ3",
        "drilling_depth": "05-07",
        "height": "12",
        "thread": None
    },
    {
        "code_1c": "УТ-00047885",
        "name": "Расширитель алмазный",
        "article": "3501055",
        "matrix": "NQ",
        "drilling_depth": None,
        "height": None,
        "thread": None
    },
    {
        "code_1c": "УТ-00047886",
        "name": "Расширитель алмазный",
        "article": "3501056",
        "matrix": "HQ",
        "drilling_depth": None,
        "height": None,
        "thread": None
    },
    {
        "code_1c": "УТ-00047887",
        "name": "Расширитель алмазный",
        "article": "3501057",
        "matrix": "PQ",
        "drilling_depth": None,
        "height": None,
        "thread": None
    },
    {
        "code_1c": "УТ-00047888",
        "name": "Башмак обсадной",
        "article": "3501058",
        "matrix": "NW",
        "drilling_depth": None,
        "height": None,
        "thread": "W"
    },
    {
        "code_1c": "УТ-00047889",
        "name": "Башмак обсадной",
        "article": "3501059",
        "matrix": "HW",
        "drilling_depth": None,
        "height": None,
        "thread": "W"
    },
    {
        "code_1c": "УТ-00047890",
        "name": "Башмак обсадной",
        "article": "3501060",
        "matrix": "HWT",
        "drilling_depth": None,
        "height": None,
        "thread": "WT"
    },
    {
        "code_1c": "УТ-00047891",
        "name": "Башмак обсадной",
        "article": "3501061",
        "matrix": "PWT",
        "drilling_depth": None,
        "height": None,
        "thread": "WT"
    }
]

def import_nomenclature():
    url = "http://localhost/api/ved-passports/nomenclature/import/"
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc1NjgxODY0NH0.67JVBROj1BGQJTPO0GM8lYZtP0araIeYmmhZ0ZDy9V8",
        "Content-Type": "application/json"
    }

    print(f"Импортируем {len(nomenclature_data)} позиций номенклатуры...")

    response = requests.post(url, json=nomenclature_data, headers=headers)

    if response.status_code == 200:
        result = response.json()
        print("✅ Импорт завершен!")
        print(f"Добавлено: {result['imported_count']}")
        print(f"Обновлено: {result['skipped_count']}")
        if result['errors']:
            print(f"Ошибок: {len(result['errors'])}")
            for error in result['errors'][:5]:  # Показываем первые 5 ошибок
                print(f"  - {error}")
    else:
        print(f"❌ Ошибка импорта: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    import_nomenclature()
