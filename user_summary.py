#!/usr/bin/env python3
"""
Скрипт для создания краткой сводки по пользователям
"""

import subprocess
from collections import Counter

def get_user_summary():
    """Получение сводки по пользователям"""
    try:
        print("📊 СВОДКА ПО ПОЛЬЗОВАТЕЛЯМ В БАЗЕ ДАННЫХ DOCKER")
        print("=" * 60)
        
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
            created_at
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
                lines = output.strip().split('\n')
                users = []
                roles = []
                active_count = 0
                inactive_count = 0
                
                for line in lines:
                    if line.strip():
                        parts = [part.strip() for part in line.split('|')]
                        if len(parts) >= 8:
                            user_id = parts[0]
                            username = parts[1]
                            email = parts[2]
                            first_name = parts[3]
                            last_name = parts[4]
                            role = parts[6]
                            is_active = parts[7]
                            
                            users.append({
                                'id': user_id,
                                'username': username,
                                'name': f"{first_name} {last_name}",
                                'role': role,
                                'active': is_active == 't'
                            })
                            
                            roles.append(role)
                            if is_active == 't':
                                active_count += 1
                            else:
                                inactive_count += 1
                
                # Статистика
                print(f"👥 Общее количество пользователей: {len(users)}")
                print(f"✅ Активных пользователей: {active_count}")
                print(f"❌ Неактивных пользователей: {inactive_count}")
                print()
                
                # Роли
                role_counts = Counter(roles)
                print("🔑 Распределение по ролям:")
                for role, count in role_counts.items():
                    print(f"  • {role}: {count}")
                print()
                
                # Список пользователей
                print("👤 Список пользователей:")
                for user in users:
                    status = "✅" if user['active'] else "❌"
                    print(f"  {status} {user['id']:2}. {user['name']} (@{user['username']}) - {user['role']}")
                
            else:
                print("❌ Пользователи не найдены")
        else:
            print(f"❌ Ошибка выполнения запроса: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    get_user_summary()
