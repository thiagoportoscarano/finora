from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Finora API"
    app_env: Literal["development", "production", "test"] = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./finora.db"

    jwt_secret_key: str
    jwt_algorithm: Literal["HS256"] = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    password_reset_minutes: int = 30

    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_domain: str | None = None

    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173"

    email_backend: Literal["console", "smtp"] = "console"
    email_from: str = ""
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_starttls: bool = True

    @field_validator("cookie_domain", "smtp_host", "smtp_username", "smtp_password", mode="before")
    @classmethod
    def empty_optional_values_are_none(cls, value: str | None) -> str | None:
        return None if value == "" else value

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_secret_length(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("JWT_SECRET_KEY precisa ter pelo menos 32 caracteres.")
        return value

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError("COOKIE_SECURE precisa ser true quando COOKIE_SAMESITE=none.")
        if self.email_backend == "smtp" and not self.smtp_host:
            raise ValueError("Configure SMTP_HOST quando EMAIL_BACKEND=smtp.")
        if self.email_backend == "smtp" and not self.email_from:
            raise ValueError("Configure EMAIL_FROM com um remetente válido quando EMAIL_BACKEND=smtp.")
        if self.app_env == "production":
            if self.email_backend == "console":
                raise ValueError("Em produção, configure EMAIL_BACKEND=smtp.")
            if not self.cookie_secure:
                raise ValueError("Em produção, COOKIE_SECURE precisa ser true.")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
