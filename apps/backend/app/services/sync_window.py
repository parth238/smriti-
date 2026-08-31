"""Synchronization window helpers for incremental pull."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session


def normalize_db_timestamp(value: datetime) -> datetime:
    """Normalize a database timestamp to timezone-aware UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def database_utc_now(db: Session) -> datetime:
    """Current UTC time from the active database session clock."""
    result = db.execute(select(func.current_timestamp())).scalar_one()
    return normalize_db_timestamp(result)


def normalize_since(since: datetime | None) -> datetime:
    """Normalize the lower sync bound to UTC."""
    if since is None:
        return datetime.fromtimestamp(0, tz=timezone.utc)
    if since.tzinfo is None:
        return since.replace(tzinfo=timezone.utc)
    return since.astimezone(timezone.utc)
