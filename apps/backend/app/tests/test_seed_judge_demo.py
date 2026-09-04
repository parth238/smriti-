"""Regression coverage for judge demo seeding against legacy catalog UUIDs."""

from __future__ import annotations

import importlib.util
import sys
from datetime import datetime
from io import BytesIO
from pathlib import Path
from uuid import UUID

import pytest
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.models.caregiver import Caregiver
from app.models.caregiver_user_link import CaregiverUserLink
from app.models.game import Game
from app.models.game_session import GameSession
from app.models.memory_item import MemoryItem
from app.models.reminder import Reminder
from app.models.user import User
from app.services.game_catalog import GAME_SEEDS, MEMORY_MATCH_ID, ensure_games

# Import the repo-root seed module without installing it as a package.
_SEED_PATH = Path(__file__).resolve().parents[4] / "scripts" / "seed_judge_demo.py"
_SPEC = importlib.util.spec_from_file_location("seed_judge_demo", _SEED_PATH)
assert _SPEC is not None and _SPEC.loader is not None
_seed = importlib.util.module_from_spec(_SPEC)
sys.modules["seed_judge_demo"] = _seed
_SPEC.loader.exec_module(_seed)

_ensure_caregiver = _seed._ensure_caregiver
_ensure_elderly = _seed._ensure_elderly
_seed_reminders = _seed._seed_reminders
_seed_sessions = _seed._seed_sessions
_seed_memory_photo = _seed._seed_memory_photo
DEMO_MEMORY_FILENAME = _seed.DEMO_MEMORY_FILENAME
DEMO_MEMORY_MEDIA_TYPE = _seed.DEMO_MEMORY_MEDIA_TYPE
DEMO_MEMORY_SOURCE = _seed.DEMO_MEMORY_SOURCE
DEMO_CAREGIVER_PHONE = _seed.DEMO_CAREGIVER_PHONE
DEMO_CAREGIVER_EMAIL = _seed.DEMO_CAREGIVER_EMAIL
DEMO_CAREGIVER_PASSWORD = _seed.DEMO_CAREGIVER_PASSWORD
DEMO_ELDERLY_PHONE = _seed.DEMO_ELDERLY_PHONE
DEMO_ELDERLY_PIN = _seed.DEMO_ELDERLY_PIN
DEMO_SESSION_TARGET = _seed.DEMO_SESSION_TARGET

# Same legacy UUIDs Alembic 0001_initial inserts for the original four games.
LEGACY_MEMORY_MATCH_ID = UUID("11111111-1111-1111-1111-111111111111")
LEGACY_ATTENTION_ID = UUID("22222222-2222-2222-2222-222222222222")
LEGACY_SEQUENCING_ID = UUID("33333333-3333-3333-3333-333333333333")
LEGACY_PICTURE_NAMING_ID = UUID("44444444-4444-4444-4444-444444444444")


def _assert_decodable_jpeg(content: bytes) -> tuple[int, int]:
    assert content.startswith(b"\xff\xd8\xff")
    with Image.open(BytesIO(content)) as image:
        assert image.format == "JPEG"
        image.load()
        return image.size


def _insert_legacy_four_games(db: Session) -> None:
    """Simulate a freshly migrated Postgres catalog (non-canonical UUIDs)."""
    db.query(GameSession).delete()
    db.query(Game).delete()
    db.commit()
    for game_id, game_type, domain, name in (
        (LEGACY_MEMORY_MATCH_ID, "memory_match", "memory", "Memory Match"),
        (LEGACY_ATTENTION_ID, "attention_reaction", "attention", "Attention"),
        (LEGACY_SEQUENCING_ID, "sequencing", "executive_function", "Sequencing"),
        (
            LEGACY_PICTURE_NAMING_ID,
            "picture_naming",
            "language",
            "Picture Naming",
        ),
    ):
        db.add(
            Game(
                id=game_id,
                game_type=game_type,
                display_name={"en": name, "as": name},
                cognitive_domain=domain,
                min_difficulty=1,
                max_difficulty=5,
            )
        )
    db.commit()


def _run_core_seed(db: Session) -> User:
    """Catalog → accounts → reminders → sessions (SQLite-safe core path).

    Memory-photo seeding uses PostgreSQL ARRAY and is covered on the disposable
    Postgres verification in Gate 6C, not in this SQLite suite.
    """
    ensure_games(db)
    caregiver = _ensure_caregiver(db)
    user = _ensure_elderly(db, caregiver)
    _seed_reminders(db, user, caregiver)
    _seed_sessions(db, user)
    return user


