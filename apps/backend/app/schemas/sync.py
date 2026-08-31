from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SyncBatchItem(BaseModel):
    type: str
    payload: dict[str, Any]


class SyncBatchRequest(BaseModel):
    device_id: str = Field(min_length=1, max_length=128)
    items: list[SyncBatchItem] = Field(min_length=1, max_length=50)


class SyncBatchResult(BaseModel):
    index: int
    type: str
    status: str
    id: UUID | None = None
    error: str | None = None


class SyncBatchResponse(BaseModel):
    batch_id: UUID
    results: list[SyncBatchResult]


class SyncStatusResponse(BaseModel):
    reminders: list[dict[str, Any]]
    memories: list[dict[str, Any]]
    since: datetime | None
