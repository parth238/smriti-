from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

WEAK_JWT_SECRETS = frozenset(
    {
        "replace-with-a-32-byte-random-string",
        "changeme",
        "secret",
        "ci-test-secret-do-not-use-in-prod",
    }
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "development"
    app_name: str = "Smriti API"
    api_v1_prefix: str = "/api/v1"
    debug: bool = True

    database_url: str = "postgresql://smriti:smriti_dev@localhost:5432/smriti_dev"

    jwt_secret_key: str = "replace-with-a-32-byte-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    elderly_access_token_expire_days: int = 30
    refresh_token_expire_days: int = 30

    storage_public_url_base: str = ""

    allowed_origins: str = (
        "http://localhost:5173,http://localhost:5174,"
        "https://app.smriti.in,https://caregiver.smriti.in"
    )

    login_max_attempts: int = 5
    login_lockout_minutes: int = 15

    upload_dir: str = "uploads"

    @field_validator("jwt_secret_key")
    @classmethod
    def jwt_secret_must_be_strong(cls, value: str, info) -> str:
        env = info.data.get("env", "development")
        if env == "production" and (
            value in WEAK_JWT_SECRETS or len(value.strip()) < 32
        ):
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters and not a placeholder in production"
            )
        return value

    @property
    def allowed_origins_list(self) -> list[str]:
        return [
            item.strip() for item in self.allowed_origins.split(",") if item.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
