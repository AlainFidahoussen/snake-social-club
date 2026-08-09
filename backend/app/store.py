from collections.abc import Iterator
from dataclasses import dataclass

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .db_models import GameRow, ScoreRow, SessionRow, UserRow
from .models import GameMode, GameSnapshot, Point, ScoreEntry


@dataclass
class StoredUser:
    id: str
    username: str
    password_hash: bytes
    password_salt: bytes


def _user_from_row(row: UserRow) -> StoredUser:
    return StoredUser(id=row.id, username=row.username, password_hash=row.password_hash, password_salt=row.password_salt)


def _game_from_row(row: GameRow) -> GameSnapshot:
    return GameSnapshot(
        id=row.id,
        userId=row.user_id,
        username=row.username,
        mode=row.mode,  # type: ignore[arg-type]
        gridSize=row.grid_size,
        snake=[Point(**p) for p in row.snake],
        food=Point(**row.food),
        score=row.score,
        status=row.status,  # type: ignore[arg-type]
        startedAt=row.started_at,
        updatedAt=row.updated_at,
    )


def _score_from_row(row: ScoreRow) -> ScoreEntry:
    return ScoreEntry(
        id=row.id,
        userId=row.user_id,
        username=row.username,
        mode=row.mode,  # type: ignore[arg-type]
        score=row.score,
        createdAt=row.created_at,
    )


class Store:
    def __init__(self, session: Session) -> None:
        self.session = session

    # users
    def get_user(self, user_id: str) -> StoredUser | None:
        row = self.session.get(UserRow, user_id)
        return _user_from_row(row) if row is not None else None

    def find_user_by_username(self, username: str) -> StoredUser | None:
        normalized = username.strip().lower()
        row = self.session.execute(
            select(UserRow).where(func.lower(UserRow.username) == normalized)
        ).scalar_one_or_none()
        return _user_from_row(row) if row is not None else None

    def create_user(self, user: StoredUser) -> None:
        self.session.add(
            UserRow(
                id=user.id,
                username=user.username,
                password_hash=user.password_hash,
                password_salt=user.password_salt,
            )
        )

    # sessions
    def get_session_user_id(self, token: str) -> str | None:
        row = self.session.get(SessionRow, token)
        return row.user_id if row is not None else None

    def create_session(self, token: str, user_id: str) -> None:
        self.session.add(SessionRow(token=token, user_id=user_id))

    def delete_session(self, token: str) -> None:
        row = self.session.get(SessionRow, token)
        if row is not None:
            self.session.delete(row)

    # games
    def get_game(self, game_id: str) -> GameSnapshot | None:
        row = self.session.get(GameRow, game_id)
        return _game_from_row(row) if row is not None else None

    def list_active_games(self) -> list[GameSnapshot]:
        rows = self.session.execute(select(GameRow).where(GameRow.status == "active")).scalars()
        return [_game_from_row(row) for row in rows]

    def save_game(self, snapshot: GameSnapshot) -> None:
        row = self.session.get(GameRow, snapshot.id)
        if row is None:
            row = GameRow(id=snapshot.id)
            self.session.add(row)
        row.user_id = snapshot.userId
        row.username = snapshot.username
        row.mode = snapshot.mode
        row.grid_size = snapshot.gridSize
        row.snake = [p.model_dump() for p in snapshot.snake]
        row.food = snapshot.food.model_dump()
        row.score = snapshot.score
        row.status = snapshot.status
        row.started_at = snapshot.startedAt
        row.updated_at = snapshot.updatedAt

    # scores
    def add_score(self, entry: ScoreEntry) -> None:
        self.session.add(
            ScoreRow(
                id=entry.id,
                user_id=entry.userId,
                username=entry.username,
                mode=entry.mode,
                score=entry.score,
                created_at=entry.createdAt,
            )
        )

    def list_scores(self, mode: GameMode) -> list[ScoreEntry]:
        rows = self.session.execute(select(ScoreRow).where(ScoreRow.mode == mode)).scalars()
        return [_score_from_row(row) for row in rows]


def get_store(request: Request) -> Iterator[Store]:
    session = request.app.state.session_factory()
    try:
        store = Store(session)
        yield store
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
