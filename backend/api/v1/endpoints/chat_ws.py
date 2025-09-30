from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Dict, Set
import json

from database import get_db
from models import User, ChatRoom, ChatMessage, ChatParticipant
from ..dependencies import get_current_user_ws

router = APIRouter()

# Хранилище активных подключений
class ConnectionManager:
    def __init__(self):
        # room_id -> set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        self.active_connections[room_id].add(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: dict, room_id: int):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    # Проверяем токен и получаем пользователя
    try:
        current_user = await get_current_user_ws(token, db)
    except HTTPException:
        await websocket.close(code=4001)  # Unauthorized
        return

    # Проверяем, что пользователь является участником чата
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id
            )
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        await websocket.close(code=4004)  # Not Found
        return

    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Создаем новое сообщение
            message = ChatMessage(
                room_id=room_id,
                sender_id=current_user.id,
                content=data.get("content", ""),
                is_edited=False
            )
            db.add(message)
            await db.commit()
            await db.refresh(message)
            
            # Отправляем сообщение всем участникам
            await manager.broadcast(
                {
                    "type": "message",
                    "data": {
                        "id": message.id,
                        "content": message.content,
                        "sender_id": message.sender_id,
                        "created_at": message.created_at.isoformat(),
                        "is_edited": message.is_edited
                    }
                },
                room_id
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(
            {
                "type": "system",
                "data": {
                    "message": f"Пользователь {current_user.username} отключился"
                }
            },
            room_id
        )
