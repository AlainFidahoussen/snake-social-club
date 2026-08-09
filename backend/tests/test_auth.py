from fastapi.testclient import TestClient


def test_signup_creates_session(client: TestClient) -> None:
    response = client.post("/api/v1/auth/signup", json={"username": "newplayer", "password": "hunter22"})
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["username"] == "newplayer"
    assert body["token"]


def test_signup_rejects_duplicate_username(client: TestClient) -> None:
    client.post("/api/v1/auth/signup", json={"username": "dupe", "password": "hunter22"})
    response = client.post("/api/v1/auth/signup", json={"username": "dupe", "password": "hunter22"})
    assert response.status_code == 400
    assert response.json() == {"message": "That username is taken."}


def test_signup_rejects_username_case_insensitively(client: TestClient) -> None:
    client.post("/api/v1/auth/signup", json={"username": "DupeUser", "password": "hunter22"})
    response = client.post("/api/v1/auth/signup", json={"username": "dupeuser", "password": "hunter22"})
    assert response.status_code == 400


def test_signup_rejects_short_password(client: TestClient) -> None:
    response = client.post("/api/v1/auth/signup", json={"username": "shortpw", "password": "abc"})
    assert response.status_code == 400
    assert "message" in response.json()


def test_signin_with_existing_user(client: TestClient) -> None:
    client.post("/api/v1/auth/signup", json={"username": "returningplayer", "password": "hunter22"})
    response = client.post("/api/v1/auth/signin", json={"username": "returningplayer", "password": "hunter22"})
    assert response.status_code == 200
    assert response.json()["user"]["username"] == "returningplayer"


def test_signin_rejects_wrong_password(client: TestClient) -> None:
    client.post("/api/v1/auth/signup", json={"username": "returningplayer", "password": "hunter22"})
    response = client.post("/api/v1/auth/signin", json={"username": "returningplayer", "password": "wrongpass"})
    assert response.status_code == 401
    assert response.json() == {"message": "Invalid username or password."}


def test_signin_rejects_unknown_user(client: TestClient) -> None:
    response = client.post("/api/v1/auth/signin", json={"username": "nobody", "password": "hunter22"})
    assert response.status_code == 401


def test_get_session_requires_token(client: TestClient) -> None:
    response = client.get("/api/v1/auth/session")
    assert response.status_code == 401


def test_get_session_with_valid_token(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/v1/auth/session", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["user"]["username"] == "newplayer"


def test_get_session_with_invalid_token(client: TestClient) -> None:
    response = client.get("/api/v1/auth/session", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_signout_invalidates_token(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/v1/auth/signout", headers=auth_headers)
    assert response.status_code == 204

    response = client.get("/api/v1/auth/session", headers=auth_headers)
    assert response.status_code == 401


def test_signout_requires_token(client: TestClient) -> None:
    response = client.post("/api/v1/auth/signout")
    assert response.status_code == 401
