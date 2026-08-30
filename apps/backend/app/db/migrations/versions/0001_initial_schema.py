"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "caregivers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("phone_number", sa.Text(), nullable=False, unique=True),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("phone_number", sa.Text(), nullable=True, unique=True),
        sa.Column("preferred_language", sa.Text(), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("profile_photo_url", sa.Text(), nullable=True),
        sa.Column("home_location_lat", sa.Numeric(), nullable=True),
        sa.Column("home_location_lng", sa.Numeric(), nullable=True),
        sa.Column("pin_hash", sa.String(255), nullable=False),
        sa.Column(
            "consent_given_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("caregivers.id"),
            nullable=True,
        ),
        sa.Column("consent_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "caregiver_user_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "caregiver_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("caregivers.id"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("relationship", sa.Text(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_caregiver_user_links_caregiver_id", "caregiver_user_links", ["caregiver_id"]
    )
    op.create_index(
        "ix_caregiver_user_links_user_id", "caregiver_user_links", ["user_id"]
    )

    op.create_table(
        "games",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("game_type", sa.Text(), nullable=False, unique=True),
        sa.Column("display_name", postgresql.JSONB(), nullable=False),
        sa.Column("cognitive_domain", sa.Text(), nullable=False),
        sa.Column("min_difficulty", sa.Integer(), nullable=False),
        sa.Column("max_difficulty", sa.Integer(), nullable=False),
    )

    op.create_table(
        "game_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "game_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("games.id"),
            nullable=False,
        ),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("accuracy", sa.Numeric(5, 2), nullable=False),
        sa.Column("reaction_time_ms", sa.Integer(), nullable=False),
        sa.Column("errors", sa.Integer(), nullable=False),
        sa.Column("hints_used", sa.Integer(), nullable=False),
        sa.Column("session_duration_sec", sa.Integer(), nullable=False),
        sa.Column("completed_or_quit", sa.Text(), nullable=False),
        sa.Column("client_generated_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("played_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "client_generated_id", name="uq_game_sessions_client_generated_id"
        ),
    )
    op.create_index(
        "ix_game_sessions_user_id_played_at", "game_sessions", ["user_id", "played_at"]
    )

    op.create_table(
        "reminders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "created_by_caregiver_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("caregivers.id"),
            nullable=False,
        ),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("title", postgresql.JSONB(), nullable=False),
        sa.Column("scheduled_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("recurrence_rule", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("last_acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_reminders_user_scheduled_active",
        "reminders",
        ["user_id", "scheduled_time", "is_active"],
    )

    op.create_table(
        "memory_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column(
            "uploaded_by_caregiver_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("caregivers.id"),
            nullable=True,
        ),
        sa.Column("media_url", sa.Text(), nullable=False),
        sa.Column("media_type", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("title", postgresql.JSONB(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("people_tagged", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("prompt_text", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_memory_items_user_id_category", "memory_items", ["user_id", "category"]
    )

    op.create_table(
        "performance_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("game_type", sa.Text(), nullable=True),
        sa.Column("period", sa.Text(), nullable=False),
        sa.Column("avg_accuracy", sa.Numeric(), nullable=False),
        sa.Column("avg_reaction_time_ms", sa.Integer(), nullable=False),
        sa.Column("completion_rate", sa.Numeric(), nullable=False),
        sa.Column("baseline_avg_accuracy", sa.Numeric(), nullable=True),
        sa.Column("baseline_avg_reaction_time_ms", sa.Integer(), nullable=True),
        sa.Column(
            "computed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "caregiver_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("caregivers.id"),
            nullable=False,
        ),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "sync_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("device_id", sa.Text(), nullable=False),
        sa.Column("batch_size", sa.Integer(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column(
            "synced_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    games = sa.table(
        "games",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("game_type", sa.Text()),
        sa.column("display_name", postgresql.JSONB()),
        sa.column("cognitive_domain", sa.Text()),
        sa.column("min_difficulty", sa.Integer()),
        sa.column("max_difficulty", sa.Integer()),
    )
    op.bulk_insert(
        games,
        [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "game_type": "memory_match",
                "display_name": {"en": "Memory Match", "as": "মেমৰি মেচ"},
                "cognitive_domain": "memory",
                "min_difficulty": 1,
                "max_difficulty": 5,
            },
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "game_type": "attention_reaction",
                "display_name": {"en": "Attention", "as": "মনোযোগ"},
                "cognitive_domain": "attention",
                "min_difficulty": 1,
                "max_difficulty": 5,
            },
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "game_type": "sequencing",
                "display_name": {"en": "Sequencing", "as": "ক্ৰম"},
                "cognitive_domain": "executive_function",
                "min_difficulty": 1,
                "max_difficulty": 5,
            },
            {
                "id": "44444444-4444-4444-4444-444444444444",
                "game_type": "picture_naming",
                "display_name": {"en": "Picture Naming", "as": "ছবিৰ নাম"},
                "cognitive_domain": "language",
                "min_difficulty": 1,
                "max_difficulty": 5,
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("sync_events")
    op.drop_table("alerts")
    op.drop_table("performance_metrics")
    op.drop_index("ix_memory_items_user_id_category", table_name="memory_items")
    op.drop_table("memory_items")
    op.drop_index("ix_reminders_user_scheduled_active", table_name="reminders")
    op.drop_table("reminders")
    op.drop_index("ix_game_sessions_user_id_played_at", table_name="game_sessions")
    op.drop_table("game_sessions")
    op.drop_table("games")
    op.drop_index("ix_caregiver_user_links_user_id", table_name="caregiver_user_links")
    op.drop_index(
        "ix_caregiver_user_links_caregiver_id", table_name="caregiver_user_links"
    )
    op.drop_table("caregiver_user_links")
    op.drop_table("users")
    op.drop_table("caregivers")
