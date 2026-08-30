import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    game_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    period: Mapped[str] = mapped_column(Text, nullable=False)
    avg_accuracy: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    avg_reaction_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_rate: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    baseline_avg_accuracy: Mapped[Decimal | None] = mapped_column(
        Numeric, nullable=True
    )
    baseline_avg_reaction_time_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
