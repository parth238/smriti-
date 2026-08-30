from collections import defaultdict
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_principal, verify_user_access
from app.db.session import get_db
from app.schemas.games import (
    AnalyticsPeriodResponse,
    BaselineComparison,
    BaselineResponse,
    TrendPoint,
    TrendResponse,
)
from app.services.analytics_engine import (
    SessionPoint,
    personal_baseline,
    rolling_period_stats,
)
from app.services.game_sessions import list_user_sessions

router = APIRouter()


def _points_from_db(db: Session, user_id: UUID) -> list[SessionPoint]:
    rows = list_user_sessions(db, user_id, limit=200)
    return [
        SessionPoint(
            played_at=row.played_at,
            accuracy=float(row.accuracy),
            reaction_time_ms=row.reaction_time_ms,
            completed=row.completed_or_quit == "completed",
        )
        for row in rows
    ]


@router.get("/users/{user_id}/analytics", response_model=AnalyticsPeriodResponse)
def user_analytics(
    user_id: UUID,
    period: str = Query("7d"),
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> AnalyticsPeriodResponse:
    verify_user_access(user_id, principal, db)
    days = 7
    if period.endswith("d"):
        try:
            days = max(1, int(period[:-1]))
        except ValueError:
            days = 7
    stats = rolling_period_stats(_points_from_db(db, user_id), period_days=days)
    return AnalyticsPeriodResponse(
        period=stats.period,
        avg_accuracy=stats.avg_accuracy,
        avg_reaction_time_ms=stats.avg_reaction_time_ms,
        completion_rate=stats.completion_rate,
        sessions_count=stats.sessions_count,
        baseline_comparison=BaselineComparison(
            reaction_time_delta_pct=stats.reaction_time_delta_pct,
            accuracy_delta_pct=stats.accuracy_delta_pct,
            note=stats.note,
        ),
    )


@router.get("/users/{user_id}/analytics/baseline", response_model=BaselineResponse)
def user_baseline(
    user_id: UUID,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> BaselineResponse:
    verify_user_access(user_id, principal, db)
    baseline = personal_baseline(_points_from_db(db, user_id))
    return BaselineResponse(
        avg_accuracy=(
            round(baseline.avg_accuracy, 1)
            if baseline.avg_accuracy is not None
            else None
        ),
        avg_reaction_time_ms=(
            round(baseline.avg_reaction_time_ms)
            if baseline.avg_reaction_time_ms is not None
            else None
        ),
        sessions_count=baseline.sessions_count,
    )


@router.get("/users/{user_id}/analytics/trend", response_model=TrendResponse)
def user_trend(
    user_id: UUID,
    metric: str = Query("accuracy"),
    days: int = Query(7, ge=1, le=90),
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TrendResponse:
    verify_user_access(user_id, principal, db)
    points = _points_from_db(db, user_id)
    baseline = personal_baseline(points)
    clock = datetime.now(timezone.utc)
    start = clock - timedelta(days=days - 1)
    by_day: dict[str, list[SessionPoint]] = defaultdict(list)
    for row in points:
        moment = row.played_at
        if moment.tzinfo is None:
            moment = moment.replace(tzinfo=timezone.utc)
        if moment < start:
            continue
        key = moment.date().isoformat()
        by_day[key].append(row)

    trend: list[TrendPoint] = []
    for offset in range(days):
        day = (start + timedelta(days=offset)).date()
        key = day.isoformat()
        bucket = by_day.get(key, [])
        if not bucket:
            trend.append(
                TrendPoint(day=day.strftime("%a"), accuracy=None, reaction_time_ms=None)
            )
            continue
        avg_acc = sum(item.accuracy for item in bucket) / len(bucket)
        avg_rt = sum(item.reaction_time_ms for item in bucket) / len(bucket)
        trend.append(
            TrendPoint(
                day=day.strftime("%a"),
                accuracy=round(avg_acc, 1),
                reaction_time_ms=round(avg_rt),
            )
        )

    return TrendResponse(
        metric=metric,
        days=days,
        baseline_accuracy=(
            round(baseline.avg_accuracy, 1)
            if baseline.avg_accuracy is not None
            else None
        ),
        baseline_reaction_time_ms=(
            round(baseline.avg_reaction_time_ms)
            if baseline.avg_reaction_time_ms is not None
            else None
        ),
        points=trend,
    )
