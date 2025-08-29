#!/usr/bin/env python3
"""
Обновляем модели с исправлениями ChatRoom
"""
import shutil

def update_models():
    """Обновляем файлы моделей в архиве исправлений"""

    print("🔧 Обновляем модели в архиве исправлений...")

    # Обновляем backend файлы
    files_to_update = [
        'models.py',
        'routers/chat.py'
    ]

    for file_path in files_to_update:
        src = f'/Users/andreydolgov/Desktop/programming/agb_proj/backend/{file_path}'
        dst = f'/tmp/platform_fixes_v2/backend/{file_path}'

        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"✅ Обновлен: backend/{file_path}")

    # Создаем новый архив
    import subprocess
    result = subprocess.run([
        'tar', '-czf', '/tmp/platform_fixes_v2_updated.tar.gz',
        '-C', '/tmp', 'platform_fixes_v2'
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print("✅ Архив обновлен: /tmp/platform_fixes_v2_updated.tar.gz")
    else:
        print(f"❌ Ошибка создания архива: {result.stderr}")

if __name__ == "__main__":
    import os
    update_models()
