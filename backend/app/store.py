import random
import time
from dataclasses import dataclass, field

from fastapi import Request

from .game_engine import create_game
from .models import GameMode, GameSnapshot, ScoreEntry
from .security import hash_password


@dataclass
class StoredUser:
    id: str
    username: str
    password_hash: bytes
    password_salt: bytes


@dataclass
class Store:
    users: dict[str, StoredUser] = field(default_factory=dict)
    sessions: dict[str, str] = field(default_factory=dict)
    games: dict[str, GameSnapshot] = field(default_factory=dict)
    scores: list[ScoreEntry] = field(default_factory=list)

    def find_user_by_username(self, username: str) -> StoredUser | None:
        normalized = username.strip().lower()
        return next((u for u in self.users.values() if u.username.lower() == normalized), None)


def get_store(request: Request) -> Store:
    return request.app.state.store


_SEED_USERNAMES = ["pixelviper", "coilqueen", "byteboa"]
_SEED_PASSWORD = "snakepit123"


def seed_store(store: Store) -> None:
    """Populate the store with a few fake users, scores, and active games."""
    rand = random.Random(1234)
    modes: list[GameMode] = ["walls", "pass-through"]
    now_ms = int(time.time() * 1000)

    for i, username in enumerate(_SEED_USERNAMES):
        digest, salt = hash_password(_SEED_PASSWORD)
        user = StoredUser(id=f"seed-user-{i}", username=username, password_hash=digest, password_salt=salt)
        store.users[user.id] = user

        for n in range(3):
            mode = modes[(i + n) % 2]
            store.scores.append(
                ScoreEntry(
                    id=f"seed-score-{i}-{n}",
                    userId=user.id,
                    username=user.username,
                    mode=mode,
                    score=40 + ((i * 7 + n * 13) % 26) * 10,
                    createdAt=now_ms - (i + n) * 3_600_000,
                )
            )

        mode = modes[i % 2]
        state = create_game(mode, rand=rand.random)
        game_id = f"seed-game-{i}"
        store.games[game_id] = GameSnapshot(
            id=game_id,
            userId=user.id,
            username=user.username,
            mode=mode,
            gridSize=state.grid_size,
            snake=state.snake,
            food=state.food,
            score=0,
            status="active",
            startedAt=now_ms,
            updatedAt=now_ms,
        )
