"""
Эндпоинты для управления резервными копиями
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta
import os
import subprocess
import shutil
import json

from database import get_db
from ..models import BackupLog
from ..schemas import BackupLogResponse, BackupCreateRequest, BackupStatsResponse
from ..utils import PermissionManager, ActivityLogger

router = APIRouter()
permission_manager = PermissionManager()
activity_logger = ActivityLogger()

# Конфигурация резервного копирования
BACKUP_DIR = "/app/backups"
DB_BACKUP_DIR = os.path.join(BACKUP_DIR, "database")
FILES_BACKUP_DIR = os.path.join(BACKUP_DIR, "files")


@router.get("/backups", response_model=List[BackupLogResponse])
async def get_backup_logs(
    skip: int = 0,
    limit: int = 100,
    backup_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получить список резервных копий"""
    
    if not permission_manager.has_permission("admin", "backup.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра резервных копий")
    
    query = db.query(BackupLog)
    
    if backup_type:
        query = query.filter(BackupLog.backup_type == backup_type.upper())
    if status:
        query = query.filter(BackupLog.status == status.upper())
    
    query = query.order_by(desc(BackupLog.created_at))
    backups = query.offset(skip).limit(limit).all()
    
    return backups


@router.get("/backups/stats", response_model=BackupStatsResponse)
async def get_backup_stats(db: Session = Depends(get_db)):
    """Получить статистику резервного копирования"""
    
    if not permission_manager.has_permission("admin", "backup.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра статистики")
    
    # Общая статистика
    total_backups = db.query(func.count()).select_from(BackupLog).scalar() or 0
    successful_backups = db.query(func.count()).select_from(BackupLog).filter(
        BackupLog.status == 'SUCCESS'
    ).scalar() or 0
    failed_backups = db.query(func.count()).select_from(BackupLog).filter(
        BackupLog.status == 'FAILED'
    ).scalar() or 0
    
    # Статистика по типам
    type_stats = {}
    for backup_type in ['DATABASE', 'FILES', 'FULL']:
        count = db.query(func.count()).select_from(BackupLog).filter(
            BackupLog.backup_type == backup_type
        ).scalar() or 0
        type_stats[backup_type] = count
    
    # Последняя резервная копия
    last_backup = db.query(BackupLog).filter(
        BackupLog.status == 'SUCCESS'
    ).order_by(desc(BackupLog.created_at)).first()
    
    # Размер всех резервных копий
    total_size = db.query(func.sum(BackupLog.file_size)).scalar() or 0
    
    return BackupStatsResponse(
        total_backups=total_backups,
        successful_backups=successful_backups,
        failed_backups=failed_backups,
        success_rate=(successful_backups / total_backups * 100) if total_backups > 0 else 0,
        type_stats=type_stats,
        last_backup_date=last_backup.created_at if last_backup else None,
        total_size_bytes=total_size
    )


