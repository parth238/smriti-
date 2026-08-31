from unittest.mock import MagicMock
from uuid import uuid4

from app.services.sync_batch import process_batch


def test_process_batch_unknown_type() -> None:
    db = MagicMock()
    db.refresh.side_effect = lambda obj: setattr(obj, "id", uuid4())
    batch_id, results = process_batch(
        db,
        user_id=uuid4(),
        device_id="device-1",
        items=[{"type": "unknown", "payload": {}}],
    )
    assert batch_id is not None
    assert results[0]["status"] == "error"


def test_process_batch_missing_client_id() -> None:
    db = MagicMock()
    db.refresh.side_effect = lambda obj: setattr(obj, "id", uuid4())
    _, results = process_batch(
        db,
        user_id=uuid4(),
        device_id="device-1",
        items=[{"type": "game_session", "payload": {}}],
    )
    assert results[0]["status"] == "error"
