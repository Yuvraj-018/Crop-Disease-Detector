"""Pytest configuration and shared fixtures for CropGuard tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import AsyncSessionLocal, create_tables, engine
from app.main import app
from app.models.base import Base


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Create all tables before tests and drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    """Provide a clean database session per test."""
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture
async def client():
    """Provide an async HTTP test client for the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