@router.post("/backups/create")
async def create_backup(
    backup_request: BackupCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Создать резервную копию"""
    
    if not permission_manager.has_permission("admin", "backup.write"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для создания резервных копий")
    
    # Создаем запись о начале резервного копирования
    backup_log = BackupLog(
        backup_type=backup_request.backup_type.upper(),
        status='IN_PROGRESS',
        created_by=backup_request.created_by
    )
    
    db.add(backup_log)
    db.commit()
    db.refresh(backup_log)
    
    # Запускаем резервное копирование в фоне
    background_tasks.add_task(
        perform_backup,
        backup_log.id,
        backup_request.backup_type,
        backup_request.include_files,
        backup_request.compression
    )
    
    return {
        "message": "Резервное копирование запущено",
        "backup_id": backup_log.id,
        "status": "IN_PROGRESS"
    }


@router.post("/backups/{backup_id}/restore")
async def restore_backup(
    backup_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Восстановить из резервной копии"""
    
    if not permission_manager.has_permission("admin", "backup.write"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для восстановления")
    
    backup = db.query(BackupLog).filter(BackupLog.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Резервная копия не найдена")
    
    if backup.status != 'SUCCESS':
        raise HTTPException(status_code=400, detail="Резервная копия не готова для восстановления")
    
    if not backup.file_path or not os.path.exists(backup.file_path):
        raise HTTPException(status_code=400, detail="Файл резервной копии не найден")
    
    # Запускаем восстановление в фоне
    background_tasks.add_task(perform_restore, backup_id, backup.file_path)
    
    # Логируем действие
    await activity_logger.log_activity(
        user_id=1,  # Система
        action="restore_backup",
        details={"backup_id": backup_id, "backup_type": backup.backup_type}
    )
    
    return {"message": "Восстановление запущено", "backup_id": backup_id}


@router.delete("/backups/{backup_id}")
async def delete_backup(
    backup_id: int,
    db: Session = Depends(get_db)
):
    """Удалить резервную копию"""
    
    if not permission_manager.has_permission("admin", "backup.delete"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для удаления резервных копий")
    
    backup = db.query(BackupLog).filter(BackupLog.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Резервная копия не найдена")
    
    # Удаляем файл, если он существует
    if backup.file_path and os.path.exists(backup.file_path):
        try:
            os.remove(backup.file_path)
        except Exception as e:
            print(f"Ошибка удаления файла {backup.file_path}: {e}")
    
    # Удаляем запись из базы данных
    db.delete(backup)
    db.commit()
    
    # Логируем действие
    await activity_logger.log_activity(
        user_id=1,  # Система
        action="delete_backup",
        details={"backup_id": backup_id, "backup_type": backup.backup_type}
    )
    
    return {"message": "Резервная копия удалена"}


@router.post("/backups/cleanup")
async def cleanup_old_backups(
    days_to_keep: int = 30,
    db: Session = Depends(get_db)
):
    """Очистить старые резервные копии"""
    
    if not permission_manager.has_permission("admin", "backup.delete"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для очистки резервных копий")
    
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
    
    # Находим старые резервные копии
    old_backups = db.query(BackupLog).filter(
        BackupLog.created_at < cutoff_date
    ).all()
    
    deleted_count = 0
    for backup in old_backups:
        # Удаляем файл
        if backup.file_path and os.path.exists(backup.file_path):
            try:
                os.remove(backup.file_path)
            except Exception as e:
                print(f"Ошибка удаления файла {backup.file_path}: {e}")
        
        # Удаляем запись
        db.delete(backup)
        deleted_count += 1
    
    db.commit()
    
    return {
        "message": f"Удалено {deleted_count} старых резервных копий",
        "deleted_count": deleted_count
    }


async def perform_backup(backup_id: int, backup_type: str, include_files: bool, compression: bool):
    """Выполнить резервное копирование в фоне"""
    
    db = next(get_db())
    backup = db.query(BackupLog).filter(BackupLog.id == backup_id).first()
    
    if not backup:
        return
    
    try:
        start_time = datetime.utcnow()
        
        # Создаем директории если не существуют
        os.makedirs(DB_BACKUP_DIR, exist_ok=True)
        if include_files:
            os.makedirs(FILES_BACKUP_DIR, exist_ok=True)
        
        backup_files = []
        
        if backup_type in ['DATABASE', 'FULL']:
            # Резервное копирование базы данных
            db_file = await backup_database(backup_id, compression)
            if db_file:
                backup_files.append(db_file)
        
        if backup_type in ['FILES', 'FULL'] and include_files:
            # Резервное копирование файлов
            files_archive = await backup_files_system(backup_id, compression)
            if files_archive:
                backup_files.append(files_archive)
        
        # Обновляем запись о резервном копировании
        backup.status = 'SUCCESS'
        backup.file_path = backup_files[0] if backup_files else None
        backup.file_size = sum(os.path.getsize(f) for f in backup_files if os.path.exists(f))
        backup.duration_seconds = int((datetime.utcnow() - start_time).total_seconds())
        
        db.commit()
        
    except Exception as e:
        # Обновляем запись об ошибке
        backup.status = 'FAILED'
        backup.error_message = str(e)
        backup.duration_seconds = int((datetime.utcnow() - start_time).total_seconds())
        db.commit()
        
        print(f"Ошибка резервного копирования {backup_id}: {e}")


async def backup_database(backup_id: int, compression: bool) -> Optional[str]:
    """Создать резервную копию базы данных"""
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"db_backup_{backup_id}_{timestamp}.sql"
    if compression:
        filename += ".gz"
    
    filepath = os.path.join(DB_BACKUP_DIR, filename)
    
    try:
        # Используем pg_dump для PostgreSQL
        cmd = ["pg_dump", "-h", "localhost", "-U", "postgres", "-d", "agb_db"]
        if compression:
            cmd.extend(["-Z", "9"])
        
        with open(filepath, 'w') as f:
            subprocess.run(cmd, stdout=f, check=True)
        
        return filepath
        
    except subprocess.CalledProcessError as e:
        print(f"Ошибка создания резервной копии БД: {e}")
        return None


async def backup_files_system(backup_id: int, compression: bool) -> Optional[str]:
    """Создать резервную копию файлов системы"""
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"files_backup_{backup_id}_{timestamp}.tar"
    if compression:
        filename += ".gz"
    
    filepath = os.path.join(FILES_BACKUP_DIR, filename)
    
    try:
        # Архивируем важные директории
        important_dirs = ['/app/uploads', '/app/static']
        existing_dirs = [d for d in important_dirs if os.path.exists(d)]
        
        if not existing_dirs:
            return None
        
        cmd = ["tar", "-cf", filepath]
        if compression:
            cmd.append("-z")
        
        cmd.extend(existing_dirs)
        
        subprocess.run(cmd, check=True)
        
        return filepath
        
    except subprocess.CalledProcessError as e:
        print(f"Ошибка создания резервной копии файлов: {e}")
        return None


async def perform_restore(backup_id: int, file_path: str):
    """Выполнить восстановление из резервной копии"""
    
    # Здесь должна быть логика восстановления
    # Это критическая операция, требующая особой осторожности
    print(f"Восстановление из резервной копии {backup_id}: {file_path}")
    # TODO: Реализовать восстановление
