from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.core.deps import verify_caregiver_linked, verify_user_access
from app.core.errors import AuthorizationError


def test_elderly_user_cannot_open_another_profile() -> None:
    self_id = uuid4()
    other_id = uuid4()
    with pytest.raises(AuthorizationError, match="your own"):
        verify_user_access(other_id, (self_id, "elderly_user"), None)


def test_caregiver_without_link_is_denied() -> None:
    caregiver_id = uuid4()
    user_id = uuid4()
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(AuthorizationError, match="not linked"):
        verify_caregiver_linked(user_id, caregiver_id, db)
