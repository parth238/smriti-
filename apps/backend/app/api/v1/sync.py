from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_principal, require_elderly, verify_user_access
from app.db.session import get_db
from app.schemas.sync import (
    SyncBatchRequest,
    SyncBatchResponse,
    SyncBatchResult,
    SyncStatusMemoryItem,
    SyncStatusReminderItem,
    SyncStatusResponse,
)
from app.services.memories import memories_changed_since
from app.services.reminders import reminders_changed_since
from app.services.sync_batch import process_batch
from app.services.sync_window import database_utc_now, normalize_since

router = APIRouter()


def _reminder_item(row) -> SyncStatusReminderItem:
    return SyncStatusReminderItem(
        id=str(row.id),
        type=row.type,
        title=row.title,
        scheduled_time=row.scheduled_time.isoformat(),
        recurrence_rule=row.recurrence_rule,
        is_active=row.is_active,
        updated_at=row.updated_at.isoformat(),
        last_acknowledged_at=(
            row.last_acknowledged_at.isoformat()
            if row.last_acknowledged_at is not None
            else None
        ),
    )


def _memory_item(row) -> SyncStatusMemoryItem:
    return SyncStatusMemoryItem(
        id=str(row.id),
        media_url=row.media_url,
        title=row.title,
        category=row.category,
        created_at=row.created_at.isoformat(),
    )


@router.post("/sync/batch", response_model=SyncBatchResponse)
def sync_batch(
    body: SyncBatchRequest,
    user_id: UUID = Depends(require_elderly),
    db: Session = Depends(get_db),
) -> SyncBatchResponse:
    raw_items = [{"type": item.type, "payload": item.payload} for item in body.items]
    batch_id, results = process_batch(
        db,
        user_id=user_id,
        device_id=body.device_id,
        items=raw_items,
    )
    mapped = [
        SyncBatchResult(
            index=row["index"],
            type=row["type"],
            status=row["status"],
            id=UUID(str(row["id"])) if row.get("id") else None,
            error=row.get("error"),
        )
        for row in results
    ]
    return SyncBatchResponse(batch_id=batch_id, results=mapped)


@router.get("/sync/status", response_model=SyncStatusResponse)
def sync_status(
    user_id: UUID = Query(...),
    since: datetime | None = Query(default=None),
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> SyncStatusResponse:
    verify_user_access(user_id, principal, db)
    since_dt = normalize_since(since)
    next_since = database_utc_now(db)
    reminder_rows = reminders_changed_since(db, user_id, since_dt, until=next_since)
    memory_rows = memories_changed_since(db, user_id, since_dt, until=next_since)
    return SyncStatusResponse(
        reminders=[_reminder_item(row) for row in reminder_rows],
        memories=[_memory_item(row) for row in memory_rows],
        since=since,
        next_since=next_since,
    )
