from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, create_engine_and_session_factory
from .errors import register_exception_handlers
from .routers import auth, games, leaderboard


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

    return app


app = create_app()