def test_seed_resolves_persisted_catalog_id_not_canonical_constant(
    db_session: Session,
) -> None:
    """Sessions must FK to the row that exists, even when UUIDs diverge."""
    _insert_legacy_four_games(db_session)
    assert db_session.query(Game).filter(Game.id == MEMORY_MATCH_ID).first() is None

    _run_core_seed(db_session)

    memory_match = db_session.query(Game).filter(Game.game_type == "memory_match").one()
    assert memory_match.id == LEGACY_MEMORY_MATCH_ID
    assert memory_match.id != MEMORY_MATCH_ID

    sessions = db_session.query(GameSession).all()
    assert len(sessions) == DEMO_SESSION_TARGET
    assert all(row.game_id == LEGACY_MEMORY_MATCH_ID for row in sessions)
    assert all(
        db_session.query(Game).filter(Game.id == row.game_id).first() is not None
        for row in sessions
    )


def test_seed_ensures_seven_unique_games_before_sessions(
    db_session: Session,
) -> None:
    _insert_legacy_four_games(db_session)
    _run_core_seed(db_session)

    rows = db_session.query(Game).all()
    types = {row.game_type for row in rows}
    ids = {row.id for row in rows}
    assert len(rows) == 7
    assert len(types) == 7
    assert len(ids) == 7
    assert types == {seed["game_type"] for seed in GAME_SEEDS}


def test_seed_is_idempotent_and_credentials_survive_repeat(
    client: TestClient,
    db_session: Session,
) -> None:
    _insert_legacy_four_games(db_session)

    user = _run_core_seed(db_session)
    counts_first = {
        "games": db_session.query(Game).count(),
        "caregivers": db_session.query(Caregiver).count(),
        "users": db_session.query(User).count(),
        "links": db_session.query(CaregiverUserLink).count(),
        "reminders": db_session.query(Reminder).count(),
        "sessions": db_session.query(GameSession).count(),
    }

    _run_core_seed(db_session)
    counts_second = {
        "games": db_session.query(Game).count(),
        "caregivers": db_session.query(Caregiver).count(),
        "users": db_session.query(User).count(),
        "links": db_session.query(CaregiverUserLink).count(),
        "reminders": db_session.query(Reminder).count(),
        "sessions": db_session.query(GameSession).count(),
    }
    assert counts_second == counts_first
    assert counts_first["games"] == 7
    assert counts_first["caregivers"] == 1
    assert counts_first["users"] == 1
    assert counts_first["links"] == 1
    assert counts_first["reminders"] == 2
    assert counts_first["sessions"] == DEMO_SESSION_TARGET

    seeded_reminders = db_session.query(Reminder).order_by(Reminder.created_at).all()
    assert {row.title["en"] for row in seeded_reminders} == {
        "Evening medicine",
        "A glass of water",
    }
    assert all(row.scheduled_time is not None for row in seeded_reminders)

    cg_phone = client.post(
        "/api/v1/auth/caregiver/login",
        json={
            "phone_or_email": DEMO_CAREGIVER_PHONE,
            "password": DEMO_CAREGIVER_PASSWORD,
        },
    )
    assert cg_phone.status_code == 200
    cg_email = client.post(
        "/api/v1/auth/caregiver/login",
        json={
            "phone_or_email": DEMO_CAREGIVER_EMAIL,
            "password": DEMO_CAREGIVER_PASSWORD,
        },
    )
    assert cg_email.status_code == 200
    caregiver_headers = {"Authorization": f"Bearer {cg_email.json()['access_token']}"}
    patients = client.get("/api/v1/me/patients", headers=caregiver_headers)
    assert patients.status_code == 200
    assert patients.json() == [
        {
            "user_id": str(user.id),
            "full_name": "Grandmother Demo",
            "preferred_language": "as",
            "is_primary": True,
        }
    ]

    reminder_response = client.get(
        f"/api/v1/users/{patients.json()[0]['user_id']}/reminders",
        headers=caregiver_headers,
    )
    assert reminder_response.status_code == 200
    serialized = reminder_response.json()
    assert len(serialized) == 2
    assert {row["title"]["en"] for row in serialized} == {
        "Evening medicine",
        "A glass of water",
    }
    parsed_schedules = [
        datetime.fromisoformat(row["scheduled_time"]) for row in serialized
    ]
    assert len(parsed_schedules) == 2

    elderly = client.post(
        "/api/v1/auth/user/login",
        json={"phone": DEMO_ELDERLY_PHONE, "pin": DEMO_ELDERLY_PIN},
    )
    assert elderly.status_code == 200


