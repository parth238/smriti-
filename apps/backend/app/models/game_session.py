import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class GameSession(Base):
    __tablename__ = "game_sessions"
    __table_args__ = (
        UniqueConstraint(
            "client_generated_id", name="uq_game_sessions_client_generated_id"
        ),
        Index("ix_game_sessions_user_id_played_at", "user_id", "played_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    game_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("games.id"), nullable=False
    )
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    reaction_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    errors: Mapped[int] = mapped_column(Integer, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, nullable=False)
    session_duration_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_or_quit: Mapped[str] = mapped_column(Text, nullable=False)
    client_generated_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    played_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
