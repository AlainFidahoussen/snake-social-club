from fastapi.testclient import TestClient


def test_create_game_requires_auth(client: TestClient) -> None:
    response = client.post("/api/v1/games", json={"mode": "walls", "gridSize": 20})
    assert response.status_code == 401


def test_create_game(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/v1/games", json={"mode": "walls", "gridSize": 20}, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["mode"] == "walls"
    assert body["gridSize"] == 20
    assert body["status"] == "active"
    assert body["score"] == 0
    assert len(body["snake"]) == 3


def test_list_active_games_sorted_by_score_desc(client: TestClient, auth_headers: dict[str, str]) -> None:
    low = client.post(
        "/api/v1/games", json={"mode": "walls", "gridSize": 20}, headers=auth_headers
    ).json()
    high = client.post(
        "/api/v1/games", json={"mode": "walls", "gridSize": 20}, headers=auth_headers
    ).json()
    client.patch(
        f"/api/v1/games/{high['id']}",
        json={"snake": high["snake"], "food": high["food"], "score": 50, "status": "active"},
        headers=auth_headers,
    )

    response = client.get("/api/v1/games/active")
    assert response.status_code == 200
    games = response.json()
    ids = [g["id"] for g in games]
    assert ids.index(high["id"]) < ids.index(low["id"])
    scores = [g["score"] for g in games]
    assert scores == sorted(scores, reverse=True)


def test_get_game(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/v1/games", json={"mode": "pass-through", "gridSize": 10}, headers=auth_headers
    ).json()

    response = client.get(f"/api/v1/games/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_game_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/games/does-not-exist")
    assert response.status_code == 404
    assert response.json() == {"message": "No game with this id."}


def test_update_game(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/v1/games", json={"mode": "walls", "gridSize": 20}, headers=auth_headers
    ).json()

    response = client.patch(
        f"/api/v1/games/{created['id']}",
        json={
            "snake": [{"x": 5, "y": 5}, {"x": 4, "y": 5}],
            "food": {"x": 1, "y": 1},
            "score": 10,
            "status": "active",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 10
    assert body["snake"] == [{"x": 5, "y": 5}, {"x": 4, "y": 5}]
    assert body["updatedAt"] >= created["updatedAt"]


def test_update_game_requires_auth(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/v1/games", json={"mode": "walls", "gridSize": 20}, headers=auth_headers
    ).json()

    response = client.patch(
        f"/api/v1/games/{created['id']}",
        json={"snake": [], "food": {"x": 0, "y": 0}, "score": 0, "status": "active"},
    )
    assert response.status_code == 401


def test_update_game_rejects_other_players_game(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/v1/games", json={"mode": "walls", "gridSize": 20}, headers=auth_headers
    ).json()

    other_signup = client.post("/api/v1/auth/signup", json={"username": "otherplayer", "password": "hunter22"})
    other_headers = {"Authorization": f"Bearer {other_signup.json()['token']}"}

    response = client.patch(
        f"/api/v1/games/{created['id']}",
        json={"snake": [], "food": {"x": 0, "y": 0}, "score": 0, "status": "active"},
        headers=other_headers,
    )
    assert response.status_code == 403


def test_update_game_not_found(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch(
        "/api/v1/games/does-not-exist",
        json={"snake": [], "food": {"x": 0, "y": 0}, "score": 0, "status": "active"},
        headers=auth_headers,
    )
    assert response.status_code == 404
