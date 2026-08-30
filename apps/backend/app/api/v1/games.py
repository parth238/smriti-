from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_principal, verify_user_access
from app.core.errors import NotFoundError, ValidationError
from app.db.session import get_db
from app.models.game import Game
from app.schemas.games import (
    GameCatalogItem,
    GameSessionCreate,
    GameSessionResponse,
    GameSessionRow,
    NextDifficultyResponse,
)
from app.services.adaptive_difficulty import DEFAULT_DIFFICULTY, next_difficulty
from app.services.game_catalog import ensure_games, get_game_by_type
from app.services.game_sessions import create_game_session, list_user_sessions

router = APIRouter()


@router.get("/games", response_model=list[GameCatalogItem])
def list_games(db: Session = Depends(get_db)) -> list[GameCatalogItem]:
    games = ensure_games(db)
    return [
        GameCatalogItem(
            id=game.id,
            game_type=game.game_type,
            display_name=game.display_name,
            cognitive_domain=game.cognitive_domain,
            min_difficulty=game.min_difficulty,
            max_difficulty=game.max_difficulty,
        )
        for game in games
    ]


@router.get(
    "/games/{game_type}/next-difficulty",
    response_model=NextDifficultyResponse,
)
def recommended_difficulty(
    game_type: str,
    user_id: UUID = Query(...),
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> NextDifficultyResponse:
    verify_user_access(user_id, principal, db)
    game = get_game_by_type(db, game_type)
    if game is None:
        raise NotFoundError("Game was not found")
    rows = list_user_sessions(db, user_id, limit=100, game_type=game_type)
    accuracies = [float(row.accuracy) for row in reversed(rows)]
    level = next_difficulty(DEFAULT_DIFFICULTY, accuracies)
    return NextDifficultyResponse(game_type=game_type, difficulty=level)


@router.post("/game-sessions", response_model=GameSessionResponse)
def post_game_session(
    body: GameSessionCreate,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> GameSessionResponse:
    verify_user_access(body.user_id, principal, db)
    if body.game_id is None and not body.game_type:
        raise ValidationError("Provide game_id or game_type", field="game_id")
    session, nxt, _created = create_game_session(
        db,
        user_id=body.user_id,
        game_id=body.game_id,
        game_type=body.game_type,
        difficulty=body.difficulty,
        accuracy=body.accuracy,
        reaction_time_ms=body.reaction_time_ms,
        errors=body.errors,
        hints_used=body.hints_used,
        session_duration_sec=body.session_duration_sec,
        completed_or_quit=body.completed_or_quit,
        client_generated_id=body.client_generated_id,
        played_at=body.played_at,
    )
    return GameSessionResponse(
        id=session.id,
        next_difficulty=nxt,
        synced_at=session.synced_at,
    )


@router.get(
    "/users/{user_id}/game-sessions",
    response_model=list[GameSessionRow],
)
def user_game_sessions(
    user_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    game_type: str | None = None,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[GameSessionRow]:
    verify_user_access(user_id, principal, db)
    rows = list_user_sessions(db, user_id, limit=limit, game_type=game_type)
    games = {game.id: game for game in ensure_games(db)}
    result: list[GameSessionRow] = []
    for row in rows:
        game: Game | None = games.get(row.game_id)
        label = None
        gtype = None
        if game is not None:
            gtype = game.game_type
            names = game.display_name or {}
            label = names.get("en") or names.get("as")
        result.append(
            GameSessionRow(
                id=row.id,
                game_id=row.game_id,
                game_type=gtype,
                game_label=label,
                difficulty=row.difficulty,
                accuracy=float(row.accuracy),
                reaction_time_ms=row.reaction_time_ms,
                errors=row.errors,
                hints_used=row.hints_used,
                session_duration_sec=row.session_duration_sec,
                completed_or_quit=row.completed_or_quit,
                client_generated_id=row.client_generated_id,
                played_at=row.played_at,
                synced_at=row.synced_at,
            )
        )
    return result
