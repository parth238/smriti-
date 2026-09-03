"""Game session create must resolve by game_type against persisted catalog rows."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.game_session import GameSession
from app.services.game_catalog import GAME_SEEDS, MEMORY_MATCH_ID, ensure_games
from app.tests.conftest import elderly_token

LEGACY_MEMORY_MATCH_ID = UUID("11111111-1111-1111-1111-111111111111")
LEGACY_ATTENTION_ID = UUID("22222222-2222-2222-2222-222222222222")
LEGACY_SEQUENCING_ID = UUID("33333333-3333-3333-3333-333333333333")
LEGACY_PICTURE_NAMING_ID = UUID("44444444-4444-4444-4444-444444444444")

LEGACY_FOUR = (
    (LEGACY_MEMORY_MATCH_ID, "memory_match", "memory", "Memory Match"),
    (LEGACY_ATTENTION_ID, "attention_reaction", "attention", "Attention"),
    (LEGACY_SEQUENCING_ID, "sequencing", "executive_function", "Sequencing"),
    (LEGACY_PICTURE_NAMING_ID, "picture_naming", "language", "Picture Naming"),
)


def _install_legacy_catalog(db: Session) -> None:
    """Simulate Alembic 0001 four-game seed with non-canonical UUIDs."""
    db.query(GameSession).delete()
    db.query(Game).delete()
    db.commit()
    for game_id, game_type, domain, name in LEGACY_FOUR:
        db.add(
            Game(
                id=game_id,
                game_type=game_type,
                display_name={"en": name, "as": name},
                cognitive_domain=domain,
                min_difficulty=1,
                max_difficulty=5,
            )
        )
    db.commit()
    ensure_games(db)


def _session_body(*, game_type: str | None = None, game_id: str | None = None) -> dict:
    body: dict = {
        "user_id": "",  # filled by caller
        "difficulty": 3,
        "accuracy": 81.0,
        "reaction_time_ms": 950,
        "errors": 0,
        "hints_used": 0,
        "session_duration_sec": 110,
        "completed_or_quit": "completed",
        "client_generated_id": str(uuid4()),
        "played_at": datetime.now(timezone.utc).isoformat(),
    }
    if game_type is not None:
        body["game_type"] = game_type
    if game_id is not None:
        body["game_id"] = game_id
    return body


def test_game_type_alone_resolves_legacy_persisted_catalog_row(
    client: TestClient,
    db_session: Session,
    elderly_user,
) -> None:
    _install_legacy_catalog(db_session)
    assert db_session.query(Game).filter(Game.id == MEMORY_MATCH_ID).first() is None

    token = elderly_token(elderly_user.id)
    for game_id, game_type, _domain, _name in LEGACY_FOUR:
        body = _session_body(game_type=game_type)
        body["user_id"] = str(elderly_user.id)
        response = client.post(
            "/api/v1/game-sessions",
            headers={"Authorization": f"Bearer {token}"},
            json=body,
        )
        assert response.status_code == 200, game_type
        row = (
            db_session.query(GameSession)
            .filter(
                GameSession.client_generated_id == UUID(body["client_generated_id"])
            )
            .one()
        )
        assert row.game_id == game_id


def test_game_type_alone_creates_session_for_all_seven_types(
    client: TestClient,
    db_session: Session,
    elderly_user,
) -> None:
    ensure_games(db_session)
    token = elderly_token(elderly_user.id)
    for seed in GAME_SEEDS:
        body = _session_body(game_type=seed["game_type"])
        body["user_id"] = str(elderly_user.id)
        response = client.post(
            "/api/v1/game-sessions",
            headers={"Authorization": f"Bearer {token}"},
            json=body,
        )
        assert response.status_code == 200, seed["game_type"]
        row = (
            db_session.query(GameSession)
            .filter(
                GameSession.client_generated_id == UUID(body["client_generated_id"])
            )
            .one()
        )
        persisted = (
            db_session.query(Game).filter(Game.game_type == seed["game_type"]).one()
        )
        assert row.game_id == persisted.id


def test_unknown_game_type_is_rejected(
    client: TestClient,
    elderly_user,
) -> None:
    token = elderly_token(elderly_user.id)
    body = _session_body(game_type="not_a_real_game")
    body["user_id"] = str(elderly_user.id)
    response = client.post(
        "/api/v1/game-sessions",
        headers={"Authorization": f"Bearer {token}"},
        json=body,
    )
    assert response.status_code == 404


def test_unknown_game_id_is_rejected_even_when_game_type_is_valid(
    client: TestClient,
    db_session: Session,
    elderly_user,
) -> None:
    """No silent fallback from invalid game_id to game_type."""
    _install_legacy_catalog(db_session)
    token = elderly_token(elderly_user.id)
    body = _session_body(
        game_type="memory_match",
        game_id=str(MEMORY_MATCH_ID),  # canonical constant absent after migration
    )
    body["user_id"] = str(elderly_user.id)
    response = client.post(
        "/api/v1/game-sessions",
        headers={"Authorization": f"Bearer {token}"},
        json=body,
    )
    assert response.status_code == 404
    assert (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(body["client_generated_id"]))
        .first()
        is None
    )


def test_sync_batch_game_type_only_against_legacy_catalog(
    client: TestClient,
    db_session: Session,
    elderly_user,
) -> None:
    _install_legacy_catalog(db_session)
    token = elderly_token(elderly_user.id)
    client_id = str(uuid4())
    response = client.post(
        "/api/v1/sync/batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "gate6c2-device",
            "items": [
                {
                    "type": "game_session",
                    "payload": {
                        "client_generated_id": client_id,
                        "game_type": "memory_match",
                        "difficulty": 3,
                        "accuracy": 77.0,
                        "reaction_time_ms": 1000,
                        "errors": 1,
                        "hints_used": 0,
                        "session_duration_sec": 90,
                        "completed_or_quit": "completed",
                        "played_at": datetime.now(timezone.utc).isoformat(),
                    },
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["results"][0]["status"] == "ok"
    row = (
        db_session.query(GameSession)
        .filter(GameSession.client_generated_id == UUID(client_id))
        .one()
    )
    assert row.game_id == LEGACY_MEMORY_MATCH_ID
