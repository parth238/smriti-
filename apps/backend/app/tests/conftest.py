"""Shared fixtures for HTTP integration tests with an isolated SQLite database."""

from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password
from app.db.session import get_db
from app.main import app
from app.models import Base, Caregiver, CaregiverUserLink, User
from app.services.game_catalog import ensure_games


@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(type_, compiler, **kw):  # noqa: ARG001
    return "JSON"


@compiles(ARRAY, "sqlite")
def _compile_array_sqlite(type_, compiler, **kw):  # noqa: ARG001
    return "JSON"


@compiles(PGUUID, "sqlite")
def _compile_uuid_sqlite(type_, compiler, **kw):  # noqa: ARG001
    return "CHAR(36)"


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _sqlite_fk(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    ensure_games(session)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def elderly_token(user_id: UUID) -> str:
    return create_access_token(
        str(user_id),
        "elderly_user",
        expires_delta=timedelta(days=1),
    )


def caregiver_token(caregiver_id: UUID) -> str:
    return create_access_token(
        str(caregiver_id),
        "caregiver",
        expires_delta=timedelta(hours=1),
    )


@pytest.fixture()
def caregiver(db_session: Session) -> Caregiver:
    row = Caregiver(
        id=uuid4(),
        full_name="Test Caregiver",
        phone_number=f"9{uuid4().int % 10_000_000_000:010d}",
        email=f"cg-{uuid4()}@test.local",
        password_hash=hash_password("TestPass12345"),
    )
    db_session.add(row)
    db_session.commit()
    db_session.refresh(row)
    return row


@pytest.fixture()
def elderly_user(db_session: Session, caregiver: Caregiver) -> User:
    row = User(
        id=uuid4(),
        full_name="Test Elder",
        phone_number=f"8{uuid4().int % 10_000_000_000:010d}",
        preferred_language="as",
        pin_hash=hash_password("2468"),
        consent_given_by=caregiver.id,
        consent_timestamp=datetime.now(timezone.utc),
    )
    db_session.add(row)
    db_session.add(
        CaregiverUserLink(
            id=uuid4(),
            caregiver_id=caregiver.id,
            user_id=row.id,
            relationship_label="daughter",
            is_primary=True,
        )
    )
    db_session.commit()
    db_session.refresh(row)
    return row


@pytest.fixture()
def other_elderly_user(db_session: Session, caregiver: Caregiver) -> User:
    row = User(
        id=uuid4(),
        full_name="Other Elder",
        phone_number=f"7{uuid4().int % 10_000_000_000:010d}",
        preferred_language="en",
        pin_hash=hash_password("1357"),
        consent_given_by=caregiver.id,
        consent_timestamp=datetime.now(timezone.utc),
    )
    db_session.add(row)
    db_session.commit()
    db_session.refresh(row)
    return row
