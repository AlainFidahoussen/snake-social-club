from fastapi.testclient import TestClient


def test_submit_score_requires_auth(client: TestClient) -> None:
    response = client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 100})
    assert response.status_code == 401


def test_submit_score(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/leaderboard/scores", json={"mode": "walls", "score": 100}, headers=auth_headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["mode"] == "walls"
    assert body["score"] == 100
    assert body["username"] == "newplayer"


def test_top_scores_filters_by_mode_and_sorts_desc(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 5}, headers=auth_headers)
    client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 500}, headers=auth_headers)
    client.post("/api/v1/leaderboard/scores", json={"mode": "pass-through", "score": 999}, headers=auth_headers)

    response = client.get("/api/v1/leaderboard/scores", params={"mode": "walls"})
    assert response.status_code == 200
    scores = response.json()
    assert all(entry["mode"] == "walls" for entry in scores)
    assert scores[0]["score"] == 500


def test_top_scores_respects_limit(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 10}, headers=auth_headers)
    other_signup = client.post("/api/v1/auth/signup", json={"username": "otherplayer", "password": "hunter22"})
    other_headers = {"Authorization": f"Bearer {other_signup.json()['token']}"}
    client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 20}, headers=other_headers)

    response = client.get("/api/v1/leaderboard/scores", params={"mode": "walls", "limit": 1})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_top_scores_requires_mode(client: TestClient) -> None:
    response = client.get("/api/v1/leaderboard/scores")
    assert response.status_code == 400


def test_top_scores_shows_each_player_once(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 50}, headers=auth_headers)
    client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 200}, headers=auth_headers)
    client.post("/api/v1/leaderboard/scores", json={"mode": "walls", "score": 120}, headers=auth_headers)

    response = client.get("/api/v1/leaderboard/scores", params={"mode": "walls"})
    scores = response.json()

    usernames = [entry["username"] for entry in scores]
    assert usernames.count("newplayer") == 1
    entry = next(e for e in scores if e["username"] == "newplayer")
    assert entry["score"] == 200
