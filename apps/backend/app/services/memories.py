"""Memory items and cultural pack."""

from __future__ import annotations

import json
import mimetypes
import uuid
from datetime import datetime
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError
from app.models.memory_item import MemoryItem

REPO_ROOT = Path(__file__).resolve().parents[4]
CONTENT_PACKS = REPO_ROOT / "packages" / "content-packs"
ALLOWED_MEDIA = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_CATEGORIES = {"family", "cultural", "personal"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

IMAGE_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": (b"RIFF",),
}


def _content_matches_media(content: bytes, media_type: str) -> bool:
    signatures = IMAGE_SIGNATURES.get(media_type)
    if not signatures:
        return False
    if media_type == "image/webp":
        return content.startswith(b"RIFF") and content[8:12] == b"WEBP"
    return any(content.startswith(sig) for sig in signatures)


PACK_LANGUAGE_MAP = {
    "as": "assamese",
    "assamese": "assamese",
    "en": "english",
    "english": "english",
    "mni": "manipuri",
    "manipuri": "manipuri",
    "hi": "hindi",
    "hindi": "hindi",
}


def list_memory_items(
    db: Session,
    *,
    user_id: UUID | None = None,
    category: str | None = None,
) -> list[MemoryItem]:
    query = db.query(MemoryItem)
    if user_id is not None:
        query = query.filter(MemoryItem.user_id == user_id)
    if category:
        query = query.filter(MemoryItem.category == category)
    return query.order_by(MemoryItem.created_at.desc()).all()


def get_memory_item(db: Session, item_id: UUID) -> MemoryItem:
    item = db.query(MemoryItem).filter(MemoryItem.id == item_id).first()
    if item is None:
        raise NotFoundError("Memory item was not found")
    return item


def create_memory_item(
    db: Session,
    *,
    user_id: UUID,
    caregiver_id: UUID,
    media_url: str,
    media_type: str,
    category: str,
    title: dict[str, str],
    description: str | None,
    people_tagged: list[str] | None,
    year: int | None,
    location: str | None,
    prompt_text: dict[str, str] | None,
) -> MemoryItem:
    if not title.get("en"):
        raise ValidationError("title.en is required", field="title")
    if category not in ALLOWED_CATEGORIES:
        raise ValidationError("category is not supported", field="category")
    item = MemoryItem(
        user_id=user_id,
        uploaded_by_caregiver_id=caregiver_id,
        media_url=media_url,
        media_type=media_type,
        category=category,
        title=title,
        description=description,
        people_tagged=people_tagged,
        year=year,
        location=location,
        prompt_text=prompt_text,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_memory_item(
    db: Session,
    item: MemoryItem,
    *,
    title: dict[str, str] | None = None,
    description: str | None = None,
    people_tagged: list[str] | None = None,
    year: int | None = None,
    location: str | None = None,
    prompt_text: dict[str, str] | None = None,
) -> MemoryItem:
    if title is not None:
        if not title.get("en"):
            raise ValidationError("title.en is required", field="title")
        item.title = title
    if description is not None:
        item.description = description
    if people_tagged is not None:
        item.people_tagged = people_tagged
    if year is not None:
        item.year = year
    if location is not None:
        item.location = location
    if prompt_text is not None:
        item.prompt_text = prompt_text
    db.commit()
    db.refresh(item)
    return item


def delete_memory_item(db: Session, item: MemoryItem) -> None:
    db.delete(item)
    db.commit()


async def save_upload(file: UploadFile, *, user_id: UUID) -> tuple[str, str]:
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValidationError("Image must be 5 MB or smaller", field="file")
    if not content:
        raise ValidationError("Upload file is empty", field="file")
    media_type = (
        file.content_type
        or mimetypes.guess_type(file.filename or "")[0]
        or "image/jpeg"
    )
    if media_type not in ALLOWED_MEDIA:
        raise ValidationError("Only image uploads are supported", field="file")
    if not _content_matches_media(content, media_type):
        raise ValidationError("File content does not match image type", field="file")
    ext = Path(file.filename or "photo.jpg").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"
    upload_dir = Path(settings.upload_dir) / "memories" / str(user_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4()}{ext}"
    path = upload_dir / name
    path.write_bytes(content)
    return f"/uploads/memories/{user_id}/{name}", media_type


def load_cultural_pack(language: str) -> dict:
    folder = PACK_LANGUAGE_MAP.get(language.lower(), "english")
    path = CONTENT_PACKS / folder / "cultural-media.json"
    if not path.is_file():
        raise NotFoundError("Cultural pack was not found")
    return json.loads(path.read_text(encoding="utf-8"))


def memories_changed_since(
    db: Session,
    user_id: UUID,
    since: datetime,
    *,
    until: datetime | None = None,
) -> list[MemoryItem]:
    query = db.query(MemoryItem).filter(
        MemoryItem.user_id == user_id,
        MemoryItem.created_at >= since,
    )
    if until is not None:
        query = query.filter(MemoryItem.created_at <= until)
    return query.order_by(MemoryItem.created_at.asc()).all()
