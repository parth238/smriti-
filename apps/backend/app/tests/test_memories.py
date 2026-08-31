from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.core.errors import ValidationError
from app.services.memories import create_memory_item


def test_create_memory_requires_english_title() -> None:
    db = MagicMock()
    with pytest.raises(ValidationError):
        create_memory_item(
            db,
            user_id=uuid4(),
            caregiver_id=uuid4(),
            media_url="https://example.com/a.jpg",
            media_type="photo",
            category="personal",
            title={},
            description=None,
            people_tagged=None,
            year=None,
            location=None,
            prompt_text=None,
        )
