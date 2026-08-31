from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MemoryTitle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    en: str
    as_: str | None = Field(default=None, alias="as")


class MemoryItemRow(BaseModel):
    id: UUID
    user_id: UUID | None
    media_url: str
    media_type: str
    category: str
    title: dict[str, str]
    description: str | None
    people_tagged: list[str] | None
    year: int | None
    location: str | None
    prompt_text: dict[str, str] | None
    created_at: datetime


class MemoryItemUpdate(BaseModel):
    title: MemoryTitle | None = None
    description: str | None = None
    people_tagged: list[str] | None = None
    year: int | None = Field(default=None, ge=1800, le=2100)
    location: str | None = None
    prompt_text: MemoryTitle | None = None
    category: str | None = None


class CulturalPackItem(BaseModel):
    id: str
    scene: str
    title_key: str
    prompt_key: str
    state: str
    source: str


class CulturalPackResponse(BaseModel):
    region: str
    language: str
    source: str
    items: list[CulturalPackItem]
