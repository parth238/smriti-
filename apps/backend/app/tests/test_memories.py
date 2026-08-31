from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.core.errors import ValidationError
from app.services.memories import create_memory_item, load_cultural_pack


def test_create_memory_requires_english_title() -> None:
    db = MagicMock()
    with pytest.raises(ValidationError):
        create_memory_item(
            db,
            user_id=uuid4(),
            caregiver_id=uuid4(),
            media_url="https://example.com/a.jpg",
            media_type="photo",
            category="family",
            title={},
            description=None,
            people_tagged=None,
            year=None,
            location=None,
            prompt_text=None,
        )


def test_create_memory_rejects_unknown_category() -> None:
    db = MagicMock()
    with pytest.raises(ValidationError):
        create_memory_item(
            db,
            user_id=uuid4(),
            caregiver_id=uuid4(),
            media_url="https://example.com/a.jpg",
            media_type="photo",
            category="unknown",
            title={"en": "Tea"},
            description=None,
            people_tagged=None,
            year=None,
            location=None,
            prompt_text=None,
        )


def test_load_assamese_cultural_pack() -> None:
    data = load_cultural_pack("as")
    assert data["language"] == "as"
    assert len(data["items"]) >= 4
    assert data["items"][0]["id"]


def test_load_manipuri_cultural_pack() -> None:
    data = load_cultural_pack("mni")
    assert data["language"] == "mni"
    assert any(item["state"] == "Manipur" for item in data["items"])


def test_load_cultural_pack_unknown_language_falls_back_to_english() -> None:
    data = load_cultural_pack("zz")
    assert data["language"] == "en"
