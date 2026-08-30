import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship as orm_relationship

from app.models.base import Base


class CaregiverUserLink(Base):
    __tablename__ = "caregiver_user_links"
    __table_args__ = (
        Index("ix_caregiver_user_links_caregiver_id", "caregiver_id"),
        Index("ix_caregiver_user_links_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    caregiver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("caregivers.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    relationship_label: Mapped[str] = mapped_column(
        "relationship", Text, nullable=False
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    caregiver = orm_relationship("Caregiver", back_populates="links")
    user = orm_relationship("User", back_populates="links")
