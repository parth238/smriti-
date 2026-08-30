from datetime import datetime, timedelta, timezone

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
) -> SessionPoint:
    base = datetime(2026, 8, 1, 10, 0, tzinfo=timezone.utc)
    return SessionPoint(
        played_at=base + timedelta(days=day_offset),
        accuracy=accuracy,
        reaction_time_ms=reaction,
        completed=completed,
    )


def test_personal_baseline_uses_early_window() -> None:
    sessions = [
        _point(0, 70, 1000),
        _point(1, 72, 980),
        _point(20, 90, 700),
    ]
    baseline = personal_baseline(sessions)
    assert baseline.sessions_count == 2
    assert baseline.avg_accuracy == 71.0
    assert baseline.avg_reaction_time_ms == 990.0


def test_rolling_stats_compare_to_baseline() -> None:
    sessions = [
        _point(0, 70, 1000),
        _point(1, 70, 1000),
        _point(20, 70, 1300),
        _point(21, 70, 1300),
    ]
    now = datetime(2026, 8, 22, 12, 0, tzinfo=timezone.utc)
    stats = rolling_period_stats(sessions, period_days=7, now=now)
    assert stats.sessions_count == 2
    assert stats.avg_reaction_time_ms == 1300
    assert stats.reaction_time_delta_pct == 30.0
    assert stats.note is not None
    assert "personal baseline" in stats.note.lower()
    assert "diagnosis" not in (stats.note or "").lower()


def test_empty_sessions() -> None:
    baseline = personal_baseline([])
    assert baseline.sessions_count == 0
    assert baseline.avg_accuracy is None
