from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GameSessionCreate(BaseModel):
    user_id: UUID
    game_id: UUID | None = None
    game_type: str | None = None
    difficulty: int = Field(ge=1, le=5)
    accuracy: float = Field(ge=0, le=100)
    reaction_time_ms: int = Field(ge=0)
    errors: int = Field(ge=0, default=0)
    hints_used: int = Field(ge=0, default=0)
    session_duration_sec: int = Field(ge=0)
    completed_or_quit: str
    client_generated_id: UUID
    played_at: datetime


class GameSessionResponse(BaseModel):
    id: UUID
    next_difficulty: int
    synced_at: datetime | None


class GameSessionRow(BaseModel):
    id: UUID
    game_id: UUID
    game_type: str | None = None
    game_label: str | None = None
    difficulty: int
    accuracy: float
    reaction_time_ms: int
    errors: int
    hints_used: int
    session_duration_sec: int
    completed_or_quit: str
    client_generated_id: UUID
    played_at: datetime
    synced_at: datetime | None = None


class GameCatalogItem(BaseModel):
    id: UUID
    game_type: str
    display_name: dict[str, str]
    cognitive_domain: str
    min_difficulty: int
    max_difficulty: int


class NextDifficultyResponse(BaseModel):
    game_type: str
    difficulty: int


class BaselineResponse(BaseModel):
    avg_accuracy: float | None
    avg_reaction_time_ms: float | None
    sessions_count: int
    note: str = (
        "Personal baseline from early play only. Not a population norm or diagnosis."
    )


class BaselineComparison(BaseModel):
    reaction_time_delta_pct: float | None = None
    accuracy_delta_pct: float | None = None
    note: str | None = None


class AnalyticsPeriodResponse(BaseModel):
    period: str
    avg_accuracy: float | None
    avg_reaction_time_ms: float | None
    completion_rate: float | None
    sessions_count: int
    baseline_comparison: BaselineComparison


class TrendPoint(BaseModel):
    day: str
    accuracy: float | None
    reaction_time_ms: float | None


class TrendResponse(BaseModel):
    metric: str
    days: int
    baseline_accuracy: float | None
    baseline_reaction_time_ms: float | None
    points: list[TrendPoint]
