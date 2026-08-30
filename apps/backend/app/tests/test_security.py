from datetime import timedelta

from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_round_trip() -> None:
    hashed = hash_password("correct-horse")
    assert hashed != "correct-horse"
    assert verify_password("correct-horse", hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_access_token_decodes_role() -> None:
    token = create_access_token(
        "11111111-1111-1111-1111-111111111111",
        "caregiver",
        timedelta(minutes=5),
    )
    payload = decode_token(token)
    assert payload["role"] == "caregiver"
    assert payload["sub"] == "11111111-1111-1111-1111-111111111111"
