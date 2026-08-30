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
            errors=row.errors,
            hints_used=row.hints_used,
            session_duration_sec=row.session_duration_sec,
            game_type=row.game_type,
        )
        for row in rows
    ]


@router.get("/users/{user_id}/analytics", response_model=AnalyticsPeriodResponse)
def user_analytics(
    user_id: UUID,
    period: str = Query("7d"),
    game_type: str | None = Query(None),
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
    stats = rolling_period_stats(_points_from_db(db, user_id), period_days=days, game_type=game_type)
    return AnalyticsPeriodResponse(
        period=stats.period,
        avg_accuracy=stats.avg_accuracy,
        avg_reaction_time_ms=stats.avg_reaction_time_ms,
        avg_errors=stats.avg_errors,
        avg_hints_used=stats.avg_hints_used,
        avg_session_duration_sec=stats.avg_session_duration_sec,
        completion_rate=stats.completion_rate,
        sessions_count=stats.sessions_count,
        baseline_comparison=BaselineComparison(
            reaction_time_delta_pct=stats.reaction_time_delta_pct,
            accuracy_delta_pct=stats.accuracy_delta_pct,
            errors_delta_pct=stats.errors_delta_pct,
            hints_delta_pct=stats.hints_delta_pct,
            duration_delta_pct=stats.duration_delta_pct,
            note=stats.note,
        ),
    )


@router.get("/users/{user_id}/analytics/baseline", response_model=BaselineResponse)
def user_baseline(
    user_id: UUID,
    game_type: str | None = Query(None),
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> BaselineResponse:
    verify_user_access(user_id, principal, db)
    baseline = personal_baseline(_points_from_db(db, user_id), game_type=game_type)
    return BaselineResponse(
        avg_accuracy=(
            round(baseline.avg_accuracy, 1) if baseline.avg_accuracy is not None else None
        ),
        avg_reaction_time_ms=(
            round(baseline.avg_reaction_time_ms) if baseline.avg_reaction_time_ms is not None else None
        ),
        avg_errors=(
            round(baseline.avg_errors, 2) if baseline.avg_errors is not None else None
        ),
        avg_hints_used=(
            round(baseline.avg_hints_used, 2) if baseline.avg_hints_used is not None else None
        ),
        avg_session_duration_sec=(
            round(baseline.avg_session_duration_sec) if baseline.avg_session_duration_sec is not None else None
        ),
        completion_rate=(
            round(baseline.completion_rate, 2) if baseline.completion_rate is not None else None
        ),
        sessions_count=baseline.sessions_count,
    )


@router.get("/users/{user_id}/analytics/trend", response_model=TrendResponse)
def user_trend(
    user_id: UUID,
    metric: str = Query("accuracy"),
    days: int = Query(7, ge=1, le=90),
    game_type: str | None = Query(None),
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TrendResponse:
    verify_user_access(user_id, principal, db)
    points = _points_from_db(db, user_id)
    if game_type:
        points = [p for p in points if p.game_type == game_type]

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
                TrendPoint(
                    day=day.strftime("%a"), 
                    accuracy=None, 
                    reaction_time_ms=None,
                    errors=None,
                    hints_used=None,
                    session_duration_sec=None
                )
            )
            continue
        avg_acc = sum(item.accuracy for item in bucket) / len(bucket)
        avg_rt = sum(item.reaction_time_ms for item in bucket) / len(bucket)
        avg_err = sum(item.errors for item in bucket) / len(bucket)
        avg_hints = sum(item.hints_used for item in bucket) / len(bucket)
        avg_dur = sum(item.session_duration_sec for item in bucket) / len(bucket)
        trend.append(
            TrendPoint(
                day=day.strftime("%a"),
                accuracy=round(avg_acc, 1),
                reaction_time_ms=round(avg_rt),
                errors=round(avg_err, 2),
                hints_used=round(avg_hints, 2),
                session_duration_sec=round(avg_dur),
            )
        )

    return TrendResponse(
        metric=metric,
        days=days,
        baseline_accuracy=(
            round(baseline.avg_accuracy, 1) if baseline.avg_accuracy is not None else None
        ),
        baseline_reaction_time_ms=(
            round(baseline.avg_reaction_time_ms) if baseline.avg_reaction_time_ms is not None else None
        ),
        baseline_errors=(
            round(baseline.avg_errors, 2) if baseline.avg_errors is not None else None
        ),
        baseline_hints_used=(
            round(baseline.avg_hints_used, 2) if baseline.avg_hints_used is not None else None
        ),
        baseline_session_duration_sec=(
            round(baseline.avg_session_duration_sec) if baseline.avg_session_duration_sec is not None else None
        ),
        points=trend,
    )
