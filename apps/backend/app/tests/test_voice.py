from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_voice_status_endpoint():
    response = client.get("/api/v1/voice/status")
    assert response.status_code == 200
    body = response.json()
    assert "bhashini_assamese_tts" in body
    assert body["bhashini_assamese_tts"] is False


def test_assamese_tts_unconfigured_returns_503():
    response = client.post(
        "/api/v1/voice/assamese-tts",
        json={"text": "নমস্কাৰ"},
    )
    assert response.status_code == 503
