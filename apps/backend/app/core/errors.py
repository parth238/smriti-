class SmritiError(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.field = field


class ValidationError(SmritiError):
    status_code = 400
    error_code = "VALIDATION_ERROR"


class AuthenticationError(SmritiError):
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"


class AuthorizationError(SmritiError):
    status_code = 403
    error_code = "AUTHORIZATION_ERROR"


class NotFoundError(SmritiError):
    status_code = 404
    error_code = "NOT_FOUND"


class ConflictError(SmritiError):
    status_code = 409
    error_code = "CONFLICT"


class RateLimitError(SmritiError):
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"
