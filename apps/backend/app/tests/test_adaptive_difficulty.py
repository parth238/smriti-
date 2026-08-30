from app.services.adaptive_difficulty import (
    DEFAULT_DIFFICULTY,
    MAX_DIFFICULTY,
    MIN_DIFFICULTY,
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
