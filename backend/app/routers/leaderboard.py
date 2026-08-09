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
    store.scores.append(entry)
    return entry


@router.get("/scores", response_model=list[ScoreEntry])
def top_scores(
    mode: GameMode,
    store: Annotated[Store, Depends(get_store)],
    limit: Annotated[int, Query(ge=1)] = 10,
) -> list[ScoreEntry]:
    matching = [s for s in store.scores if s.mode == mode]
    return sorted(matching, key=lambda s: (-s.score, s.createdAt))[:limit]
