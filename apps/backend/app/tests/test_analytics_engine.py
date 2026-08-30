from datetime import UTC, datetime, timedelta

from app.services.analytics_engine import (
    SessionPoint,
    personal_baseline,
    rolling_period_stats,
)


def _point(
    day_offset: int,
    accuracy: float,
    reaction: int,
    *,
    completed: bool = True,
    errors: int | None = None,
    hints_used: int | None = None,
    session_duration_sec: int | None = None,
    game_type: str | None = None,
) -> SessionPoint:
    base = datetime(2026, 8, 1, 10, 0, tzinfo=UTC)
    return SessionPoint(
        played_at=base + timedelta(days=day_offset),
        accuracy=accuracy,
        reaction_time_ms=reaction,
        completed=completed,
        errors=errors,
        hints_used=hints_used,
        session_duration_sec=session_duration_sec,
        game_type=game_type,
    )


def test_personal_baseline_uses_early_window() -> None:
    sessions = [
        _point(0, 70, 1000, errors=2, hints_used=1, session_duration_sec=60),
        _point(1, 72, 980, errors=1, hints_used=0, session_duration_sec=50),
        _point(20, 90, 700, errors=0, hints_used=0, session_duration_sec=30),
    ]
    baseline = personal_baseline(sessions)
    assert baseline.sessions_count == 2
    assert baseline.avg_accuracy == 71.0
    assert baseline.avg_reaction_time_ms == 990.0
    assert baseline.avg_errors == 1.5
    assert baseline.avg_hints_used == 0.5
    assert baseline.avg_session_duration_sec == 55.0
    assert baseline.completion_rate == 1.0


def test_rolling_stats_compare_to_baseline() -> None:
    sessions = [
        _point(0, 70, 1000, errors=1, hints_used=1, session_duration_sec=60),
        _point(1, 70, 1000, errors=1, hints_used=1, session_duration_sec=60),
        _point(20, 70, 1300, errors=2, hints_used=2, session_duration_sec=120),
        _point(21, 70, 1300, errors=2, hints_used=2, session_duration_sec=120),
    ]
    now = datetime(2026, 8, 22, 12, 0, tzinfo=UTC)
    stats = rolling_period_stats(sessions, period_days=7, now=now)
    assert stats.sessions_count == 2
    assert stats.avg_reaction_time_ms == 1300
    assert stats.reaction_time_delta_pct == 30.0
    assert stats.errors_delta_pct == 100.0
    assert stats.hints_delta_pct == 100.0
    assert stats.duration_delta_pct == 100.0
    assert stats.note is not None
    assert "Reaction time is 30% higher than personal baseline." in stats.note


def test_rolling_stats_accuracy_deviation() -> None:
    sessions = [
        _point(0, 80, 1000),
        _point(1, 80, 1000),
        _point(20, 60, 1000),
        _point(21, 60, 1000),
    ]
    now = datetime(2026, 8, 22, 12, 0, tzinfo=UTC)
    stats = rolling_period_stats(sessions, period_days=7, now=now)
    assert stats.accuracy_delta_pct == -25.0
    assert stats.note is not None
    assert "Accuracy is 25% lower than personal baseline." in stats.note


def test_all_incomplete_sessions() -> None:
    sessions = [
        _point(0, 0, 0, completed=False),
        _point(1, 0, 0, completed=False),
    ]
    baseline = personal_baseline(sessions)
    assert baseline.completion_rate == 0.0

    now = datetime(2026, 8, 2, 12, 0, tzinfo=UTC)
    stats = rolling_period_stats(sessions, period_days=7, now=now)
    assert stats.completion_rate == 0.0


def test_empty_sessions() -> None:
    baseline = personal_baseline([])
    assert baseline.sessions_count == 0
    assert baseline.avg_accuracy is None
    assert baseline.avg_errors is None
    assert baseline.completion_rate is None

    stats = rolling_period_stats([])
    assert stats.sessions_count == 0
    assert stats.avg_accuracy is None
    assert stats.completion_rate is None


def test_game_type_filtering() -> None:
    sessions = [
        _point(0, 70, 1000, game_type="simon_says"),
        _point(1, 80, 800, game_type="word_recall"),
        _point(2, 75, 900, game_type="simon_says"),
    ]
    # Baseline filtering
    simon_baseline = personal_baseline(sessions, game_type="simon_says")
    assert simon_baseline.sessions_count == 2
    assert simon_baseline.avg_accuracy == 72.5

    word_baseline = personal_baseline(sessions, game_type="word_recall")
    assert word_baseline.sessions_count == 1
    assert word_baseline.avg_accuracy == 80.0

    # Rolling stats filtering
    now = datetime(2026, 8, 5, 12, 0, tzinfo=UTC)
    simon_stats = rolling_period_stats(
        sessions, period_days=7, now=now, game_type="simon_says"
    )
    assert simon_stats.sessions_count == 2
    assert simon_stats.avg_accuracy == 72.5


def test_new_metrics() -> None:
    sessions = [
        _point(
            0,
            70,
            1000,
            errors=2,
            hints_used=1,
            session_duration_sec=120,
            completed=True,
        ),
        _point(
            1, 80, 800, errors=0, hints_used=0, session_duration_sec=90, completed=False
        ),
        _point(
            20, 90, 700, errors=0, hints_used=0, session_duration_sec=60, completed=True
        ),
    ]

    # Check baseline new metrics (window includes day 0, 1)
    baseline = personal_baseline(sessions)
    assert baseline.sessions_count == 2
    assert baseline.avg_errors == 1.0
    assert baseline.avg_hints_used == 0.5
    assert baseline.avg_session_duration_sec == 105.0
    assert baseline.completion_rate == 0.5

    # Check rolling stats new metrics (period 7 days includes day 20)
    now = datetime(2026, 8, 22, 12, 0, tzinfo=UTC)
    stats = rolling_period_stats(sessions, period_days=7, now=now)
    assert stats.sessions_count == 1
    assert stats.avg_errors == 0.0
    assert stats.avg_hints_used == 0.0
    assert stats.avg_session_duration_sec == 60.0
    assert stats.completion_rate == 1.0

    # Deltas
    # Baseline avg_errors=1.0, current=0.0 -> -100%
    assert stats.errors_delta_pct == -100.0
    # Baseline hints=0.5, current=0.0 -> -100%
    assert stats.hints_delta_pct == -100.0
    # Baseline duration=105, current=60 -> (60-105)/105 = -45/105 = -42.85 -> -42.9%
    assert stats.duration_delta_pct == -42.9
