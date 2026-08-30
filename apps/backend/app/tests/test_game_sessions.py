from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.core.errors import NotFoundError, ValidationError
from app.services.game_sessions import create_game_session


def _game():
    game = MagicMock()
    game.id = uuid4()
    return game


def test_create_session_idempotent_on_client_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    existing = MagicMock()
    existing.id = uuid4()
    existing.game_id = uuid4()
    existing.synced_at = datetime.now(timezone.utc)

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = existing

    monkeypatch.setattr(
        "app.services.game_sessions._recommended_difficulty",
        lambda *_args, **_kwargs: 3,
    )

    client_id = uuid4()
    session, nxt, created = create_game_session(
        db,
        user_id=uuid4(),
        game_id=existing.game_id,
        game_type=None,
        difficulty=3,
        accuracy=80,
        reaction_time_ms=900,
        errors=0,
        hints_used=0,
        session_duration_sec=120,
        completed_or_quit="completed",
        client_generated_id=client_id,
        played_at=datetime.now(timezone.utc),
    )
    assert session is existing
    assert created is False
    assert nxt == 3
    db.add.assert_not_called()


def test_create_session_validates_accuracy(monkeypatch: pytest.MonkeyPatch) -> None:
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    game = _game()
    monkeypatch.setattr(
        "app.services.game_sessions.get_game_by_id",
        lambda *_a, **_k: game,
    )
    with pytest.raises(ValidationError):
        create_game_session(
            db,
            user_id=uuid4(),
            game_id=game.id,
            game_type=None,
            difficulty=3,
            accuracy=140,
            reaction_time_ms=900,
            errors=0,
            hints_used=0,
            session_duration_sec=120,
            completed_or_quit="completed",
            client_generated_id=uuid4(),
            played_at=datetime.now(timezone.utc),
        )


def test_create_session_missing_game(monkeypatch: pytest.MonkeyPatch) -> None:
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    monkeypatch.setattr(
        "app.services.game_sessions.get_game_by_id",
        lambda *_a, **_k: None,
    )
    monkeypatch.setattr(
        "app.services.game_sessions.get_game_by_type",
        lambda *_a, **_k: None,
    )
    with pytest.raises(NotFoundError):
        create_game_session(
            db,
            user_id=uuid4(),
            game_id=None,
            game_type="unknown",
            difficulty=3,
            accuracy=80,
            reaction_time_ms=900,
            errors=0,
            hints_used=0,
            session_duration_sec=120,
            completed_or_quit="completed",
            client_generated_id=uuid4(),
            played_at=datetime.now(timezone.utc),
        )


def test_create_session_persists(monkeypatch: pytest.MonkeyPatch) -> None:
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    game = _game()
    monkeypatch.setattr(
        "app.services.game_sessions.get_game_by_type",
        lambda *_a, **_k: game,
    )
    monkeypatch.setattr(
        "app.services.game_sessions._recommended_difficulty",
        lambda *_a, **_k: 4,
    )

    def refresh(obj: object) -> None:
        session = obj
        session.id = uuid4()  # type: ignore[attr-defined]
        session.synced_at = datetime.now(timezone.utc)  # type: ignore[attr-defined]
        session.accuracy = Decimal("88.00")  # type: ignore[attr-defined]

    db.refresh.side_effect = refresh

    session, nxt, created = create_game_session(
        db,
        user_id=uuid4(),
        game_id=None,
        game_type="memory_match",
        difficulty=3,
        accuracy=88,
        reaction_time_ms=850,
        errors=1,
        hints_used=0,
        session_duration_sec=100,
        completed_or_quit="completed",
        client_generated_id=uuid4(),
        played_at=datetime.now(timezone.utc),
    )
    assert created is True
    assert nxt == 4
    db.add.assert_called_once()
    db.commit.assert_called_once()
    assert session.game_id == game.id
