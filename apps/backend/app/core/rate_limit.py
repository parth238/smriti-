from datetime import datetime, timedelta, timezone
from threading import Lock

from app.core.config import settings
from app.core.errors import RateLimitError

_attempts: dict[str, list[datetime]] = {}
_lockouts: dict[str, datetime] = {}
_lock = Lock()


def assert_not_locked(key: str) -> None:
    now = datetime.now(timezone.utc)
    with _lock:
        until = _lockouts.get(key)
        if until and until > now:
            raise RateLimitError("Too many attempts. Please wait and try again.")
        if until and until <= now:
            _lockouts.pop(key, None)
            _attempts.pop(key, None)


def record_failure(key: str) -> None:
    now = datetime.now(timezone.utc)
    window = now - timedelta(minutes=1)
    with _lock:
        recent = [stamp for stamp in _attempts.get(key, []) if stamp > window]
        recent.append(now)
        _attempts[key] = recent
        if len(recent) >= settings.login_max_attempts:
            _lockouts[key] = now + timedelta(minutes=settings.login_lockout_minutes)


def clear_failures(key: str) -> None:
    with _lock:
        _attempts.pop(key, None)
        _lockouts.pop(key, None)
