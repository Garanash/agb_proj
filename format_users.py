#!/usr/bin/env python3
"""
Скрипт для красивого вывода пользователей из базы данных
"""

import subprocess
import re

def get_and_format_users():
    """Получение и форматирование пользователей"""
    try:
        print("👥 Пользователи в базе данных Docker")
        print("=" * 80)
        
        # SQL запрос для получения пользователей
        sql_query = """
        SELECT 
            id,
            username,
            email,
            first_name,
            last_name,
            middle_name,
            role,
            is_active,
            created_at,
            updated_at
        FROM users 
        ORDER BY id;
        """
        
        # Выполняем команду через Docker exec
        cmd = [
            "docker", "exec", "agb_proj-db-1",
            "psql", "-U", "felix_user", "-d", "agb_felix",
            "-t", "-c", sql_query.strip()
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            output = result.stdout.strip()
            if output:
                # Парсим вывод и форматируем
                lines = output.strip().split('\n')
                
                for line in lines:
                    if line.strip():
                        # Разбираем строку по символу |
                        parts = [part.strip() for part in line.split('|')]
                        if len(parts) >= 8:
                            user_id = parts[0]
                            username = parts[1]
                            email = parts[2]
                            first_name = parts[3]
                            last_name = parts[4]
                            middle_name = parts[5]
                            role = parts[6]
                            is_active = parts[7]
                            created_at = parts[8] if len(parts) > 8 else "N/A"
                            updated_at = parts[9] if len(parts) > 9 else "N/A"
                            
                            print(f"🆔 ID: {user_id}")
                            print(f"👤 Username: {username}")
                            print(f"📧 Email: {email}")
                            print(f"📝 Имя: {first_name}")
                            print(f"📝 Фамилия: {last_name}")
                            print(f"📝 Отчество: {middle_name if middle_name else 'Не указано'}")
                            print(f"🔑 Роль: {role}")
                            print(f"✅ Активен: {'Да' if is_active == 't' else 'Нет'}")
                            print(f"📅 Создан: {created_at}")
                            print(f"🔄 Обновлен: {updated_at if updated_at != 'N/A' else 'Не обновлялся'}")
                            print("-" * 60)
            else:
                print("❌ Пользователи не найдены или таблица пуста")
        else:
            print(f"❌ Ошибка выполнения запроса: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("❌ Превышено время ожидания выполнения запроса")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    get_and_format_users()
