# Serpent.io backend

FastAPI implementation of the API contract in `../openapi.yaml`, backed by a SQLAlchemy/SQLite
database (see `DATABASE_URL` below).

## Layout

- `app/models.py` — pydantic schemas mirroring the OpenAPI `components.schemas`.
- `app/security.py` — password hashing (PBKDF2-HMAC-SHA256) and bearer token generation.
- `app/game_engine.py` — port of `frontend/src/game/engine.ts`'s `createGame`/`placeFood`,
  used to compute a new game's initial snake/food placement.
- `app/db.py` — SQLAlchemy engine/session-factory setup, driven by the `DATABASE_URL` env var
  (defaults to a local `snake_social_club.db` SQLite file).
- `app/db_models.py` — the SQLAlchemy ORM tables (`UserRow`, `SessionRow`, `GameRow`, `ScoreRow`).
- `app/store.py` — the `Store` repository (users, sessions, games, scores) wrapping a SQLAlchemy
  session.
- `app/deps.py` — bearer-token auth dependencies (`get_current_user`).
- `app/errors.py` — `ApiError` and exception handlers that shape every error response as
  `{"message": str}`, matching the OpenAPI `Error` schema.
- `app/routers/` — one router per OpenAPI tag (`auth`, `games`, `leaderboard`).
- `app/main.py` — `create_app()` wires everything together under the `/api/v1` prefix.

## Commands

```sh
uv sync                       # install deps
uv run uvicorn app.main:app --reload   # start dev server on :8000
uv run pytest                 # run tests
```

## Database

Set `DATABASE_URL` to any SQLAlchemy connection string to pick the database (e.g.
`postgresql+psycopg://user:pass@host/dbname` once Postgres support is added); it defaults to a
local `sqlite:///./snake_social_club.db` file if unset.
