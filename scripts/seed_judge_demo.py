"""Seed linked demo accounts for SIH judging (idempotent).

Run from repo root after Postgres is up and migrations applied:

    cd apps/backend
    python -m venv .venv  # if needed
    .venv\Scripts\activate
    pip install -r requirements.txt
    alembic upgrade head
    python ../../scripts/seed_judge_demo.py

Prints caregiver + elderly login credentials for the 10-minute demo loop.
"""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "apps" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.caregiver import Caregiver  # noqa: E402
from app.models.caregiver_user_link import CaregiverUserLink  # noqa: E402
from app.models.game_session import GameSession  # noqa: E402
from app.models.memory_item import MemoryItem  # noqa: E402
from app.models.reminder import Reminder  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.game_catalog import ensure_games, MEMORY_MATCH_ID  # noqa: E402
from app.services.reminders import create_reminder  # noqa: E402

DEMO_CAREGIVER_PHONE = "9876543210"
DEMO_CAREGIVER_EMAIL = "demo@smriti.local"
DEMO_CAREGIVER_PASSWORD = "SmritiJudge2026"
DEMO_CAREGIVER_NAME = "Demo Caregiver"

DEMO_ELDERLY_PHONE = "9123456789"
DEMO_ELDERLY_PIN = "2468"
DEMO_ELDERLY_NAME = "Grandmother Demo"

# 1x1 JPEG for seeded family photo placeholder
MINI_JPEG = bytes(
    [
        0xFF,
        0xD8,
        0xFF,
        0xDB,
        0x00,
        0x43,
        0x00,
        0x08,
        0x06,
        0x06,
        0x07,
        0x06,
        0x05,
        0x08,
        0x07,
        0x07,
        0x07,
        0x09,
        0x09,
        0x08,
        0x0A,
        0x0C,
        0x14,
        0x0D,
        0x0C,
        0x0B,
        0x0B,
        0x0C,
        0x19,
        0x12,
        0x13,
        0x0F,
        0x14,
        0x1D,
        0x1A,
        0x1F,
        0x1E,
        0x1D,
        0x1A,
        0x1C,
        0x1C,
        0x20,
        0x24,
        0x2E,
        0x27,
        0x20,
        0x22,
        0x2C,
        0x23,
        0x1C,
        0x1C,
        0x28,
        0x37,
        0x29,
        0x2C,
        0x30,
        0x31,
        0x34,
        0x34,
        0x34,
        0x1F,
        0x27,
        0x39,
        0x3D,
        0x30,
        0x31,
        0x2F,
        0xFF,
        0xC0,
        0x00,
        0x0B,
        0x08,
        0x00,
        0x01,
        0x00,
        0x01,
        0x01,
        0x01,
        0x11,
        0x00,
        0xFF,
        0xC4,
        0x00,
        0x14,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x08,
        0xFF,
        0xC4,
        0x00,
        0x14,
        0x10,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0xFF,
        0xDA,
        0x00,
        0x08,
        0x01,
        0x01,
        0x00,
        0x00,
        0x3F,
        0x00,
        0x37,
        0xFF,
        0xD9,
    ]
)


def _ensure_caregiver(db) -> Caregiver:
    caregiver = (
        db.query(Caregiver)
        .filter(Caregiver.phone_number == DEMO_CAREGIVER_PHONE)
        .first()
    )
    if caregiver is None:
        caregiver = Caregiver(
            full_name=DEMO_CAREGIVER_NAME,
            phone_number=DEMO_CAREGIVER_PHONE,
            email=DEMO_CAREGIVER_EMAIL,
            password_hash=hash_password(DEMO_CAREGIVER_PASSWORD),
        )
        db.add(caregiver)
        db.commit()
        db.refresh(caregiver)
    return caregiver


def _ensure_elderly(db, caregiver: Caregiver) -> User:
    user = db.query(User).filter(User.phone_number == DEMO_ELDERLY_PHONE).first()
    if user is None:
        user = User(
            full_name=DEMO_ELDERLY_NAME,
            phone_number=DEMO_ELDERLY_PHONE,
            preferred_language="as",
            pin_hash=hash_password(DEMO_ELDERLY_PIN),
            consent_given_by=caregiver.id,
            consent_timestamp=datetime.now(timezone.utc),
        )
        db.add(user)
        db.flush()
        db.add(
            CaregiverUserLink(
                caregiver_id=caregiver.id,
                user_id=user.id,
                relationship_label="daughter",
                is_primary=True,
            )
        )
        db.commit()
        db.refresh(user)
    link = (
        db.query(CaregiverUserLink)
        .filter(
            CaregiverUserLink.caregiver_id == caregiver.id,
            CaregiverUserLink.user_id == user.id,
        )
        .first()
    )
    if link is None:
        db.add(
            CaregiverUserLink(
                caregiver_id=caregiver.id,
                user_id=user.id,
                relationship_label="daughter",
                is_primary=True,
            )
        )
        db.commit()
    return user


