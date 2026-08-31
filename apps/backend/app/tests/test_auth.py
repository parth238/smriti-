from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_me_without_token_is_401() -> None:
    response = client.get("/api/v1/me")
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "AUTHENTICATION_ERROR"


def test_register_rejects_short_password() -> None:
    response = client.post(
        "/api/v1/auth/caregiver/register",
        json={
            "name": "Test",
            "phone": "9876543210",
            "email": "test@example.com",
            "password": "short",
        },
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_register_validation_error_shape() -> None:
    response = client.post(
        "/api/v1/auth/caregiver/register",
        json={"name": "Test", "phone": "9876543210", "email": "bad", "password": "short"},
    )
    assert response.status_code == 422
    body = response.json()
    assert "error" in body
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "message" in body["error"]
