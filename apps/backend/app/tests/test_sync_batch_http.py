"""HTTP integration tests for POST /sync/batch happy paths."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.game_session import GameSession
from app.models.reminder import Reminder
from app.tests.conftest import elderly_token


def _game_session_payload(client_id: str, *, user_id: str | None = None) -> dict:
    payload = {
        "client_generated_id": client_id,
        "game_type": "memory_match",
        "difficulty": 3,
        "accuracy": 82.5,
        "reaction_time_ms": 900,
        "errors": 1,
        "hints_used": 0,
        "session_duration_sec": 120,
        "completed_or_quit": "completed",
        "played_at": datetime.now(timezone.utc).isoformat(),
    }
    if user_id is not None:
        payload["user_id"] = user_id
    return payload


def _reminder(
    db: Session,
    *,
    user_id,
    caregiver_id,
) -> Reminder:
    reminder = Reminder(
        user_id=user_id,
        created_by_caregiver_id=caregiver_id,
        type="medication",
        title={"en": "Drink water", "as": "Drink water"},
        scheduled_time=datetime.now(timezone.utc),
        recurrence_rule=None,
        is_active=True,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def test_sync_batch_game_session_happy_path(
    client: TestClient,
    db_session: Session,
    elderly_user,
) -> None:
    client_id = str(uuid4())
    token = elderly_token(elderly_user.id)
    response = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "gate2-device",
            "items": [
                {
                    "type": "game_session",
                    "payload": _game_session_payload(client_id),
                }
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["results"][0]["status"] == "ok"

    row = (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(client_id))
        .one()
    )
    assert row.user_id == elderly_user.id


def test_sync_batch_game_session_idempotent_replay(
    client: TestClient,
    db_session: Session,
    elderly_user,
) -> None:
    client_id = str(uuid4())
    token = elderly_token(elderly_user.id)
    payload = {
        "device_id": "gate2-device",
        "items": [
            {
                "type": "game_session",
                "payload": _game_session_payload(client_id),
            }
        ],
    }
    headers = {"Authorization": f"Bearer {token}"}

    first = client.post("/api/v1/sync/batch", headers=headers, json=payload)
    second = client.post("/api/v1/sync/batch", headers=headers, json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["results"][0]["status"] == "ok"
    assert second.json()["results"][0]["status"] == "ok"

    count = (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(client_id))
        .count()
    )
    assert count == 1


def test_sync_batch_game_session_ignores_payload_user_id(
    client: TestClient,
    db_session: Session,
    elderly_user,
    other_elderly_user,
) -> None:
    client_id = str(uuid4())
    token = elderly_token(elderly_user.id)
    response = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "gate2-device",
            "items": [
                {
                    "type": "game_session",
                    "payload": _game_session_payload(
                        client_id,
                        user_id=str(other_elderly_user.id),
                    ),
                }
            ],
        },
    )
    assert response.status_code == 200
    row = (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(client_id))
        .one()
    )
    assert row.user_id == elderly_user.id
    assert row.user_id != other_elderly_user.id


def test_sync_batch_reminder_ack_happy_path(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
) -> None:
    reminder = _reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
    )
    before_updated_at = reminder.updated_at
    token = elderly_token(elderly_user.id)
    ack_at = datetime.now(timezone.utc).isoformat()

    response = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "gate2-device",
            "items": [
                {
                    "type": "reminder_ack",
                    "payload": {
                        "reminder_id": str(reminder.id),
                        "acknowledged_at": ack_at,
                    },
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["results"][0]["status"] == "ok"

    db_session.refresh(reminder)
    assert reminder.last_acknowledged_at is not None
    assert reminder.updated_at >= before_updated_at


def test_sync_batch_mixed_happy_path(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
) -> None:
    reminder = _reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
    )
    client_id = str(uuid4())
    token = elderly_token(elderly_user.id)

    response = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "gate2-device",
            "items": [
                {
                    "type": "game_session",
                    "payload": _game_session_payload(client_id),
                },
                {
                    "type": "reminder_ack",
                    "payload": {"reminder_id": str(reminder.id)},
                },
            ],
        },
    )
    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
    assert results[0]["status"] == "ok"
    assert results[1]["status"] == "ok"


def test_sync_batch_rejects_foreign_reminder_ack(
    client: TestClient,
    db_session: Session,
    elderly_user,
    other_elderly_user,
    caregiver,
) -> None:
    foreign = _reminder(
        db_session,
        user_id=other_elderly_user.id,
        caregiver_id=caregiver.id,
    )
    token = elderly_token(elderly_user.id)
    response = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "gate2-device",
            "items": [
                {
                    "type": "reminder_ack",
                    "payload": {"reminder_id": str(foreign.id)},
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["results"][0]["status"] == "error"

    db_session.refresh(foreign)
    assert foreign.last_acknowledged_at is None
