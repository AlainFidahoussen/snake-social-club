"""SQLAlchemy ORM tables backing the Store (see store.py)."""

from sqlalchemy import JSON, BigInteger, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class UserRow(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[bytes] = mapped_column(LargeBinary)
    password_salt: Mapped[bytes] = mapped_column(LargeBinary)


class SessionRow(Base):
    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))


class GameRow(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    username: Mapped[str]
    mode: Mapped[str]
    grid_size: Mapped[int]
    snake: Mapped[list[dict[str, int]]] = mapped_column(JSON)
    food: Mapped[dict[str, int]] = mapped_column(JSON)
    score: Mapped[int]
    status: Mapped[str]
    started_at: Mapped[int] = mapped_column(BigInteger)
    updated_at: Mapped[int] = mapped_column(BigInteger)


class ScoreRow(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    username: Mapped[str]
    mode: Mapped[str]
    score: Mapped[int]
    created_at: Mapped[int] = mapped_column(BigInteger)
