from collections.abc import Sequence

from app.services.adaptive_difficulty import (
    DEFAULT_DIFFICULTY,
    MAX_DIFFICULTY,
    MIN_DIFFICULTY,
    get_difficulty_summary,
    next_difficulty,
)


def test_stays_put_when_mid_range() -> None:
    assert next_difficulty(3, [60, 70, 65]) == 3


def test_levels_up_after_three_strong() -> None:
    assert next_difficulty(3, [85, 90, 88]) == 4


def test_levels_down_after_two_poor() -> None:
    assert next_difficulty(3, [40, 45]) == 2


def test_clamps_at_max() -> None:
    assert next_difficulty(MAX_DIFFICULTY, [90, 92, 95]) == MAX_DIFFICULTY


def test_clamps_at_min() -> None:
    assert next_difficulty(MIN_DIFFICULTY, [10, 20]) == MIN_DIFFICULTY


def test_walks_sequence_with_resets() -> None:
    # three strong → 4; then two poor → 3
    assert next_difficulty(DEFAULT_DIFFICULTY, [80, 81, 82, 40, 30]) == 3


def test_empty_keeps_current() -> None:
    assert next_difficulty(2, []) == 2


def test_rapid_oscillation_resets_streaks() -> None:
    # Alternating strong and poor resets streaks so difficulty doesn't change
    assert next_difficulty(3, [80, 40, 80, 40, 80, 40]) == 3


def test_exactly_at_upper_boundary() -> None:
    # 80 exactly should count as strong
    assert next_difficulty(3, [80, 80, 80]) == 4


def test_exactly_at_lower_boundary() -> None:
    # 50 exactly should count as poor
    assert next_difficulty(3, [50, 50]) == 2


def test_multi_level_climb() -> None:
    # 6 strong in a row should increase difficulty by 2
    assert next_difficulty(1, [85, 85, 85, 85, 85, 85]) == 3


def test_start_at_max_strong_sequence() -> None:
    assert next_difficulty(MAX_DIFFICULTY, [90, 90, 90, 90, 90, 90]) == MAX_DIFFICULTY


def test_start_at_min_poor_sequence() -> None:
    assert next_difficulty(MIN_DIFFICULTY, [10, 10, 10, 10]) == MIN_DIFFICULTY


def test_mid_range_breaks_streak() -> None:
    # Two strong, one mid, one strong -> streak broken, no level up
    assert next_difficulty(3, [85, 85, 60, 85]) == 3
    # One poor, one mid, one poor -> streak broken, no level down
    assert next_difficulty(3, [40, 60, 40]) == 3


def test_get_difficulty_summary() -> None:
    game_accuracies: dict[str, Sequence[float]] = {
        "game1": [80, 80, 80],  # should level up from default (3) -> 4
        "game2": [40, 40],  # should level down from current (4) -> 3
        "game3": [60, 60],  # should stay at default (3) -> 3
    }
    current_diffs = {
        "game2": 4
        # game1 and game3 will use default
    }

    summary = get_difficulty_summary(game_accuracies, current_diffs)
    assert summary["game1"] == 4
    assert summary["game2"] == 3
    assert summary["game3"] == 3
