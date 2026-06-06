"""CropGuard Database Configuration.

Provides the async SQLAlchemy engine, session factory, and
the declarative Base imported by all models.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.base import Base  # noqa: F401 — re-exported for Alembic

safeguarded_url = settings.DATABASE_URL.replace(
    "postgresql+asyncpg", "postgresql+psycopg"
)

engine = create_async_engine(
    safeguarded_url,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """FastAPI dependency that provides a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables() -> None:
    """Create all tables. Used by Alembic and test setup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