def test_demo_memory_source_is_a_decodable_jpeg() -> None:
    assert DEMO_MEMORY_SOURCE.suffix == ".jpg"
    assert _assert_decodable_jpeg(DEMO_MEMORY_SOURCE.read_bytes()) == (720, 480)


def test_memory_photo_seed_repairs_file_without_duplicates_or_collateral_changes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, db_session: Session
) -> None:
    caregiver = _ensure_caregiver(db_session)
    user = _ensure_elderly(db_session, caregiver)
    monkeypatch.setattr(_seed.settings, "upload_dir", str(tmp_path))

    destination = tmp_path / "memories" / str(user.id) / DEMO_MEMORY_FILENAME
    destination.parent.mkdir(parents=True)
    destination.write_bytes(b"\xff\xd8\xffcorrupt")
    unrelated = destination.parent / "unrelated-user-upload.jpg"
    unrelated.write_bytes(b"leave-this-file-alone")

    media_url = f"/uploads/memories/{user.id}/{DEMO_MEMORY_FILENAME}"
    existing = MemoryItem(
        user_id=user.id,
        uploaded_by_caregiver_id=caregiver.id,
        media_url=media_url,
        media_type=DEMO_MEMORY_MEDIA_TYPE,
        category="family",
        title={"en": "Family at the tea garden"},
        description="A quiet afternoon together.",
        people_tagged=None,
        year=1985,
        location="Jorhat, Assam",
        prompt_text={"en": "Do you remember this day?"},
    )
    db_session.add(existing)
    db_session.commit()

    _seed_memory_photo(db_session, user, caregiver)
    first = db_session.query(MemoryItem).filter(MemoryItem.user_id == user.id).one()
    assert first.media_url == media_url
    assert first.media_type == DEMO_MEMORY_MEDIA_TYPE
    assert _assert_decodable_jpeg(destination.read_bytes()) == (720, 480)

    destination.write_bytes(b"\xff\xd8\xffcorrupt-again")
    _seed_memory_photo(db_session, user, caregiver)

    assert (
        db_session.query(MemoryItem).filter(MemoryItem.user_id == user.id).count() == 1
    )
    assert _assert_decodable_jpeg(destination.read_bytes()) == (720, 480)
    assert unrelated.read_bytes() == b"leave-this-file-alone"

    static_app = FastAPI()
    static_app.mount("/uploads", StaticFiles(directory=tmp_path), name="uploads")
    with TestClient(static_app) as static_client:
        response = static_client.get(first.media_url)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert response.content
    assert _assert_decodable_jpeg(response.content) == (720, 480)


def test_memory_photo_seed_fails_loudly_for_missing_source(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, db_session: Session
) -> None:
    caregiver = _ensure_caregiver(db_session)
    user = _ensure_elderly(db_session, caregiver)
    monkeypatch.setattr(_seed, "DEMO_MEMORY_SOURCE", tmp_path / "missing.jpg")

    with pytest.raises(RuntimeError, match="missing or unreadable"):
        _seed_memory_photo(db_session, user, caregiver)


def test_memory_photo_seed_fails_loudly_for_invalid_source(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, db_session: Session
) -> None:
    caregiver = _ensure_caregiver(db_session)
    user = _ensure_elderly(db_session, caregiver)
    invalid_source = tmp_path / "invalid.jpg"
    invalid_source.write_bytes(b"not-an-image")
    monkeypatch.setattr(_seed, "DEMO_MEMORY_SOURCE", invalid_source)

    with pytest.raises(RuntimeError, match="does not contain JPEG bytes"):
        _seed_memory_photo(db_session, user, caregiver)


def test_ensure_games_does_not_replace_legacy_memory_match_id(
    db_session: Session,
) -> None:
    """Document why the seed must resolve IDs instead of using MEMORY_MATCH_ID."""
    _insert_legacy_four_games(db_session)
    ensure_games(db_session)
    row = db_session.query(Game).filter(Game.game_type == "memory_match").one()
    assert row.id == LEGACY_MEMORY_MATCH_ID
    assert db_session.query(Game).count() == 7
