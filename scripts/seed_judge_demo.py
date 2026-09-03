"""Seed linked demo accounts for SIH judging (idempotent).

Run from repo root after Postgres is up and migrations applied::

    cd apps/backend
    python -m venv .venv  # if needed
    source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
    pip install -r requirements.txt
    alembic upgrade head
    python ../../scripts/seed_judge_demo.py

Prints caregiver + elderly login credentials for the 10-minute demo loop.

Repeated runs leave existing judge accounts, links, reminders, catalog rows,
and demo sessions in place. Documented credentials are not reset.
"""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from io import BytesIO
from pathlib import Path

from PIL import Image, UnidentifiedImageError

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "apps" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.caregiver import Caregiver  # noqa: E402
from app.models.caregiver_user_link import CaregiverUserLink  # noqa: E402
from app.models.game_session import GameSession  # noqa: E402
from app.models.memory_item import MemoryItem  # noqa: E402
from app.models.reminder import Reminder  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.game_catalog import ensure_games, get_game_by_type  # noqa: E402
from app.services.reminders import create_reminder  # noqa: E402

# Demo session history length — keep the early-exit threshold in sync.
DEMO_SESSION_TARGET = 14

DEMO_CAREGIVER_PHONE = "9876543210"
DEMO_CAREGIVER_EMAIL = "demo@smriti.local"
DEMO_CAREGIVER_PASSWORD = "SmritiJudge2026"
DEMO_CAREGIVER_NAME = "Demo Caregiver"

DEMO_ELDERLY_PHONE = "9123456789"
DEMO_ELDERLY_PIN = "2468"
DEMO_ELDERLY_NAME = "Grandmother Demo"

DEMO_MEMORY_SOURCE = (
    REPO_ROOT
    / "apps"
    / "elderly-app"
    / "public"
    / "assets"
    / "memories"
    / "family-tea-garden.jpg"
)
DEMO_MEMORY_FILENAME = "demo-family.jpg"
DEMO_MEMORY_MEDIA_TYPE = "image/jpeg"
JPEG_MAGIC = b"\xff\xd8\xff"


def _load_demo_memory_image() -> bytes:
    """Load and fully decode the tracked JPEG before touching judge data."""
    try:
        content = DEMO_MEMORY_SOURCE.read_bytes()
    except OSError as exc:
        raise RuntimeError(
            f"Judge demo image is missing or unreadable: {DEMO_MEMORY_SOURCE}"
        ) from exc
    if DEMO_MEMORY_SOURCE.suffix.lower() not in {".jpg", ".jpeg"}:
        raise RuntimeError("Judge demo image must have a JPEG file extension")
    if not content.startswith(JPEG_MAGIC):
        raise RuntimeError("Judge demo image does not contain JPEG bytes")
    try:
        with Image.open(BytesIO(content)) as image:
            image_format = image.format
            dimensions = image.size
            image.verify()
    except (OSError, UnidentifiedImageError) as exc:
        raise RuntimeError("Judge demo image cannot be decoded") from exc
    if image_format != "JPEG":
        raise RuntimeError("Judge demo image extension and decoded format disagree")
    if dimensions[0] < 1 or dimensions[1] < 1:
        raise RuntimeError("Judge demo image has invalid dimensions")
    return content


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
    """Insert demo sessions using the *persisted* catalog row for memory_match.

    Fresh PostgreSQL databases receive four legacy game UUIDs from Alembic
    ``0001_initial``. ``ensure_games`` only inserts missing *types*, so the
    canonical ``MEMORY_MATCH_ID`` constant may never appear in ``games``.
    Sessions must therefore resolve ``game_id`` from the row that actually
    exists after catalog ensure — not from the Python constant alone.
    """
    ensure_games(db)
    memory_match = get_game_by_type(db, "memory_match")
    if memory_match is None:
        raise RuntimeError(
            "Game catalog is missing memory_match after ensure_games; "
            "cannot seed demo sessions"
        )
    game_id = memory_match.id

    existing = db.query(GameSession).filter(GameSession.user_id == user.id).count()
    if existing >= DEMO_SESSION_TARGET:
        return
    now = datetime.now(timezone.utc)
    accuracies = [72, 78, 80, 76, 82, 85, 79, 88, 84, 90, 83, 87, 81, 86]
    assert len(accuracies) == DEMO_SESSION_TARGET
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
            game_id=game_id,
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
    content = _load_demo_memory_image()
    media_url = f"/uploads/memories/{user.id}/{DEMO_MEMORY_FILENAME}"
    existing = (
        db.query(MemoryItem)
        .filter(MemoryItem.user_id == user.id, MemoryItem.media_url == media_url)
        .first()
    )

    upload_dir = Path(settings.upload_dir) / "memories" / str(user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    path = upload_dir / DEMO_MEMORY_FILENAME
    if not path.is_file() or path.read_bytes() != content:
        path.write_bytes(content)

    if existing is not None:
        if existing.media_type != DEMO_MEMORY_MEDIA_TYPE:
            existing.media_type = DEMO_MEMORY_MEDIA_TYPE
            db.commit()
        return

    item = MemoryItem(
        user_id=user.id,
        uploaded_by_caregiver_id=caregiver.id,
        media_url=media_url,
        media_type=DEMO_MEMORY_MEDIA_TYPE,
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


def seed_judge_demo(db) -> None:
    """Run the full judge demo seed against an open SQLAlchemy session.

    Order is intentional:

    1. Ensure the seven-game catalog (and any missing types) is persisted.
    2. Create caregiver / elderly / link.
    3. Seed reminders, then sessions that FK to catalog rows, then memory photo.

    Repeated runs are idempotent: existing judge accounts, links, reminders,
    catalog rows, and demo sessions are left in place. Credentials are not
    reset on a second run — the documented password and PIN keep working.
    """
    ensure_games(db)
    caregiver = _ensure_caregiver(db)
    user = _ensure_elderly(db, caregiver)
    _seed_reminders(db, user, caregiver)
    _seed_sessions(db, user)
    _seed_memory_photo(db, user, caregiver)


def main() -> None:
    db = SessionLocal()
    try:
        seed_judge_demo(db)
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
