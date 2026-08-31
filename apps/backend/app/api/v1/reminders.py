from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import (
    get_current_principal,
    require_caregiver,
    verify_caregiver_linked,
    verify_user_access,
)
from app.core.errors import AuthorizationError
from app.db.session import get_db
from app.schemas.reminders import (
    NextReminderResponse,
    ReminderAckResponse,
    ReminderCreate,
    ReminderRow,
    ReminderUpdate,
)
from app.services.reminders import (
    acknowledge_reminder,
    create_reminder,
    deactivate_reminder,
    list_reminders,
    next_reminder,
    update_reminder,
)

router = APIRouter()


def _row(reminder) -> ReminderRow:
    return ReminderRow(
        id=reminder.id,
        user_id=reminder.user_id,
        type=reminder.type,
        title=reminder.title,
        scheduled_time=reminder.scheduled_time,
        recurrence_rule=reminder.recurrence_rule,
        is_active=reminder.is_active,
        last_acknowledged_at=reminder.last_acknowledged_at,
        created_at=reminder.created_at,
    )


@router.get("/users/{user_id}/reminders", response_model=list[ReminderRow])
def get_user_reminders(
    user_id: UUID,
    active_only: bool = True,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[ReminderRow]:
    verify_user_access(user_id, principal, db)
    rows = list_reminders(db, user_id, active_only=active_only)
    return [_row(row) for row in rows]


@router.get("/users/{user_id}/reminders/next", response_model=NextReminderResponse)
def get_next_reminder(
    user_id: UUID,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> NextReminderResponse:
    verify_user_access(user_id, principal, db)
    row = next_reminder(db, user_id)
    return NextReminderResponse(reminder=_row(row) if row else None)


@router.post("/reminders", response_model=ReminderRow, status_code=201)
def post_reminder(
    body: ReminderCreate,
    caregiver_id: UUID = Depends(require_caregiver),
    db: Session = Depends(get_db),
) -> ReminderRow:
    verify_caregiver_linked(body.user_id, caregiver_id, db)
    title = {"en": body.title.en}
    if body.title.as_:
        title["as"] = body.title.as_
    reminder = create_reminder(
        db,
        user_id=body.user_id,
        caregiver_id=caregiver_id,
        reminder_type=body.type,
        title=title,
        scheduled_time=body.scheduled_time,
        recurrence_rule=body.recurrence_rule,
    )
    return _row(reminder)


@router.patch("/reminders/{reminder_id}", response_model=ReminderRow)
def patch_reminder(
    reminder_id: UUID,
    body: ReminderUpdate,
    caregiver_id: UUID = Depends(require_caregiver),
    db: Session = Depends(get_db),
) -> ReminderRow:
    from app.models.reminder import Reminder

    existing = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if existing is None:
        from app.core.errors import NotFoundError

        raise NotFoundError("Reminder was not found")
    verify_caregiver_linked(existing.user_id, caregiver_id, db)
    title = None
    if body.title is not None:
        title = {"en": body.title.en}
        if body.title.as_:
            title["as"] = body.title.as_
    reminder = update_reminder(
        db,
        reminder_id,
        reminder_type=body.type,
        title=title,
        scheduled_time=body.scheduled_time,
        recurrence_rule=body.recurrence_rule,
        is_active=body.is_active,
    )
    return _row(reminder)


@router.delete("/reminders/{reminder_id}", response_model=ReminderRow)
def delete_reminder(
    reminder_id: UUID,
    caregiver_id: UUID = Depends(require_caregiver),
    db: Session = Depends(get_db),
) -> ReminderRow:
    from app.models.reminder import Reminder

    existing = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if existing is None:
        from app.core.errors import NotFoundError

        raise NotFoundError("Reminder was not found")
    verify_caregiver_linked(existing.user_id, caregiver_id, db)
    reminder = deactivate_reminder(db, reminder_id)
    return _row(reminder)


@router.post("/reminders/{reminder_id}/acknowledge", response_model=ReminderAckResponse)
def ack_reminder(
    reminder_id: UUID,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> ReminderAckResponse:
    subject_id, role = principal
    if role != "elderly_user":
        raise AuthorizationError("Only the elderly user can acknowledge reminders")
    reminder = acknowledge_reminder(db, reminder_id, subject_id)
    return ReminderAckResponse(
        id=reminder.id,
        last_acknowledged_at=reminder.last_acknowledged_at,  # type: ignore[arg-type]
    )
