"""Settings service — all Prisma calls for user_settings table."""
from loguru import logger
from app.core.prisma import db

_DEFAULTS = {
    "name": "",
    "daily_reminder": True,
    "streak_notifications": True,
    "weekly_digest": False,
    "reminder_time": "08:00",
}

async def get_settings(user_id: str) -> dict | None:
    """Return the user's settings row, or None if it doesn't exist yet."""
    try:
        settings = await db.usersetting.find_unique(where={"userId": user_id})
        return settings.model_dump() if settings else None
    except Exception as e:
        logger.error(f"Error getting settings for user {user_id}: {e}")
        return None

async def create_defaults(user_id: str) -> dict | None:
    """Insert a default settings row and return it."""
    try:
        # Check if user exists first to satisfy FK; if not, create them
        # In this flow, we assume the user might not exist in our Neon DB yet
        # but is authenticated via Supabase.
        await db.user.upsert(
            where={"id": user_id},
            data={
                "create": {"id": user_id, "email": f"user_{user_id}@example.com"}, # Placeholder email
                "update": {}
            }
        )

        settings = await db.usersetting.create(
            data={"userId": user_id, **_DEFAULTS}
        )
        return settings.model_dump()
    except Exception as e:
        # Handle unique constraint violation if settings already exist
        logger.warning(f"create_defaults failed, maybe already exists: {e}")
        return await get_settings(user_id)

async def get_or_create(user_id: str) -> dict | None:
    """Return existing settings, creating defaults on first visit."""
    row = await get_settings(user_id)
    return row if row is not None else await create_defaults(user_id)

async def update_settings(user_id: str, updates: dict) -> dict | None:
    """Partial-update the user's settings row and return the updated row."""
    try:
        settings = await db.usersetting.update(
            where={"userId": user_id},
            data=updates
        )
        return settings.model_dump()
    except Exception as e:
        logger.error(f"Error updating settings for user {user_id}: {e}")
        return None
