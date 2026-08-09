"""Pydantic schemas mirroring the components in openapi.yaml."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

GameMode = Literal["walls", "pass-through"]
GameStatus = Literal["active", "over"]


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Point(ApiModel):
    x: int
    y: int


class User(ApiModel):
    id: str
    username: str


class Session(ApiModel):
    token: str
    user: User


class Credentials(ApiModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=6)


class ScoreEntry(ApiModel):
    id: str
    userId: str
    username: str
    mode: GameMode
    score: int
    createdAt: int


class GameSnapshot(ApiModel):
    id: str
    userId: str
    username: str
    mode: GameMode
    gridSize: int
    snake: list[Point]
    food: Point
    score: int
    status: GameStatus
    startedAt: int
    updatedAt: int


class Error(ApiModel):
    message: str


class CreateGameRequest(ApiModel):
    mode: GameMode
    gridSize: int = Field(ge=1)


class UpdateGameRequest(ApiModel):
    snake: list[Point]
    food: Point
    score: int = Field(ge=0)
    status: GameStatus


class SubmitScoreRequest(ApiModel):
    mode: GameMode
    score: int = Field(ge=0)
