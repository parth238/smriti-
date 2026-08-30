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


@dataclass(frozen=True)
class BaselineStats:
    avg_accuracy: float | None
    avg_reaction_time_ms: float | None
    sessions_count: int


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
) -> BaselineStats:
    """First `window_days` of play define the personal baseline."""
    if not sessions:
        return BaselineStats(None, None, 0)

    ordered = sorted(sessions, key=lambda row: _aware(row.played_at))
    first = _aware(ordered[0].played_at)
    cutoff = first + timedelta(days=window_days)
    window = [row for row in ordered if _aware(row.played_at) <= cutoff]
    if not window:
        window = ordered[:1]

    accuracies = [row.accuracy for row in window]
    reactions = [float(row.reaction_time_ms) for row in window]
    return BaselineStats(
        avg_accuracy=_mean(accuracies),
        avg_reaction_time_ms=_mean(reactions),
        sessions_count=len(window),
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
) -> PeriodStats:
    """Rolling window stats vs personal baseline (cautious copy only)."""
    clock = _aware(now or datetime.now(timezone.utc))
    period_label = f"{period_days}d"
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
        )

    avg_accuracy = _mean([row.accuracy for row in window])
    avg_reaction = _mean([float(row.reaction_time_ms) for row in window])
    completed = sum(1 for row in window if row.completed)
    completion_rate = completed / len(window)
    reaction_delta = _delta_pct(avg_reaction, baseline.avg_reaction_time_ms)
    accuracy_delta = _delta_pct(avg_accuracy, baseline.avg_accuracy)

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
    )


def decimal_or_none(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(round(value, 2)))
