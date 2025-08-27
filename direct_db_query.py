#!/usr/bin/env python3
"""
Скрипт для прямого запроса к базе данных через Docker
"""

import subprocess
import sys

def query_users():
    """Выполнение SQL запроса через Docker exec"""
    try:
        print("🔍 Выполнение запроса к базе данных через Docker...")
        
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
        
        print("📋 Выполняем SQL запрос...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            output = result.stdout.strip()
            if output:
                print("✅ Пользователи найдены:")
                print("=" * 60)
                print(output)
            else:
                print("❌ Пользователи не найдены или таблица пуста")
        else:
            print(f"❌ Ошибка выполнения запроса: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("❌ Превышено время ожидания выполнения запроса")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    query_users()
