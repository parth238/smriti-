from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.core.errors import ValidationError
from app.services.reminders import create_reminder


def test_create_reminder_requires_english_title() -> None:
    db = MagicMock()
    with pytest.raises(ValidationError):
        create_reminder(
            db,
            user_id=uuid4(),
            caregiver_id=uuid4(),
            reminder_type="medicine",
            title={},
            scheduled_time=datetime.now(timezone.utc),
            recurrence_rule="once",
        )
