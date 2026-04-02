"""Voice session rows — Prisma calls for voice_sessions table."""
import uuid
from datetime import date, datetime, time, timedelta, timezone
from loguru import logger
from app.core.prisma import db

async def create_session(user_id: str) -> dict | None:
    """Insert a new session with a random id; returns the inserted row or None on failure."""
    try:
        # Ensure user exists in local DB
        await db.user.upsert(
            where={"id": user_id},
            data={
                "create": {"id": user_id, "email": f"user_{user_id}@example.com"}, # Placeholder email
                "update": {}
            }
        )

        session = await db.voicesession.create(
            data={
                "sessionId": str(uuid.uuid4()),
                "userId": user_id
            }
        )
        return session.model_dump()
    except Exception as e:
        logger.error(f"create_session failed for user {user_id}: {e}")
        return None

async def get_session_for_user(session_id: str, user_id: str) -> dict | None:
    """Return the voice_sessions row if it exists and belongs to user_id."""
    try:
        session = await db.voicesession.find_unique(
            where={"sessionId": session_id}
        )
        if session and session.userId == user_id:
            return session.model_dump()
        return None
    except Exception as e:
        logger.error(f"get_session_for_user failed: {e}")
        return None

async def list_sessions_for_user(
    user_id: str,
    *,
    session_date: date | None = None,
    tz_offset_minutes: int = 0,
) -> list[dict] | None:
    """Return voice_sessions rows for user_id, newest first."""
    try:
        where = {"userId": user_id}
        
        if session_date is not None:
            local_tz = timezone(timedelta(minutes=-tz_offset_minutes))
            local_start = datetime.combine(session_date, time.min, tzinfo=local_tz)
            local_end = local_start + timedelta(days=1)
            utc_start = local_start.astimezone(timezone.utc)
            utc_end = local_end.astimezone(timezone.utc)
            
            where["createdAt"] = {
                "gte": utc_start,
                "lt": utc_end
            }

        sessions = await db.voicesession.find_many(
            where=where,
            order={"createdAt": "desc"}
        )
        return [s.model_dump() for s in sessions]
    except Exception as e:
        logger.error(f"list_sessions_for_user failed: {e}")
        return None

async def end_session(session_id: str, user_id: str, duration_seconds: int) -> bool:
    """Set ended_at and duration_seconds when the live voice WebSocket closes."""
    try:
        await db.voicesession.update(
            where={"sessionId": session_id},
            data={
                "endedAt": datetime.now(timezone.utc),
                "durationSeconds": max(0, int(duration_seconds)),
            }
        )
        return True
    except Exception as e:
        logger.error(f"end_session failed: {e}")
        return False

async def save_call_report(session_id: str, user_id: str, report: dict) -> bool:
    """Persist structured JSON to voice_sessions.call_report."""
    try:
        from prisma import Json
        await db.voicesession.update(
            where={"sessionId": session_id},
            data={"callReport": Json(report)}
        )
        return True
    except Exception as e:
        logger.error(f"save_call_report failed: {e}")
        return False
