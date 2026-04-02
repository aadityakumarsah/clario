"""Conversation history — Prisma calls for conversation_history table."""
from loguru import logger
from app.core.prisma import db

async def save_message(
    session_id: str,
    user_id: str,
    role: str,
    message: str,
) -> bool:
    """Insert a single message (user or assistant)."""
    try:
        await db.conversationhistory.create(
            data={
                "sessionId": session_id,
                "userId": user_id,
                "role": role,
                "message": message,
            }
        )
        return True
    except Exception as e:
        logger.error(f"save_message failed: {e}")
        return False

async def list_messages_for_session(session_id: str, user_id: str) -> list[dict] | None:
    """Return all conversation turns for a session, oldest first."""
    try:
        messages = await db.conversationhistory.find_many(
            where={
                "sessionId": session_id,
                "userId": user_id,
            },
            order={"createdAt": "asc"}
        )
        return [m.model_dump() for m in messages]
    except Exception as e:
        logger.error(f"list_messages_for_session failed: {e}")
        return None

async def bulk_insert_messages(messages: list[dict]) -> bool:
    """Insert multiple messages efficiently."""
    try:
        # Prisma Python doesn't have a very clean bulk create for different objects usually,
        # but for same model it might. We'll use a transaction.
        async with db.batch_() as batcher:
            for msg in messages:
                batcher.conversationhistory.create(
                    data={
                        "sessionId": msg["session_id"],
                        "userId": msg["user_id"],
                        "role": msg["role"],
                        "message": msg["message"],
                    }
                )
            await batcher.commit()
        return True
    except Exception as e:
        logger.error(f"bulk_insert_messages failed: {e}")
        return False
