#!/usr/bin/env python3
"""
Обновляем подготовленные файлы с исправлениями
"""
import shutil
import os

def update_prepared_files():
    """Обновляем файлы в /tmp/platform_fixes_v2"""

    print("🔄 Обновляем подготовленные файлы...")

    # Обновляем backend файлы
    backend_files = [
        'main.py',
        'schemas.py',
        'routers/__init__.py',
        'routers/chat.py'
    ]

    for file_path in backend_files:
        src = f'/Users/andreydolgov/Desktop/programming/agb_proj/backend/{file_path}'
        dst = f'/tmp/platform_fixes_v2/backend/{file_path}'

        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"✅ Обновлен: backend/{file_path}")

    # Обновляем frontend файлы
    frontend_files = [
        'utils/api.ts',
        'components/AuthContext.tsx',
        'components/AddEventModal.tsx',
        'components/AdvancedSearchFilters.tsx',
        'components/ArchiveStats.tsx',
        'components/CreateChatRoomModal.tsx',
        'app/users/page.tsx',
        'app/admin/bots/page.tsx',
        'app/ved-passports/page.tsx'
    ]

    for file_path in frontend_files:
        src = f'/Users/andreydolgov/Desktop/programming/agb_proj/frontend/{file_path}'
        dst = f'/tmp/platform_fixes_v2/frontend/{file_path}'

        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"✅ Обновлен: frontend/{file_path}")

    print("🎉 Все файлы обновлены!")

if __name__ == "__main__":
    update_prepared_files()
