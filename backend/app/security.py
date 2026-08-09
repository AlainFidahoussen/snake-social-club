import hashlib
import hmac
import os
import secrets

_PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> tuple[bytes, bytes]:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return digest, salt


def verify_password(password: str, digest: bytes, salt: bytes) -> bool:
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return hmac.compare_digest(candidate, digest)


def generate_token() -> str:
    return secrets.token_urlsafe(32)
