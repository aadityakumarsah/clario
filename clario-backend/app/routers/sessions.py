from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from loguru import logger
from app.core.auth import get_current_user
from app.schema.call_report import SessionDetailData
from app.schema.response import ApiResponse, fail, ok
from app.schema.session import SessionStartData
from app.services import call_report as call_report_service
from app.services import voice_session as voice_session_service

sessions_router = APIRouter(prefix="/sessions", tags=["Sessions"])

@sessions_router.get("", response_model=ApiResponse[list[SessionDetailData]])
async def list_sessions(
    date_filter: date | None = Query(default=None, alias="date"),
    tz_offset_minutes: int = Query(default=0, ge=-840, le=840),
    user: dict = Depends(get_current_user),
):
    """All sessions for the current user."""
    user_id = user.get("id")
    logger.info(f"GET /sessions for user {user_id} | date={date_filter}")
    items = await call_report_service.list_sessions_detail(
        user_id,
        session_date=date_filter,
        tz_offset_minutes=tz_offset_minutes,
    )
    if items is None:
        return fail("Could not load sessions")
    return ok("OK", items)

@sessions_router.post("/start", response_model=ApiResponse[SessionStartData])
async def start_session(user: dict = Depends(get_current_user)):
    """Create a voice session record."""
    user_id = user.get("id")
    logger.info(f"POST /sessions/start for user {user_id}")
    row = await voice_session_service.create_session(user_id)
    if not row:
        return fail("Could not create session")

    return ok(
        "Session created",
        SessionStartData(
            session_id=str(row.get("sessionId") or row.get("session_id")),
            user_id=str(row.get("userId") or row.get("user_id")),
            created_at=str(row.get("createdAt") or row.get("created_at")),
        ),
    )

@sessions_router.get("/{session_id}", response_model=ApiResponse[SessionDetailData])
async def get_session(session_id: UUID, user: dict = Depends(get_current_user)):
    """Get single session detail."""
    user_id = user.get("id")
    sid = str(session_id)
    logger.info(f"GET /sessions/{sid} for user {user_id}")
    detail = await call_report_service.get_session_detail(sid, user_id)
    if not detail:
        return fail("Session not found")
    return ok("OK", detail)

@sessions_router.post("/{session_id}/report", response_model=ApiResponse[SessionDetailData])
async def generate_session_report(session_id: UUID, user_id: str = Depends(get_current_user)):
    """Generate and save report."""
    user_id = user_id if isinstance(user_id, str) else user_id.get("id") # Handle potential dict from Depends
    sid = str(session_id)
    logger.info(f"POST /sessions/{sid}/report for user {user_id}")
    out = await call_report_service.generate_call_report(sid, user_id)
    if not out:
        return fail("Could not generate report")

    report, session, messages = out
    if not await voice_session_service.save_call_report(sid, user_id, report.model_dump()):
        return fail("Report generated but could not be saved")

    detail = call_report_service.build_session_detail(session, report, messages)
    return ok("Report ready", detail)
