from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    allowed_origins: str = (
        "http://localhost:5173,http://localhost:5174,"
        "https://app.smriti.in,https://caregiver.smriti.in"
    )

    login_max_attempts: int = 5
    login_lockout_minutes: int = 15

    @property
    def allowed_origins_list(self) -> list[str]:
        return [
            item.strip() for item in self.allowed_origins.split(",") if item.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
