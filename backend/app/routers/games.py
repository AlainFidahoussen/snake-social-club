import time
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..errors import ApiError
from ..game_engine import create_game as engine_create_game
from ..models import CreateGameRequest, GameSnapshot, UpdateGameRequest
from ..store import Store, StoredUser, get_store

router = APIRouter(prefix="/games", tags=["games"])


def _now_ms() -> int:
    return int(time.time() * 1000)


@router.post("", status_code=201, response_model=GameSnapshot)
def create_game(
    body: CreateGameRequest,
    user: Annotated[StoredUser, Depends(get_current_user)],
    store: Annotated[Store, Depends(get_store)],
) -> GameSnapshot:
    state = engine_create_game(body.mode, body.gridSize)
    now = _now_ms()
    snapshot = GameSnapshot(
        id=uuid4().hex[:12],
        userId=user.id,
        username=user.username,
        mode=body.mode,
        gridSize=body.gridSize,
        snake=state.snake,
        food=state.food,
        score=0,
        status="active",
        startedAt=now,
        updatedAt=now,
    )
    store.games[snapshot.id] = snapshot
    return snapshot


@router.get("/active", response_model=list[GameSnapshot])
def list_active_games(store: Annotated[Store, Depends(get_store)]) -> list[GameSnapshot]:
    active = [g for g in store.games.values() if g.status == "active"]
    return sorted(active, key=lambda g: g.score, reverse=True)


@router.get("/{game_id}", response_model=GameSnapshot)
def get_game(game_id: str, store: Annotated[Store, Depends(get_store)]) -> GameSnapshot:
    game = store.games.get(game_id)
    if game is None:
        raise ApiError(404, "No game with this id.")
    return game


@router.patch("/{game_id}", response_model=GameSnapshot)
def update_game(
    game_id: str,
    body: UpdateGameRequest,
    user: Annotated[StoredUser, Depends(get_current_user)],
    store: Annotated[Store, Depends(get_store)],
) -> GameSnapshot:
    existing = store.games.get(game_id)
    if existing is None:
        raise ApiError(404, "No game with this id.")
    if existing.userId != user.id:
        raise ApiError(403, "The game belongs to a different player.")
    updated = existing.model_copy(
        update={
            "snake": body.snake,
            "food": body.food,
            "score": body.score,
            "status": body.status,
            "updatedAt": _now_ms(),
        }
    )
    store.games[game_id] = updated
    return updated
