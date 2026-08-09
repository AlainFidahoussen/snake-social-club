from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Response

from ..deps import get_bearer_token, get_current_user
from ..errors import ApiError
from ..models import Credentials, Session, User
from ..security import generate_token, hash_password, verify_password
from ..store import Store, StoredUser, get_store

router = APIRouter(prefix="/auth", tags=["auth"])


def _start_session(store: Store, user: StoredUser) -> Session:
    token = generate_token()
    store.sessions[token] = user.id
    return Session(token=token, user=User(id=user.id, username=user.username))


@router.post("/signup", status_code=201, response_model=Session)
def sign_up(credentials: Credentials, store: Annotated[Store, Depends(get_store)]) -> Session:
    if store.find_user_by_username(credentials.username) is not None:
        raise ApiError(400, "That username is taken.")
    digest, salt = hash_password(credentials.password)
    user = StoredUser(
        id=uuid4().hex[:12],
        username=credentials.username.strip(),
        password_hash=digest,
        password_salt=salt,
    )
    store.users[user.id] = user
    return _start_session(store, user)


@router.post("/signin", response_model=Session)
def sign_in(credentials: Credentials, store: Annotated[Store, Depends(get_store)]) -> Session:
    user = store.find_user_by_username(credentials.username)
    if user is None or not verify_password(credentials.password, user.password_hash, user.password_salt):
        raise ApiError(401, "Invalid username or password.")
    return _start_session(store, user)


@router.post("/signout", status_code=204)
def sign_out(
    token: Annotated[str, Depends(get_bearer_token)],
    _user: Annotated[StoredUser, Depends(get_current_user)],
    store: Annotated[Store, Depends(get_store)],
) -> Response:
    del store.sessions[token]
    return Response(status_code=204)


@router.get("/session", response_model=Session)
def get_session(
    token: Annotated[str, Depends(get_bearer_token)],
    user: Annotated[StoredUser, Depends(get_current_user)],
) -> Session:
    return Session(token=token, user=User(id=user.id, username=user.username))
