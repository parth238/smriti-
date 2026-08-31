"""Reminder CRUD and acknowledge."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, ValidationError
from app.models.reminder import Reminder
from app.services.sync_window import database_utc_now


def list_reminders(
    db: Session,
    user_id: UUID,
    *,
    active_only: bool = True,
) -> list[Reminder]:
    query = db.query(Reminder).filter(Reminder.user_id == user_id)
    if active_only:
        query = query.filter(Reminder.is_active.is_(True))
    return query.order_by(Reminder.scheduled_time.asc()).all()


def next_reminder(db: Session, user_id: UUID) -> Reminder | None:
    return (
        db.query(Reminder)
        .filter(
            Reminder.user_id == user_id,
            Reminder.is_active.is_(True),
        )
        .order_by(Reminder.scheduled_time.asc())
        .first()
    )


def create_reminder(
    db: Session,
    *,
    user_id: UUID,
    caregiver_id: UUID,
    reminder_type: str,
    title: dict[str, str],
    scheduled_time: datetime,
    recurrence_rule: str | None,
) -> Reminder:
    if not title.get("en"):
        raise ValidationError("title.en is required", field="title")
    reminder = Reminder(
        user_id=user_id,
        created_by_caregiver_id=caregiver_id,
        type=reminder_type,
        title=title,
        scheduled_time=scheduled_time,
        recurrence_rule=recurrence_rule,
        is_active=True,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def update_reminder(
    db: Session,
    reminder_id: UUID,
    *,
    reminder_type: str | None = None,
    title: dict[str, str] | None = None,
    scheduled_time: datetime | None = None,
    recurrence_rule: str | None = None,
    is_active: bool | None = None,
) -> Reminder:
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if reminder is None:
        raise NotFoundError("Reminder was not found")
    if reminder_type is not None:
        reminder.type = reminder_type
    if title is not None:
        if not title.get("en"):
            raise ValidationError("title.en is required", field="title")
        reminder.title = title
    if scheduled_time is not None:
        reminder.scheduled_time = scheduled_time
    if recurrence_rule is not None:
        reminder.recurrence_rule = recurrence_rule
    if is_active is not None:
        reminder.is_active = is_active
    db.commit()
    db.refresh(reminder)
    return reminder


def deactivate_reminder(db: Session, reminder_id: UUID) -> Reminder:
    return update_reminder(db, reminder_id, is_active=False)


def acknowledge_reminder(
    db: Session,
    reminder_id: UUID,
    user_id: UUID,
) -> Reminder:
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if reminder is None:
        raise NotFoundError("Reminder was not found")
    if reminder.user_id != user_id:
        raise ValidationError(
            "This reminder does not belong to you", field="reminder_id"
        )
    now = database_utc_now(db)
    reminder.last_acknowledged_at = now
    reminder.updated_at = now
    db.commit()
    db.refresh(reminder)
    return reminder


def reminders_changed_since(
    db: Session,
    user_id: UUID,
    since: datetime,
    *,
    until: datetime | None = None,
) -> list[Reminder]:
    query = db.query(Reminder).filter(
        Reminder.user_id == user_id,
        Reminder.updated_at >= since,
    )
    if until is not None:
        query = query.filter(Reminder.updated_at <= until)
    return query.order_by(Reminder.updated_at.asc()).all()