def _seed_reminders(db, user: User, caregiver: Caregiver) -> None:
    existing = db.query(Reminder).filter(Reminder.user_id == user.id).count()
    if existing > 0:
        return
    now = datetime.now(timezone.utc)
    evening = now.replace(hour=20, minute=0, second=0, microsecond=0)
    if evening <= now:
        evening += timedelta(days=1)
    morning = now.replace(hour=9, minute=0, second=0, microsecond=0)
    if morning <= now:
        morning += timedelta(days=1)
    create_reminder(
        db,
        user_id=user.id,
        caregiver_id=caregiver.id,
        reminder_type="medicine",
        title={"en": "Evening medicine", "as": "সন্ধ্যাৰ ঔষধ"},
        scheduled_time=evening,
        recurrence_rule="daily",
    )
    create_reminder(
        db,
        user_id=user.id,
        caregiver_id=caregiver.id,
        reminder_type="water",
        title={"en": "A glass of water", "as": "এটা গিলাচ পানী"},
        scheduled_time=morning,
        recurrence_rule="daily",
    )


def _seed_sessions(db, user: User) -> None:
    ensure_games(db)
    existing = db.query(GameSession).filter(GameSession.user_id == user.id).count()
    if existing >= 10:
        return
    now = datetime.now(timezone.utc)
    accuracies = [72, 78, 80, 76, 82, 85, 79, 88, 84, 90, 83, 87, 81, 86]
    for day_offset, accuracy in enumerate(accuracies):
        played_at = now - timedelta(days=len(accuracies) - day_offset - 1)
        client_id = uuid.uuid5(user.id, f"demo-session-{day_offset}")
        if (
            db.query(GameSession)
            .filter(GameSession.client_generated_id == client_id)
            .first()
        ):
            continue
        session = GameSession(
            user_id=user.id,
            game_id=MEMORY_MATCH_ID,
            difficulty=min(5, 2 + day_offset // 4),
            accuracy=Decimal(str(accuracy)),
            reaction_time_ms=1800 + day_offset * 40,
            errors=max(0, 3 - day_offset // 3),
            hints_used=0,
            session_duration_sec=120 + day_offset * 5,
            completed_or_quit="completed",
            client_generated_id=client_id,
            synced_at=played_at,
            played_at=played_at,
        )
        db.add(session)
    db.commit()


def _seed_memory_photo(db, user: User, caregiver: Caregiver) -> None:
    existing = (
        db.query(MemoryItem)
        .filter(MemoryItem.user_id == user.id, MemoryItem.category == "family")
        .first()
    )
    if existing is not None:
        return
    from app.core.config import settings  # noqa: E402

    upload_dir = Path(settings.upload_dir) / "memories" / str(user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = "demo-family.jpg"
    path = upload_dir / filename
    path.write_bytes(MINI_JPEG)
    media_url = f"/uploads/memories/{user.id}/{filename}"
    item = MemoryItem(
        user_id=user.id,
        uploaded_by_caregiver_id=caregiver.id,
        media_url=media_url,
        media_type="image/jpeg",
        category="family",
        title={"en": "Family at the tea garden", "as": "চাহ বাগিছাত পৰিয়াল"},
        description="A quiet afternoon together.",
        people_tagged=["family"],
        year=1985,
        location="Jorhat, Assam",
        prompt_text={
            "en": "Do you remember this day with your family?",
            "as": "পৰিয়ালৰ সৈতে এই দিনটো মনত পৰে নেকি?",
        },
    )
    db.add(item)
    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        caregiver = _ensure_caregiver(db)
        user = _ensure_elderly(db, caregiver)
        _seed_reminders(db, user, caregiver)
        _seed_sessions(db, user)
        _seed_memory_photo(db, user, caregiver)
    finally:
        db.close()

    print("Smriti judge demo seed complete.")
    print("")
    print("Caregiver dashboard (5174):")
    print(f"  phone or email: {DEMO_CAREGIVER_PHONE} or {DEMO_CAREGIVER_EMAIL}")
    print(f"  password: {DEMO_CAREGIVER_PASSWORD}")
    print("")
    print("Elderly app (5173):")
    print(f"  phone: {DEMO_ELDERLY_PHONE}")
    print(f"  PIN: {DEMO_ELDERLY_PIN}")
    print("")
    print("Demo loop: splash walk -> PIN -> one game -> caregiver chart updates.")


if __name__ == "__main__":
    main()
