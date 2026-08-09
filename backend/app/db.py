"""Engine/session setup. Database-agnostic: DATABASE_URL picks the SQLAlchemy
dialect (defaults to a local SQLite file for dev); swapping in Postgres later
is a matter of pointing the env var at it, no code changes required."""

import os

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

DEFAULT_DATABASE_URL = "sqlite:///./snake_social_club.db"


class Base(DeclarativeBase):
    pass


def create_engine_and_session_factory(database_url: str | None = None) -> tuple[Engine, sessionmaker]:
    url = database_url or os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)

    connect_args: dict[str, bool] = {}
    poolclass = None
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        if ":memory:" in url:
            # A plain in-memory DB gets a fresh connection (and thus a fresh,
            # empty database) per checkout unless pinned to a single one.
            poolclass = StaticPool

    engine = create_engine(url, connect_args=connect_args, poolclass=poolclass)
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    return engine, session_factory
