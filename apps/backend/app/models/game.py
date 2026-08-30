import uuid

from sqlalchemy import Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    game_type: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    display_name: Mapped[dict] = mapped_column(JSONB, nullable=False)
    cognitive_domain: Mapped[str] = mapped_column(Text, nullable=False)
    min_difficulty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_difficulty: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
