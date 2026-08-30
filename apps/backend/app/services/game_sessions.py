"""Idempotent game session create + history."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, ValidationError
from app.models.game_session import GameSession
from app.services.adaptive_difficulty import DEFAULT_DIFFICULTY, next_difficulty
from app.services.game_catalog import get_game_by_id, get_game_by_type


def create_game_session(
    db: Session,
    *,
    user_id: UUID,
    game_id: UUID | None,
    game_type: str | None,
    difficulty: int,
    accuracy: float,
    reaction_time_ms: int,
    errors: int,
    hints_used: int,
    session_duration_sec: int,
    completed_or_quit: str,
    client_generated_id: UUID,
    played_at: datetime,
) -> tuple[GameSession, int, bool]:
    """Create a session or return the existing one (idempotent).

    Returns (session, next_difficulty, created).
    """
    existing = (
        db.query(GameSession)
        .filter(GameSession.client_generated_id == client_generated_id)
        .first()
    )
    if existing is not None:
        nxt = _recommended_difficulty(db, user_id, existing.game_id)
        return existing, nxt, False

    game = None
    if game_id is not None:
        game = get_game_by_id(db, game_id)
    elif game_type:
        game = get_game_by_type(db, game_type)
    if game is None:
        raise NotFoundError("Game was not found")

    if completed_or_quit not in {"completed", "quit"}:
        raise ValidationError(
            "completed_or_quit must be completed or quit",
            field="completed_or_quit",
        )
    if not 0 <= accuracy <= 100:
        raise ValidationError("accuracy must be between 0 and 100", field="accuracy")
    if not 1 <= difficulty <= 5:
        raise ValidationError("difficulty must be between 1 and 5", field="difficulty")

    now = datetime.now(timezone.utc)
    session = GameSession(
        user_id=user_id,
        game_id=game.id,
        difficulty=difficulty,
        accuracy=Decimal(str(round(accuracy, 2))),
        reaction_time_ms=reaction_time_ms,
        errors=errors,
        hints_used=hints_used,
        session_duration_sec=session_duration_sec,
        completed_or_quit=completed_or_quit,
        client_generated_id=client_generated_id,
        synced_at=now,
        played_at=played_at,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    nxt = _recommended_difficulty(db, user_id, game.id)
    return session, nxt, True


def list_user_sessions(
    db: Session,
    user_id: UUID,
    *,
    limit: int = 50,
    game_type: str | None = None,
) -> list[GameSession]:
    query = db.query(GameSession).filter(GameSession.user_id == user_id)
    if game_type:
        game = get_game_by_type(db, game_type)
        if game is None:
            return []
        query = query.filter(GameSession.game_id == game.id)
    return (
        query.order_by(GameSession.played_at.desc())
        .limit(max(1, min(limit, 200)))
        .all()
    )


def _recommended_difficulty(db: Session, user_id: UUID, game_id: UUID) -> int:
    rows = (
        db.query(GameSession)
        .filter(GameSession.user_id == user_id, GameSession.game_id == game_id)
        .order_by(GameSession.played_at.asc())
        .all()
    )
    if not rows:
        return DEFAULT_DIFFICULTY
    accuracies = [float(row.accuracy) for row in rows]
    return next_difficulty(DEFAULT_DIFFICULTY, accuracies)
