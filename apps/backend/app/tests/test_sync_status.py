"""HTTP integration tests for GET /sync/status."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.memory_item import MemoryItem
from app.models.reminder import Reminder
from app.tests.conftest import caregiver_token, elderly_token


def _add_reminder(
    db: Session,
    *,
    user_id,
    caregiver_id,
    updated_at: datetime,
    title_en: str = "Take medicine",
) -> Reminder:
    reminder = Reminder(
        user_id=user_id,
        created_by_caregiver_id=caregiver_id,
        type="medication",
        title={"en": title_en, "as": title_en},
        scheduled_time=updated_at + timedelta(hours=1),
        recurrence_rule=None,
        is_active=True,
    )
    db.add(reminder)
    db.flush()
    reminder.updated_at = updated_at
    db.commit()
    db.refresh(reminder)
    return reminder


def _add_memory(
    db: Session,
    *,
    user_id,
    caregiver_id,
    created_at: datetime,
    title_en: str = "Family photo",
) -> MemoryItem:
    item = MemoryItem(
        user_id=user_id,
        uploaded_by_caregiver_id=caregiver_id,
        media_url="/uploads/memories/test.jpg",
        media_type="image/jpeg",
        category="family",
        title={"en": title_en, "as": title_en},
    )
    db.add(item)
    db.flush()
    item.created_at = created_at
    db.commit()
    db.refresh(item)
    return item


def test_sync_status_requires_authentication(client: TestClient, elderly_user) -> None:
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(elderly_user.id)},
    )
    assert response.status_code == 401


def test_sync_status_rejects_unrelated_elderly_user(
    client: TestClient,
    elderly_user,
    other_elderly_user,
) -> None:
    token = elderly_token(elderly_user.id)
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(other_elderly_user.id)},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_sync_status_allows_linked_caregiver(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
) -> None:
    since = datetime(2026, 1, 1, tzinfo=timezone.utc)
    _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=since + timedelta(hours=2),
    )
    token = caregiver_token(caregiver.id)
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(elderly_user.id), "since": since.isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["reminders"]) == 1


def test_sync_status_filters_by_since_and_includes_new_records(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    window_end = datetime(2026, 3, 10, 12, 0, 0, tzinfo=timezone.utc)
    since = datetime(2026, 3, 10, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr("app.api.v1.sync.database_utc_now", lambda _db: window_end)

    old_reminder = _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=since - timedelta(hours=1),
        title_en="Old reminder",
    )
    new_reminder = _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=since + timedelta(minutes=30),
        title_en="New reminder",
    )
    old_memory = _add_memory(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        created_at=since - timedelta(minutes=5),
        title_en="Old memory",
    )
    new_memory = _add_memory(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        created_at=since + timedelta(minutes=15),
        title_en="New memory",
    )

    token = elderly_token(elderly_user.id)
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(elderly_user.id), "since": since.isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()

    reminder_ids = {row["id"] for row in body["reminders"]}
    memory_ids = {row["id"] for row in body["memories"]}
    assert str(new_reminder.id) in reminder_ids
    assert str(old_reminder.id) not in reminder_ids
    assert str(new_memory.id) in memory_ids
    assert str(old_memory.id) not in memory_ids


def test_sync_status_response_contract(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    window_end = datetime(2026, 4, 1, 15, 30, 0, tzinfo=timezone.utc)
    since = datetime(2026, 4, 1, 15, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr("app.api.v1.sync.database_utc_now", lambda _db: window_end)

    ack_time = since + timedelta(minutes=10)
    reminder = _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=ack_time,
    )
    reminder.last_acknowledged_at = ack_time
    reminder.updated_at = ack_time
    db_session.commit()
    db_session.refresh(reminder)

    memory = _add_memory(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        created_at=since + timedelta(minutes=5),
    )

    token = elderly_token(elderly_user.id)
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(elderly_user.id), "since": since.isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()

    assert body["since"] is not None
    assert "next_since" in body
    next_since = datetime.fromisoformat(body["next_since"].replace("Z", "+00:00"))
    assert next_since.tzinfo is not None
    assert next_since >= since
    assert next_since == window_end

    assert "reminders" in body
    assert "memories" in body

    reminder_row = next(
        row for row in body["reminders"] if row["id"] == str(reminder.id)
    )
    assert reminder_row["type"] == reminder.type
    assert reminder_row["title"] == reminder.title
    assert reminder_row["scheduled_time"]
    assert reminder_row["is_active"] is True
    assert reminder_row["updated_at"]
    parsed_ack = datetime.fromisoformat(
        reminder_row["last_acknowledged_at"].replace("Z", "+00:00")
    )
    if parsed_ack.tzinfo is None:
        parsed_ack = parsed_ack.replace(tzinfo=timezone.utc)
    assert parsed_ack == ack_time

    memory_row = next(row for row in body["memories"] if row["id"] == str(memory.id))
    assert memory_row["media_url"] == memory.media_url
    assert memory_row["category"] == memory.category
    assert memory_row["created_at"]


def test_sync_status_excludes_records_after_window_end(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    window_end = datetime(2026, 5, 1, 9, 0, 0, tzinfo=timezone.utc)
    since = datetime(2026, 5, 1, 8, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr("app.api.v1.sync.database_utc_now", lambda _db: window_end)

    inside = _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=window_end,
        title_en="Inside window",
    )
    outside = _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=window_end + timedelta(seconds=1),
        title_en="Outside window",
    )

    token = elderly_token(elderly_user.id)
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(elderly_user.id), "since": since.isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    reminder_ids = {row["id"] for row in response.json()["reminders"]}
    assert str(inside.id) in reminder_ids
    assert str(outside.id) not in reminder_ids


def test_sync_status_inclusive_lower_boundary_is_safe_to_replay(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    since = datetime(2026, 6, 1, 8, 0, 0, tzinfo=timezone.utc)
    window_end = datetime(2026, 6, 1, 8, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr("app.api.v1.sync.database_utc_now", lambda _db: window_end)

    reminder = _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=since,
        title_en="Boundary reminder",
    )

    token = elderly_token(elderly_user.id)
    params = {"user_id": str(elderly_user.id), "since": since.isoformat()}
    headers = {"Authorization": f"Bearer {token}"}

    first = client.get("/api/v1/sync/status", params=params, headers=headers)
    second = client.get("/api/v1/sync/status", params=params, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    first_ids = {row["id"] for row in first.json()["reminders"]}
    second_ids = {row["id"] for row in second.json()["reminders"]}
    assert str(reminder.id) in first_ids
    assert str(reminder.id) in second_ids


def test_next_since_uses_database_session_clock(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sync_window

    calls: list[Session] = []
    captured_ts: list[datetime] = []
    real_database_utc_now = sync_window.database_utc_now

    def tracking_database_utc_now(db: Session) -> datetime:
        calls.append(db)
        ts = real_database_utc_now(db)
        captured_ts.append(ts)
        return ts

    monkeypatch.setattr("app.api.v1.sync.database_utc_now", tracking_database_utc_now)

    since = datetime(2026, 1, 1, tzinfo=timezone.utc)
    _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=since + timedelta(hours=1),
    )

    token = elderly_token(elderly_user.id)
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(elderly_user.id), "since": since.isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(calls) == 1
    assert calls[0] is db_session

    body = response.json()
    next_since = datetime.fromisoformat(body["next_since"].replace("Z", "+00:00"))
    if next_since.tzinfo is None:
        next_since = next_since.replace(tzinfo=timezone.utc)
    assert next_since == captured_ts[0]


def test_single_window_timestamp_bounds_both_queries(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    window_end = datetime(2026, 7, 1, 12, 0, 0, tzinfo=timezone.utc)
    captured_until: list[datetime | None] = []

    from app.services import memories as memories_service
    from app.services import reminders as reminders_service

    original_reminders = reminders_service.reminders_changed_since
    original_memories = memories_service.memories_changed_since

    def spy_reminders(db, user_id, since, *, until=None):
        captured_until.append(until)
        return original_reminders(db, user_id, since, until=until)

    def spy_memories(db, user_id, since, *, until=None):
        captured_until.append(until)
        return original_memories(db, user_id, since, until=until)

    monkeypatch.setattr("app.api.v1.sync.database_utc_now", lambda _db: window_end)
    monkeypatch.setattr("app.api.v1.sync.reminders_changed_since", spy_reminders)
    monkeypatch.setattr("app.api.v1.sync.memories_changed_since", spy_memories)

    since = datetime(2026, 7, 1, 8, 0, 0, tzinfo=timezone.utc)
    token = elderly_token(elderly_user.id)
    response = client.get(
        "/api/v1/sync/status",
        params={"user_id": str(elderly_user.id), "since": since.isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert captured_until == [window_end, window_end]
    next_since = datetime.fromisoformat(
        response.json()["next_since"].replace("Z", "+00:00")
    )
    if next_since.tzinfo is None:
        next_since = next_since.replace(tzinfo=timezone.utc)
    assert next_since == window_end


def test_normalize_db_timestamp_handles_naive_and_aware() -> None:
    from app.services.sync_window import normalize_db_timestamp

    naive = datetime(2026, 1, 1, 12, 0, 0)
    naive_utc = normalize_db_timestamp(naive)
    assert naive_utc.tzinfo == timezone.utc
    assert naive_utc.hour == 12

    aware = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone(timedelta(hours=5)))
    aware_utc = normalize_db_timestamp(aware)
    assert aware_utc.tzinfo == timezone.utc
    assert aware_utc.hour == 7


def test_database_utc_now_returns_timezone_aware_value(db_session: Session) -> None:
    from app.services.sync_window import database_utc_now

    ts = database_utc_now(db_session)
    assert ts.tzinfo is not None
    assert ts.tzinfo.utcoffset(ts) == timezone.utc.utcoffset(ts)


def test_acknowledgement_uses_database_time_and_appears_in_sync_status(
    client: TestClient,
    db_session: Session,
    elderly_user,
    caregiver,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services.reminders import acknowledge_reminder
    from app.services.sync_window import database_utc_now

    fixed = datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr("app.services.reminders.database_utc_now", lambda _db: fixed)

    reminder = _add_reminder(
        db_session,
        user_id=elderly_user.id,
        caregiver_id=caregiver.id,
        updated_at=datetime(2026, 8, 1, 8, 0, 0, tzinfo=timezone.utc),
    )

    updated = acknowledge_reminder(db_session, reminder.id, elderly_user.id)
    assert updated.last_acknowledged_at is not None
    assert updated.updated_at is not None
    if updated.last_acknowledged_at.tzinfo is None:
        assert updated.last_acknowledged_at.replace(tzinfo=timezone.utc) == fixed
    else:
        assert updated.last_acknowledged_at == fixed
    if updated.updated_at.tzinfo is None:
        assert updated.updated_at.replace(tzinfo=timezone.utc) == fixed
    else:
        assert updated.updated_at == fixed

    monkeypatch.setattr(
        "app.api.v1.sync.database_utc_now",
        lambda _db: fixed + timedelta(minutes=5),
    )
    token = elderly_token(elderly_user.id)
    response = client.get(
        "/api/v1/sync/status",
        params={
            "user_id": str(elderly_user.id),
            "since": datetime(2026, 8, 1, 9, 0, 0, tzinfo=timezone.utc).isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    reminder_ids = {row["id"] for row in response.json()["reminders"]}
    assert str(reminder.id) in reminder_ids
    assert database_utc_now(db_session).tzinfo is not None
