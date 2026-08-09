# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This directory is a wrapper around a single project, `snake-social-club/`, which is the actual
git repository (remote: `AlainFidahoussen/snake-social-club`). All commands below assume you've
`cd`ed into `snake-social-club/` or the relevant subdirectory.

- `snake-social-club/frontend/` — the app (TanStack Start / React). This is where nearly all code
  currently lives.
- `snake-social-club/backend/` — a FastAPI implementation of `openapi.yaml`, backed by a
  SQLAlchemy/SQLite database. The frontend talks to it directly over HTTP. Use `uv` for it
  (`uv sync`, `uv add <package>`, `uv run uvicorn app.main:app --reload`, `uv run pytest`).
- `snake-social-club/openapi.yaml` — the backend API contract (OpenAPI 3.1). It mirrors the
  `Services` interface in `frontend/src/services/types.ts` and is the source of truth the backend
  implementation satisfies.

The project was scaffolded and is synced with [Lovable](https://lovable.dev): changes made in the
Lovable editor are committed straight to this repo, so don't be surprised by generated-looking
files (e.g. `src/lib/lovable-error-reporting.ts`).

## Commands

A root-level `Makefile` wraps the commands below for both projects — run `make` with no
arguments from `snake-social-club/` to list targets (`frontend-dev`, `backend-dev`, `dev` for
both at once, `frontend-test`, `backend-tests`, `test` for both, `install`, `frontend-lint`,
`frontend-format`, `frontend-build`, `clean`).

Run from `snake-social-club/frontend/`:

```sh
npm i               # install deps
npm run dev          # start dev server (vite dev)
npm run build        # production build
npm run test          # run all tests (vitest run)
npx vitest run src/game/engine.test.ts   # run a single test file
npx vitest -t "test name"                # run tests matching a name
npm run lint          # eslint .
npm run format        # prettier --write .
```

Run from `snake-social-club/backend/`:

```sh
uv sync                                  # install deps
uv run uvicorn app.main:app --reload      # start dev server on :8000
uv run pytest                             # run all tests
```

## Architecture

### Services layer (backend abstraction)

Every backend call in the frontend goes through a single `Services` object
(`frontend/src/services/types.ts`), obtained via `getServices()` in `frontend/src/services/index.ts`.
It's backed by `frontend/src/services/http.ts`, which calls the FastAPI backend at
`VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`) and keeps the session token in
`localStorage`. `openapi.yaml` at the repo root defines the contract that implementation satisfies.

`getServices()` is lazy (`instance ??= createHttpServices()`) deliberately: TanStack Start's SSR
runtime forbids I/O or randomness at module scope, so nothing can be constructed eagerly.

### Game engine

`frontend/src/game/engine.ts` is the core Snake logic as pure, framework-free functions
(`createGame`, `turn`, `step`, `placeFood`), each taking an injectable `Rand` function for
deterministic testing. `GameMode` is `"walls"` (die on collision) or `"pass-through"` (wrap
around edges). `backend/app/game_engine.py` ports just `createGame`/`placeFood` — enough to
compute a new game's initial snake/food placement; actual gameplay (`turn`/`step`) stays
client-side, with the client publishing results via `updateGame`.

### Backend

`backend/app/` implements `openapi.yaml`, split by concern: `models.py` (pydantic schemas
mirroring the OpenAPI `components.schemas`), `security.py` (PBKDF2 password hashing, bearer
token generation), `db.py` (SQLAlchemy engine/session-factory setup, driven by the `DATABASE_URL`
env var — defaults to a local SQLite file — so swapping in Postgres later is a config change, not
a code change), `db_models.py` (the SQLAlchemy ORM tables: `UserRow`, `SessionRow`, `GameRow`,
`ScoreRow`), `store.py` (the `Store` repository — users, sessions, games, scores — wrapping a
SQLAlchemy session; `get_store` opens one session per request via `app.state.session_factory` and
commits/rolls back around it), `deps.py` (the bearer-token auth dependency), `errors.py`
(`ApiError` + handlers that shape every error response as `{"message": str}`), and `routers/`
(one router per OpenAPI tag: `auth`, `games`, `leaderboard`). The database persists across
restarts.

### Routing

File-based routing via TanStack Start/Router — see `frontend/src/routes/README.md` for the file
naming conventions (dynamic `$id`, splat `$`, layout `_layout`, root `__root.tsx`). Never create
`src/pages/` or Next.js/Remix-style route files. `routeTree.gen.ts` is auto-generated; don't hand-edit it.
`__root.tsx` is the single app shell (`<Outlet />` must stay wired up for child routes to render).

### Path alias

`@/*` maps to `frontend/src/*` (configured in `tsconfig.json`, consumed via `vite-tsconfig-paths`
in both `vite.config.ts` and `vitest.config.ts`).

### Style

Prettier is authoritative for formatting (100 col width, double quotes, trailing commas) —
run `npm run format` rather than hand-formatting. ESLint's `no-unused-vars` is off in favor of
TypeScript's own checks; `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are on in
`tsconfig.json`, so array/object indexing is typed as possibly-`undefined` throughout.
