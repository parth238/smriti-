"""Regression coverage for judge demo seeding against legacy catalog UUIDs."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.caregiver import Caregiver
from app.models.caregiver_user_link import CaregiverUserLink
from app.models.game import Game
from app.models.game_session import GameSession
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

    _run_core_seed(db_session)
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
    elderly = client.post(
        "/api/v1/auth/user/login",
        json={"phone": DEMO_ELDERLY_PHONE, "pin": DEMO_ELDERLY_PIN},
    )
    assert elderly.status_code == 200


def test_ensure_games_does_not_replace_legacy_memory_match_id(
    db_session: Session,
) -> None:
    """Document why the seed must resolve IDs instead of using MEMORY_MATCH_ID."""
    _insert_legacy_four_games(db_session)
    ensure_games(db_session)
    row = db_session.query(Game).filter(Game.game_type == "memory_match").one()
    assert row.id == LEGACY_MEMORY_MATCH_ID
    assert db_session.query(Game).count() == 7
