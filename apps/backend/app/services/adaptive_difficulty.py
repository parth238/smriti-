"""Rule-based staircase adaptive difficulty (v1 — not ML).

Tunable constants from docs/00-source-of-truth/12-config.md §5.
"""

from __future__ import annotations

from collections.abc import Sequence

STRONG_ACCURACY_THRESHOLD = 80
POOR_ACCURACY_THRESHOLD = 50
ROUNDS_TO_LEVEL_UP = 3
ROUNDS_TO_LEVEL_DOWN = 2
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 5
DEFAULT_DIFFICULTY = 3


def clamp_difficulty(level: int) -> int:
    return max(MIN_DIFFICULTY, min(MAX_DIFFICULTY, level))


def next_difficulty(
    current_difficulty: int,
    recent_accuracies: Sequence[float],
    game_type: str | None = None,
) -> int:
    """Walk oldest→newest accuracies and step the staircase.

    - 3 consecutive rounds at/above 80% → level up one step (streak resets)
    - 2 consecutive rounds at/below 50% → level down one step (streak resets)
    - Mid-range results clear both streaks
    """
    level = clamp_difficulty(current_difficulty)
    strong_streak = 0
    poor_streak = 0

    for accuracy in recent_accuracies:
        if accuracy >= STRONG_ACCURACY_THRESHOLD:
            strong_streak += 1
            poor_streak = 0
            if strong_streak >= ROUNDS_TO_LEVEL_UP:
                level = clamp_difficulty(level + 1)
                strong_streak = 0
        elif accuracy <= POOR_ACCURACY_THRESHOLD:
            poor_streak += 1
            strong_streak = 0
            if poor_streak >= ROUNDS_TO_LEVEL_DOWN:
                level = clamp_difficulty(level - 1)
                poor_streak = 0
        else:
            strong_streak = 0
            poor_streak = 0

    return level


def get_difficulty_summary(
    game_accuracies: dict[str, Sequence[float]],
    current_difficulties: dict[str, int] | None = None,
) -> dict[str, int]:
    """Returns the recommended next difficulty for multiple games."""
    current_difficulties = current_difficulties or {}
    return {
        g_type: next_difficulty(
            current_difficulties.get(g_type, DEFAULT_DIFFICULTY),
            accuracies,
            game_type=g_type,
        )
        for g_type, accuracies in game_accuracies.items()
    }
