from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_principal, require_elderly, verify_user_access
from app.db.session import get_db
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse, SyncBatchResult, SyncStatusResponse
from app.services.memories import memories_changed_since
from app.services.reminders import reminders_changed_since
from app.services.sync_batch import process_batch

router = APIRouter()


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
    since_dt = since or datetime.fromtimestamp(0)
    reminder_rows = reminders_changed_since(db, user_id, since_dt)
    memory_rows = memories_changed_since(db, user_id, since_dt)
    return SyncStatusResponse(
        reminders=[
            {
                "id": str(row.id),
                "type": row.type,
                "title": row.title,
                "scheduled_time": row.scheduled_time.isoformat(),
                "recurrence_rule": row.recurrence_rule,
                "is_active": row.is_active,
            }
            for row in reminder_rows
        ],
        memories=[
            {
                "id": str(row.id),
                "media_url": row.media_url,
                "title": row.title,
                "category": row.category,
            }
            for row in memory_rows
        ],
        since=since,
    )
