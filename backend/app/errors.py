from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """An error response matching the `Error` schema in openapi.yaml."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"message": exc.message})

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        first = exc.errors()[0]
        field = ".".join(str(part) for part in first["loc"] if part not in ("body", "query"))
        message = f"{field}: {first['msg']}" if field else first["msg"]
        return JSONResponse(status_code=400, content={"message": message})
