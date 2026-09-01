"""Canonical game-type contract for the seven shipped activities."""

from app.services.game_catalog import GAME_SEEDS

CANONICAL_GAME_TYPES = frozenset(
    {
        "memory_match",
        "attention_reaction",
        "sequencing",
        "picture_naming",
        "simple_arithmetic",
        "path_maze",
        "face_recall",
    }
)

ORIGINAL_FOUR_GAME_TYPES = frozenset(
    {
        "memory_match",
        "attention_reaction",
        "sequencing",
        "picture_naming",
    }
)


def test_game_catalog_exposes_seven_unique_canonical_types() -> None:
    seeded_types = {seed["game_type"] for seed in GAME_SEEDS}
    assert len(GAME_SEEDS) == 7
    assert seeded_types == CANONICAL_GAME_TYPES


def test_game_catalog_preserves_original_four_types() -> None:
    seeded_types = {seed["game_type"] for seed in GAME_SEEDS}
    assert ORIGINAL_FOUR_GAME_TYPES.issubset(seeded_types)
