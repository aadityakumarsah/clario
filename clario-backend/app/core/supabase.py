"""Supabase helpers: auth verification + PostgREST client."""
from typing import Any, Optional
import httpx
from loguru import logger
from app.core.config import settings

# ── Auth ───────────────────────────────────────────────────────────────────────

SUPABASE_AUTH_URL = f"{settings.SUPABASE_URL}/auth/v1/user"

_AUTH_HEADERS = {"apikey": settings.SUPABASE_SECRET_KEY}


def get_supabase_user(token: str) -> dict | None:
    """Verify a Supabase JWT. Returns user dict on success, None on failure."""
    try:
        response = httpx.get(
            SUPABASE_AUTH_URL,
            headers={**_AUTH_HEADERS, "Authorization": f"Bearer {token}"},
            timeout=5.0,
        )
        return response.json() if response.status_code == 200 else None
    except httpx.RequestError:
        return None


# ── PostgREST ─────────────────────────────────────────────────────────────────

SUPABASE_REST_URL = f"{settings.SUPABASE_URL}/rest/v1"

_DB_HEADERS = {
    "apikey": settings.SUPABASE_SECRET_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_SECRET_KEY}",
    "Content-Type": "application/json",
}


def postgrest(
    method: str,
    table: str,
    *,
    params: Optional[dict] = None,
    body: Optional[dict] = None,
    prefer: Optional[str] = None,
) -> tuple[int, Any]:
    """Generic PostgREST request. Returns (status_code, parsed_json)."""
    headers = dict(_DB_HEADERS)
    if prefer:
        headers["Prefer"] = prefer

    try:
        response = httpx.request(
            method.upper(),
            f"{SUPABASE_REST_URL}/{table}",
            headers=headers,
            params=params,
            json=body,
            timeout=5.0,
        )
        # 204 No Content → no body
        data = response.json() if response.content else None
        if response.status_code >= 400:
            logger.warning("PostgREST {} /{} → {} {}", method.upper(), table, response.status_code, data)
        return response.status_code, data
    except httpx.RequestError as e:
        logger.error("PostgREST request error: {}", e)
        return 503, None
