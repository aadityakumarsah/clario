from fastapi import APIRouter, Depends
from loguru import logger
from app.core.auth import get_current_user
from app.schema.response import ApiResponse, ok, fail, field_error
from app.schema.settings import SettingsData, SettingsUpdate
from app.services import settings as settings_service

settings_router = APIRouter(prefix="/settings", tags=["Settings"])

def _to_response(row: dict, email: str) -> SettingsData:
    return SettingsData(
        user_id=str(row.get("userId") or row.get("user_id")),
        name=row.get("name", ""),
        email=email,
        daily_reminder=row.get("dailyReminder", row.get("daily_reminder", True)),
        streak_notifications=row.get("streakNotifications", row.get("streak_notifications", True)),
        weekly_digest=row.get("weeklyDigest", row.get("weekly_digest", False)),
        reminder_time=row.get("reminderTime", row.get("reminder_time", "08:00")),
        updated_at=str(row.get("updatedAt") or row.get("updated_at", "")),
    )

@settings_router.get("", response_model=ApiResponse[SettingsData])
async def get_settings(user: dict = Depends(get_current_user)):
    user_id = user.get("id")
    logger.info(f"GET /settings for user {user_id}")
    row = await settings_service.get_or_create(user_id)
    if not row:
        logger.error(f"get_or_create returned None for user {user_id}")
        return fail("Could not retrieve settings")
    return ok("Settings retrieved", _to_response(row, user.get("email", "")))

@settings_router.patch("", response_model=ApiResponse[SettingsData])
async def patch_settings(body: SettingsUpdate, user: dict = Depends(get_current_user)):
    user_id = user.get("id")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return fail(
            "No fields provided",
            [field_error(None, "empty_body", "Send at least one field to update")],
        )

    # Ensure the row exists before patching
    await settings_service.get_or_create(user_id)

    # Convert camelCase for Prisma if needed (Prisma client usually expects camelCase in data dict)
    # Mapping for SettingsUpdate:
    # daily_reminder -> dailyReminder, etc.
    prisma_updates = {}
    if "daily_reminder" in updates: prisma_updates["dailyReminder"] = updates["daily_reminder"]
    if "streak_notifications" in updates: prisma_updates["streakNotifications"] = updates["streak_notifications"]
    if "weekly_digest" in updates: prisma_updates["weeklyDigest"] = updates["weekly_digest"]
    if "reminder_time" in updates: prisma_updates["reminderTime"] = updates["reminder_time"]
    if "name" in updates: prisma_updates["name"] = updates["name"]

    row = await settings_service.update_settings(user_id, prisma_updates)
    if not row:
        return fail("Failed to update settings")
    return ok("Settings updated", _to_response(row, user.get("email", "")))
