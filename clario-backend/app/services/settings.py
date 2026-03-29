"""Settings service — all Supabase PostgREST calls for user_settings table.

Tables are not created by this app. Run supabase/sql/user_settings.sql in the Supabase SQL editor first.
"""
from loguru import logger

from app.core.supabase import postgrest

TABLE = "user_settings"

_DEFAULTS = {
    "name": "",
    "daily_reminder": True,
    "streak_notifications": True,
    "weekly_digest": False,
    "reminder_time": "08:00",
}


def get_settings(user_id: str) -> dict | None:
    """Return the user's settings row, or None if it doesn't exist yet."""
    status, data = postgrest(
        "GET",
        TABLE,
        params={"user_id": f"eq.{user_id}", "select": "*"},
    )
    if status == 200:
        if data and isinstance(data, list) and len(data) > 0:
            return data[0]
        return None
    logger.warning("get_settings PostgREST GET user_settings → {} body={}", status, data)
    return None


def create_defaults(user_id: str) -> dict | None:
    """Insert a default settings row and return it."""
    status, data = postgrest(
        "POST",
        TABLE,
        body={"user_id": user_id, **_DEFAULTS},
        prefer="return=representation",
    )
    if status in (200, 201) and data:
        return data[0]
    # 409 = row already exists (race condition) — fetch instead
    if status == 409:
        return get_settings(user_id)
    logger.warning(
        "create_defaults PostgREST POST user_settings → {} body={}",
        status,
        data,
    )
    return None


def get_or_create(user_id: str) -> dict | None:
    """Return existing settings, creating defaults on first visit."""
    row = get_settings(user_id)
    return row if row is not None else create_defaults(user_id)


def update_settings(user_id: str, updates: dict) -> dict | None:
    """Partial-update the user's settings row and return the updated row."""
    status, data = postgrest(
        "PATCH",
        TABLE,
        params={"user_id": f"eq.{user_id}"},
        body=updates,
        prefer="return=representation",
    )
    if status == 200 and data:
        return data[0]
    logger.warning("update_settings PostgREST PATCH user_settings → {} body={}", status, data)
    return None
