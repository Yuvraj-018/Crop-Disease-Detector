"""CropGuard Application Configuration.

All configuration values are loaded from environment variables.
Import and use the `settings` singleton from this module.
"""

from typing import Annotated

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: Annotated[
        str, Field(description="Async PostgreSQL DSN (asyncpg driver).")
    ]

    SECRET_KEY: Annotated[
        str,
        Field(
            description="Secret key for JWT signing. Must be at least 32 characters.",
            min_length=32,
        ),
    ]

    REDIS_URL: Annotated[str, Field(description="Redis connection URL.")]

    ALLOWED_ORIGINS: Annotated[
        list[str],
        Field(
            default=["http://localhost:5173"],
            description="List of allowed CORS origins.",
        ),
    ] = ["http://localhost:5173"]

    ACCESS_TOKEN_EXPIRE_MINUTES: Annotated[
        int,
        Field(default=10080, description="JWT expiry in minutes. Default is 7 days."),
    ] = 10080

    MAX_UPLOAD_SIZE_MB: Annotated[
        int,
        Field(default=10, description="Maximum allowed upload size in megabytes."),
    ] = 10

    UPLOAD_DIR: Annotated[
        str,
        Field(default="uploads", description="Directory for uploaded images."),
    ] = "uploads"

    ENVIRONMENT: Annotated[
        str,
        Field(default="development", description="Deployment environment name."),
    ] = "development"


settings = Settings()
