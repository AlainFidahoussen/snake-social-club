"""Port of frontend/src/game/engine.ts's initial-state logic.

Only createGame/placeFood are ported: gameplay itself (turn/step) runs
client-side, and the client publishes the resulting state via updateGame.
"""

import random
from collections.abc import Callable
from dataclasses import dataclass

from .models import GameMode, Point

DEFAULT_GRID_SIZE = 20

Rand = Callable[[], float]


@dataclass
class GameState:
    grid_size: int
    mode: GameMode
    snake: list[Point]
    food: Point


def place_food(grid_size: int, snake: list[Point], rand: Rand = random.random) -> Point:
    occupied = {(p.x, p.y) for p in snake}
    free = [
        Point(x=x, y=y)
        for y in range(grid_size)
        for x in range(grid_size)
        if (x, y) not in occupied
    ]
    if not free:
        return Point(x=snake[0].x, y=snake[0].y)
    index = min(len(free) - 1, int(rand() * len(free)))
    return free[index]


def create_game(mode: GameMode, grid_size: int = DEFAULT_GRID_SIZE, rand: Rand = random.random) -> GameState:
    mid = grid_size // 2
    snake = [Point(x=mid, y=mid), Point(x=mid - 1, y=mid), Point(x=mid - 2, y=mid)]
    return GameState(grid_size=grid_size, mode=mode, snake=snake, food=place_food(grid_size, snake, rand))
