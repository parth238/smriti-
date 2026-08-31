"""Offline batch sync for game sessions and reminder acknowledgements."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import ValidationError
from app.models.sync_event import SyncEvent
from app.services.game_sessions import create_game_session
from app.services.reminders import acknowledge_reminder


def process_batch(
    db: Session,
    *,
    user_id: UUID,
    device_id: str,
    items: list[dict[str, Any]],
) -> tuple[UUID, list[dict[str, Any]]]:
    results: list[dict[str, Any]] = []
    for index, item in enumerate(items):
        item_type = item.get("type")
        payload = item.get("payload") or {}
        try:
            if item_type == "game_session":
                result = _process_game_session(db, user_id, payload)
            elif item_type == "reminder_ack":
                result = _process_reminder_ack(db, user_id, payload)
            else:
                raise ValidationError(f"Unknown sync item type: {item_type}")
            results.append(
                {
                    "index": index,
                    "type": item_type,
                    "status": "ok",
                    "id": result,
                    "error": None,
                }
            )
        except Exception as exc:  # noqa: BLE001 — per-item status for flaky networks
            results.append(
                {
                    "index": index,
                    "type": str(item_type),
                    "status": "error",
                    "id": None,
                    "error": str(exc),
                }
            )

    event = SyncEvent(
        user_id=user_id,
        device_id=device_id,
        batch_size=len(items),
        status="processed",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event.id, results


def _process_game_session(db: Session, user_id: UUID, payload: dict[str, Any]) -> UUID:
    client_id = payload.get("client_generated_id")
    if not client_id:
        raise ValidationError(
            "client_generated_id is required", field="client_generated_id"
        )
    played_at_raw = payload.get("played_at")
    played_at = (
        datetime.fromisoformat(played_at_raw.replace("Z", "+00:00"))
        if isinstance(played_at_raw, str)
        else datetime.now(timezone.utc)
    )
    session, _, _ = create_game_session(
        db,
        user_id=user_id,
        game_id=payload.get("game_id"),
        game_type=payload.get("game_type"),
        difficulty=int(payload.get("difficulty", 3)),
        accuracy=float(payload.get("accuracy", 0)),
        reaction_time_ms=int(payload.get("reaction_time_ms", 0)),
        errors=int(payload.get("errors", 0)),
        hints_used=int(payload.get("hints_used", 0)),
        session_duration_sec=int(payload.get("session_duration_sec", 0)),
        completed_or_quit=str(payload.get("completed_or_quit", "completed")),
        client_generated_id=UUID(str(client_id)),
        played_at=played_at,
    )
    return session.id


def _process_reminder_ack(db: Session, user_id: UUID, payload: dict[str, Any]) -> UUID:
    reminder_id = payload.get("reminder_id")
    if not reminder_id:
        raise ValidationError("reminder_id is required", field="reminder_id")
    updated = acknowledge_reminder(db, UUID(str(reminder_id)), user_id)
    return updated.id
