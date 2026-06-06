"""Quick smoke-test: hit /register, /login, and /me inside the container."""
import asyncio
import sys

from httpx import ASGITransport, AsyncClient

import app.models  # noqa: F401 — ensure all models registered
from app.main import app


async def run():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        # 1. Register
        r = await c.post(
            "/api/v1/auth/register",
            json={"email": "smoke@test.com", "password": "Test1234!", "full_name": "Smoke User"},
        )
        print(f"[register] {r.status_code} {r.text[:800]}")
        if r.status_code != 201:
            sys.exit(1)

        token = r.json()["access_token"]

        # 2. Login
        r = await c.post(
            "/api/v1/auth/login",
            json={"email": "smoke@test.com", "password": "Test1234!"},
        )
        print(f"[login] {r.status_code} {r.text[:400]}")

        # 3. /me
        r = await c.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        print(f"[/me] {r.status_code} {r.text[:400]}")

        # 4. Duplicate email → 409
        r = await c.post(
            "/api/v1/auth/register",
            json={"email": "smoke@test.com", "password": "Test1234!", "full_name": "Smoke User"},
        )
        print(f"[duplicate] {r.status_code} (expected 409)")

        # 5. Wrong password → 401
        r = await c.post(
            "/api/v1/auth/login",
            json={"email": "smoke@test.com", "password": "wrong"},
        )
        print(f"[bad-login] {r.status_code} (expected 401)")

        print("\n=== ALL CHECKS DONE ===")


asyncio.run(run())
