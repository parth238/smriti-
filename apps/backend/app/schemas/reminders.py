from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReminderTitle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    en: str
    as_: str | None = Field(default=None, alias="as")


class ReminderCreate(BaseModel):
    user_id: UUID
    type: str = Field(min_length=1, max_length=64)
    title: ReminderTitle
    scheduled_time: datetime
    recurrence_rule: str | None = None


class ReminderUpdate(BaseModel):
    type: str | None = None
    title: ReminderTitle | None = None
    scheduled_time: datetime | None = None
    recurrence_rule: str | None = None
    is_active: bool | None = None


class ReminderRow(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: dict[str, str]
    scheduled_time: datetime
    recurrence_rule: str | None
    is_active: bool
    last_acknowledged_at: datetime | None
    created_at: datetime


class ReminderAckResponse(BaseModel):
    id: UUID
    last_acknowledged_at: datetime


class NextReminderResponse(BaseModel):
    reminder: ReminderRow | None
