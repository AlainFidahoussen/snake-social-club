import os
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .db import Base, create_engine_and_session_factory
from .errors import ApiError, register_exception_handlers
from .routers import auth, games, leaderboard

# Built by `npm run build` into frontend/.output/public (see frontend/vite.config.ts).
DEFAULT_FRONTEND_DIST_DIR = "../frontend/.output/public"


def create_app(database_url: str | None = None) -> FastAPI:
    app = FastAPI(title="Serpent.io API", version="0.1.0")

    engine, session_factory = create_engine_and_session_factory(database_url)
    Base.metadata.create_all(engine)
    app.state.session_factory = session_factory

    # Dev-only: frontend and backend run on different localhost ports.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    api_router = APIRouter(prefix="/api/v1")
    api_router.include_router(auth.router)
    api_router.include_router(games.router)
    api_router.include_router(leaderboard.router)
    app.include_router(api_router)

    # Serve the built frontend as a static SPA. Only present when it's actually been built (e.g.
    # in the Docker image); absent in local dev, where the Vite dev server serves the frontend on
    # its own port instead.
    frontend_dist = Path(os.environ.get("FRONTEND_DIST_DIR", DEFAULT_FRONTEND_DIST_DIR))
    if frontend_dist.is_dir():

        @app.get("/{full_path:path}")
        def serve_frontend(full_path: str) -> FileResponse:
            if full_path == "health" or full_path.startswith("api/"):
                raise ApiError(404, "Not Found")
            candidate = frontend_dist / full_path
            if candidate.is_file():
                return FileResponse(candidate)
            index_candidate = candidate / "index.html"
            if index_candidate.is_file():
                return FileResponse(index_candidate)
            return FileResponse(frontend_dist / "index.html")

    return app


app = create_app()
