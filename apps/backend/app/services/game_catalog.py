"""Stable game catalog seeds so clients can resolve game_type → id."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.game import Game

# Fixed UUIDs — keep in sync with elderly-app/src/api/games.ts
MEMORY_MATCH_ID = UUID("11111111-1111-4111-8111-111111111101")
ATTENTION_ID = UUID("11111111-1111-4111-8111-111111111102")
SEQUENCING_ID = UUID("11111111-1111-4111-8111-111111111103")
PICTURE_NAMING_ID = UUID("11111111-1111-4111-8111-111111111104")
SIMPLE_ARITHMETIC_ID = UUID("11111111-1111-4111-8111-111111111105")
PATH_MAZE_ID = UUID("11111111-1111-4111-8111-111111111106")
FACE_RECALL_ID = UUID("11111111-1111-4111-8111-111111111107")

GAME_SEEDS: list[dict] = [
    {
        "id": MEMORY_MATCH_ID,
        "game_type": "memory_match",
        "display_name": {"en": "Memory Match", "as": "মেমৰি মেচ"},
        "cognitive_domain": "memory",
    },
    {
        "id": ATTENTION_ID,
        "game_type": "attention_reaction",
        "display_name": {"en": "Attention", "as": "মনোযোগ"},
        "cognitive_domain": "attention",
    },
    {
        "id": SEQUENCING_ID,
        "game_type": "sequencing",
        "display_name": {"en": "Sequencing", "as": "ক্ৰম"},
        "cognitive_domain": "executive",
    },
    {
        "id": PICTURE_NAMING_ID,
        "game_type": "picture_naming",
        "display_name": {"en": "Picture Naming", "as": "ছবিৰ নাম"},
        "cognitive_domain": "language",
    },
    {
        "id": SIMPLE_ARITHMETIC_ID,
        "game_type": "simple_arithmetic",
        "display_name": {"en": "Simple Arithmetic", "as": "সৰল গণিত"},
        "cognitive_domain": "calculation",
    },
    {
        "id": PATH_MAZE_ID,
        "game_type": "path_maze",
        "display_name": {"en": "Hill Path", "as": "পাহাৰৰ পথ"},
        "cognitive_domain": "visuospatial",
    },
    {
        "id": FACE_RECALL_ID,
        "game_type": "face_recall",
        "display_name": {"en": "Who Is This?", "as": "এইজন কোন?"},
        "cognitive_domain": "memory",
    },
]


def ensure_games(db: Session) -> list[Game]:
    rows = db.query(Game).all()
    by_type = {row.game_type: row for row in rows}
    created = False
    for seed in GAME_SEEDS:
        if seed["game_type"] in by_type:
            continue
        game = Game(
            id=seed["id"],
            game_type=seed["game_type"],
            display_name=seed["display_name"],
            cognitive_domain=seed["cognitive_domain"],
            min_difficulty=1,
            max_difficulty=5,
        )
        db.add(game)
        by_type[seed["game_type"]] = game
        created = True
    if created:
        db.commit()
        for game in by_type.values():
            db.refresh(game)
    return list(by_type.values())


def get_game_by_id(db: Session, game_id: UUID) -> Game | None:
    ensure_games(db)
    return db.query(Game).filter(Game.id == game_id).first()


def get_game_by_type(db: Session, game_type: str) -> Game | None:
    ensure_games(db)
    return db.query(Game).filter(Game.game_type == game_type).first()
