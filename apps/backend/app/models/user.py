import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    preferred_language: Mapped[str] = mapped_column(Text, nullable=False, default="as")
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    profile_photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    home_location_lat: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    home_location_lng: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    consent_given_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("caregivers.id"), nullable=True
    )
    consent_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    links = relationship("CaregiverUserLink", back_populates="user")
