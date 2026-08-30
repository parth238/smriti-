from app.models import (
    Alert,
    Caregiver,
    Game,
    GameSession,
    MemoryItem,
    Reminder,
    User,
)


def test_model_table_names() -> None:
    assert User.__tablename__ == "users"
    assert Caregiver.__tablename__ == "caregivers"
    assert Game.__tablename__ == "games"
    assert GameSession.__tablename__ == "game_sessions"
    assert Reminder.__tablename__ == "reminders"
    assert MemoryItem.__tablename__ == "memory_items"
    assert Alert.__tablename__ == "alerts"


def test_user_has_consent_and_pin_fields() -> None:
    assert hasattr(User, "pin_hash")
    assert hasattr(User, "consent_given_by")
    assert hasattr(User, "consent_timestamp")
