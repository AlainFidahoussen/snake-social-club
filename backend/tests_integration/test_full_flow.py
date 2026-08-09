from fastapi.testclient import TestClient


def test_sign_up_sign_in_submit_score_and_read_leaderboard(client: TestClient) -> None:
    signup = client.post(
        "/api/v1/auth/signup", json={"username": "integrationplayer", "password": "hunter22"}
    )
    assert signup.status_code == 201

    signin = client.post(
        "/api/v1/auth/signin", json={"username": "integrationplayer", "password": "hunter22"}
    )
    assert signin.status_code == 200
    token = signin.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    submit = client.post(
        "/api/v1/leaderboard/scores", json={"mode": "walls", "score": 42}, headers=headers
    )
    assert submit.status_code == 201

    leaderboard = client.get("/api/v1/leaderboard/scores", params={"mode": "walls"})
    assert leaderboard.status_code == 200
    scores = leaderboard.json()
    assert any(
        entry["username"] == "integrationplayer" and entry["score"] == 42 for entry in scores
    )
