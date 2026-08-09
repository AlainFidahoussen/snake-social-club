from fastapi import APIRouter, FastAPI

from .errors import register_exception_handlers
from .routers import auth, games, leaderboard
from .store import Store, seed_store


def create_app() -> FastAPI:
    app = FastAPI(title="Serpent.io API", version="0.1.0")
    app.state.store = Store()
    seed_store(app.state.store)

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
