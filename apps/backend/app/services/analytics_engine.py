"""Personal-baseline analytics — never population norms."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

BASELINE_WINDOW_DAYS = 14
ROLLING_WINDOWS = (7, 30)
DEVIATION_ALERT_THRESHOLD_PCT = 15


@dataclass(frozen=True)
class SessionPoint:
    played_at: datetime
    accuracy: float
    reaction_time_ms: int
    completed: bool
    errors: int | None = None
    hints_used: int | None = None
    session_duration_sec: int | None = None
    game_type: str | None = None


@dataclass(frozen=True)
class BaselineStats:
    avg_accuracy: float | None
    avg_reaction_time_ms: float | None
    sessions_count: int
    avg_errors: float | None = None
    avg_hints_used: float | None = None
    avg_session_duration_sec: float | None = None
    completion_rate: float | None = None


@dataclass(frozen=True)
class PeriodStats:
    period: str
    avg_accuracy: float | None
    avg_reaction_time_ms: float | None
    completion_rate: float | None
    sessions_count: int
    reaction_time_delta_pct: float | None
    accuracy_delta_pct: float | None
    note: str | None
    avg_errors: float | None = None
    avg_hints_used: float | None = None
    avg_session_duration_sec: float | None = None
    errors_delta_pct: float | None = None
    hints_delta_pct: float | None = None
    duration_delta_pct: float | None = None


def _aware(moment: datetime) -> datetime:
    if moment.tzinfo is None:
        return moment.replace(tzinfo=timezone.utc)
    return moment


def _mean(values: Sequence[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def personal_baseline(
    sessions: Sequence[SessionPoint],
    *,
    now: datetime | None = None,
    window_days: int = BASELINE_WINDOW_DAYS,
    game_type: str | None = None,
) -> BaselineStats:
    """First `window_days` of play define the personal baseline."""
    if game_type:
        sessions = [s for s in sessions if s.game_type == game_type]

    if not sessions:
        return BaselineStats(None, None, 0, None, None, None, None)

    ordered = sorted(sessions, key=lambda row: _aware(row.played_at))
    first = _aware(ordered[0].played_at)
    cutoff = first + timedelta(days=window_days)
    window = [row for row in ordered if _aware(row.played_at) <= cutoff]
    if not window:
        window = ordered[:1]

    accuracies = [row.accuracy for row in window]
    reactions = [float(row.reaction_time_ms) for row in window]
    errors_list = [float(row.errors or 0) for row in window]
    hints_list = [float(row.hints_used or 0) for row in window]
    durations = [float(row.session_duration_sec or 0) for row in window]
    completed = sum(1 for row in window if row.completed)
    completion_rate = completed / len(window)

    return BaselineStats(
        avg_accuracy=_mean(accuracies),
        avg_reaction_time_ms=_mean(reactions),
        sessions_count=len(window),
        avg_errors=_mean(errors_list),
        avg_hints_used=_mean(hints_list),
        avg_session_duration_sec=_mean(durations),
        completion_rate=completion_rate,
    )


def _delta_pct(current: float | None, baseline: float | None) -> float | None:
    if current is None or baseline is None or baseline == 0:
        return None
    return round(((current - baseline) / baseline) * 100.0, 1)


def rolling_period_stats(
    sessions: Sequence[SessionPoint],
    *,
    period_days: int = 7,
    now: datetime | None = None,
    game_type: str | None = None,
) -> PeriodStats:
    """Rolling window stats vs personal baseline (cautious copy only)."""
    clock = _aware(now or datetime.now(timezone.utc))
    period_label = f"{period_days}d"
    
    if game_type:
        sessions = [s for s in sessions if s.game_type == game_type]
        
    baseline = personal_baseline(sessions, now=clock)

    start = clock - timedelta(days=period_days)
    window = [row for row in sessions if _aware(row.played_at) >= start]
    if not window:
        return PeriodStats(
            period=period_label,
            avg_accuracy=None,
            avg_reaction_time_ms=None,
            completion_rate=None,
            sessions_count=0,
            reaction_time_delta_pct=None,
            accuracy_delta_pct=None,
            note=None,
            avg_errors=None,
            avg_hints_used=None,
            avg_session_duration_sec=None,
            errors_delta_pct=None,
            hints_delta_pct=None,
            duration_delta_pct=None,
        )

    avg_accuracy = _mean([row.accuracy for row in window])
    avg_reaction = _mean([float(row.reaction_time_ms) for row in window])
    avg_errors = _mean([float(row.errors or 0) for row in window])
    avg_hints = _mean([float(row.hints_used or 0) for row in window])
    avg_duration = _mean([float(row.session_duration_sec or 0) for row in window])

    completed = sum(1 for row in window if row.completed)
    completion_rate = completed / len(window)
    
    reaction_delta = _delta_pct(avg_reaction, baseline.avg_reaction_time_ms)
    accuracy_delta = _delta_pct(avg_accuracy, baseline.avg_accuracy)
    errors_delta = _delta_pct(avg_errors, baseline.avg_errors)
    hints_delta = _delta_pct(avg_hints, baseline.avg_hints_used)
    duration_delta = _delta_pct(avg_duration, baseline.avg_session_duration_sec)

    note: str | None = None
    if (
        reaction_delta is not None
        and abs(reaction_delta) >= DEVIATION_ALERT_THRESHOLD_PCT
    ):
        direction = "higher" if reaction_delta > 0 else "lower"
        note = (
            f"Reaction time is {abs(reaction_delta):.0f}% {direction} "
            "than this user's personal baseline over the selected period."
        )

    return PeriodStats(
        period=period_label,
        avg_accuracy=round(avg_accuracy, 1) if avg_accuracy is not None else None,
        avg_reaction_time_ms=(
            round(avg_reaction) if avg_reaction is not None else None
        ),
        completion_rate=round(completion_rate, 2),
        sessions_count=len(window),
        reaction_time_delta_pct=reaction_delta,
        accuracy_delta_pct=accuracy_delta,
        note=note,
        avg_errors=round(avg_errors, 2) if avg_errors is not None else None,
        avg_hints_used=round(avg_hints, 2) if avg_hints is not None else None,
        avg_session_duration_sec=round(avg_duration) if avg_duration is not None else None,
        errors_delta_pct=errors_delta,
        hints_delta_pct=hints_delta,
        duration_delta_pct=duration_delta,
    )


def decimal_or_none(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(round(value, 2)))
