# Serpent.io backend

FastAPI implementation of the API contract in `../openapi.yaml`, backed by an
in-memory store (no database yet).

## Layout

- `app/models.py` — pydantic schemas mirroring the OpenAPI `components.schemas`.
- `app/security.py` — password hashing (PBKDF2-HMAC-SHA256) and bearer token generation.
- `app/game_engine.py` — port of `frontend/src/game/engine.ts`'s `createGame`/`placeFood`,
  used to compute a new game's initial snake/food placement.
- `app/store.py` — the in-memory `Store` (users, sessions, games, scores) and seed data.
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

Seeded accounts (for manual testing against `/api/v1/auth/signin`): usernames
`pixelviper`, `coilqueen`, `byteboa`, password `snakepit123` for all three.
