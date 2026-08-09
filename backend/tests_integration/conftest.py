from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client(tmp_path: Path) -> Iterator[TestClient]:
    db_path = tmp_path / "integration.db"
    app = create_app(database_url=f"sqlite:///{db_path}")
    with TestClient(app) as test_client:
        yield test_client
