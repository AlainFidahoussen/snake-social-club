import time
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Query

from ..deps import get_current_user
from ..models import GameMode, ScoreEntry, SubmitScoreRequest
from ..store import Store, StoredUser, get_store

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.post("/scores", status_code=201, response_model=ScoreEntry)
def submit_score(
    body: SubmitScoreRequest,
    user: Annotated[StoredUser, Depends(get_current_user)],
    store: Annotated[Store, Depends(get_store)],
) -> ScoreEntry:
    entry = ScoreEntry(
        id=uuid4().hex[:12],
        userId=user.id,
        username=user.username,
        mode=body.mode,
        score=body.score,
        createdAt=int(time.time() * 1000),
    )
    store.add_score(entry)
    return entry


@router.get("/scores", response_model=list[ScoreEntry])
def top_scores(
    mode: GameMode,
    store: Annotated[Store, Depends(get_store)],
    limit: Annotated[int, Query(ge=1)] = 10,
) -> list[ScoreEntry]:
    """Each player's best run for this mode, not every run — a player who has
    finished many games should only take one leaderboard slot."""
    best_by_user: dict[str, ScoreEntry] = {}
    for entry in store.list_scores(mode):
        current = best_by_user.get(entry.userId)
        if current is None or entry.score > current.score:
            best_by_user[entry.userId] = entry
        elif entry.score == current.score and entry.createdAt < current.createdAt:
            best_by_user[entry.userId] = entry
    return sorted(best_by_user.values(), key=lambda s: (-s.score, s.createdAt))[:limit]
