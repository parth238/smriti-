"""HTTP tests for cross-user game session idempotency ownership."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.game_session import GameSession
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


def test_sync_batch_rejects_cross_user_game_session_collision(
    client: TestClient,
    db_session: Session,
    elderly_user,
    other_elderly_user,
) -> None:
    client_id = str(uuid4())
    first_token = elderly_token(elderly_user.id)
    second_token = elderly_token(other_elderly_user.id)

    first = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {first_token}"},
        json={
            "device_id": "gate3a-device",
            "items": [
                {"type": "game_session", "payload": _game_session_payload(client_id)}
            ],
        },
    )
    assert first.status_code == 200
    assert first.json()["results"][0]["status"] == "ok"
    first_session_id = first.json()["results"][0]["id"]

    second = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {second_token}"},
        json={
            "device_id": "gate3a-device",
            "items": [
                {"type": "game_session", "payload": _game_session_payload(client_id)}
            ],
        },
    )
    assert second.status_code == 200
    result = second.json()["results"][0]
    assert result["status"] == "error"
    assert result["id"] is None
    assert str(first_session_id) not in (result.get("error") or "")

    rows = (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(client_id))
        .all()
    )
    assert len(rows) == 1
    assert rows[0].user_id == elderly_user.id


def test_sync_batch_cross_user_collision_continues_other_items(
    client: TestClient,
    db_session: Session,
    elderly_user,
    other_elderly_user,
    caregiver,
) -> None:
    from app.models.reminder import Reminder

    shared_client_id = str(uuid4())
    own_client_id = str(uuid4())
    first_token = elderly_token(elderly_user.id)
    second_token = elderly_token(other_elderly_user.id)

    client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {first_token}"},
        json={
            "device_id": "gate3a-device",
            "items": [
                {
                    "type": "game_session",
                    "payload": _game_session_payload(shared_client_id),
                }
            ],
        },
    )

    reminder = Reminder(
        user_id=other_elderly_user.id,
        created_by_caregiver_id=caregiver.id,
        type="medication",
        title={"en": "Water"},
        scheduled_time=datetime.now(timezone.utc),
        recurrence_rule=None,
        is_active=True,
    )
    db_session.add(reminder)
    db_session.commit()
    db_session.refresh(reminder)

    response = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {second_token}"},
        json={
            "device_id": "gate3a-device",
            "items": [
                {
                    "type": "game_session",
                    "payload": _game_session_payload(shared_client_id),
                },
                {
                    "type": "game_session",
                    "payload": _game_session_payload(own_client_id),
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
    assert results[0]["status"] == "error"
    assert results[1]["status"] == "ok"
    assert results[2]["status"] == "ok"

    assert (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(own_client_id))
        .count()
        == 1
    )


def test_post_game_session_rejects_cross_user_client_id(
    client: TestClient,
    db_session: Session,
    elderly_user,
    other_elderly_user,
) -> None:
    client_id = str(uuid4())
    first_token = elderly_token(elderly_user.id)
    second_token = elderly_token(other_elderly_user.id)

    first = client.post(
        "/api/v1/game-sessions",
        headers={"Authorization": f"Bearer {first_token}"},
        json={
            "user_id": str(elderly_user.id),
            **_game_session_payload(client_id),
        },
    )
    assert first.status_code == 200
    first_session_id = first.json()["id"]

    second = client.post(
        "/api/v1/game-sessions",
        headers={"Authorization": f"Bearer {second_token}"},
        json={
            "user_id": str(other_elderly_user.id),
            **_game_session_payload(client_id),
        },
    )
    assert second.status_code == 409
    body = second.json()
    assert body["error"]["code"] == "CONFLICT"
    assert str(first_session_id) not in body["error"]["message"]

    rows = (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(client_id))
        .all()
    )
    assert len(rows) == 1
    assert rows[0].user_id == elderly_user.id


def test_post_game_session_same_user_replay_still_succeeds(
    client: TestClient,
    db_session: Session,
    elderly_user,
) -> None:
    client_id = str(uuid4())
    token = elderly_token(elderly_user.id)
    payload = {
        "user_id": str(elderly_user.id),
        **_game_session_payload(client_id),
    }
    headers = {"Authorization": f"Bearer {token}"}

    first = client.post("/api/v1/game-sessions", headers=headers, json=payload)
    second = client.post("/api/v1/game-sessions", headers=headers, json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(client_id))
        .count()
        == 1
    )
