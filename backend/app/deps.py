from typing import Annotated

from fastapi import Depends, Header

from .errors import ApiError
from .store import Store, StoredUser, get_store


def get_bearer_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise ApiError(401, "Missing or invalid token.")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise ApiError(401, "Missing or invalid token.")
    return token


def get_current_user(
    token: Annotated[str, Depends(get_bearer_token)],
    store: Annotated[Store, Depends(get_store)],
) -> StoredUser:
    user_id = store.sessions.get(token)
    if user_id is None:
        raise ApiError(401, "Missing or invalid token.")
    user = store.users.get(user_id)
    if user is None:
        raise ApiError(401, "Missing or invalid token.")
    return user
