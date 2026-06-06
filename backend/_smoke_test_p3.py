"""Phase 3 smoke test — validates all Core API endpoints inside the container.

Tests:
  1. GET /crops → list (5 records)
  2. GET /crops/{id} → single crop
  3. GET /diseases → paginated
  4. GET /diseases/{id} → nested crop + treatments
  5. GET /treatments → paginated
  6. POST /predictions (multipart JPEG upload)
  7. GET /predictions → list (≥ 1)
  8. GET /predictions/{id} → detail with nested disease + treatments
  9. PATCH /predictions/{id}/feedback → 200
  10. GET /stats/overview → real aggregated data
  11. GET /stats/outbreak → array (can be empty)
  12. Admin: GET /admin/users 403 for non-admin
"""
import asyncio
import io
import os
import struct
import sys
import zlib

from httpx import ASGITransport, AsyncClient

import app.models  # noqa: F401
from app.main import app

# Minimal valid 1×1 white PNG (67 bytes)
def minimal_png() -> bytes:
    def chunk(name: bytes, data: bytes) -> bytes:
        c = zlib.crc32(name + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + name + data + struct.pack(">I", c)

    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 200, 200, 8, 2, 0, 0, 0))
    raw = b"\x00" + b"\xFF\xFF\xFF" * 200  # one row: filter byte + RGB pixels
    idat = chunk(b"IDAT", zlib.compress(raw * 200))
    iend = chunk(b"IEND", b"")
    return b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend


async def run():
    ok = True

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:

        # ── Register & login ────────────────────────────────────────────────
        r = await c.post(
            "/api/v1/auth/register",
            json={
                "email": "phase3@test.com",
                "password": "Test1234!",
                "full_name": "Phase Three",
            },
        )
        if r.status_code not in (201, 409):
            print(f"FAIL register: {r.status_code} {r.text[:200]}")
            ok = False

        r = await c.post(
            "/api/v1/auth/login",
            json={"email": "phase3@test.com", "password": "Test1234!"},
        )
        assert r.status_code == 200, f"login failed: {r.text[:200]}"
        token = r.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        # ── 1. GET /crops ────────────────────────────────────────────────────
        r = await c.get("/api/v1/crops")
        crops = r.json()
        pass_fail = "✅" if r.status_code == 200 and len(crops) == 5 else "❌"
        print(f"{pass_fail} [1] GET /crops → {r.status_code}, count={len(crops)}")
        if pass_fail == "❌":
            ok = False
        crop_id = crops[0]["id"]

        # ── 2. GET /crops/{id} ───────────────────────────────────────────────
        r = await c.get(f"/api/v1/crops/{crop_id}")
        pass_fail = "✅" if r.status_code == 200 else "❌"
        print(f"{pass_fail} [2] GET /crops/{{id}} → {r.status_code}")
        if pass_fail == "❌":
            ok = False

        # ── 3. GET /diseases ─────────────────────────────────────────────────
        r = await c.get("/api/v1/diseases?per_page=5")
        data = r.json()
        pass_fail = "✅" if r.status_code == 200 and data["total"] == 15 else "❌"
        print(f"{pass_fail} [3] GET /diseases → {r.status_code}, total={data.get('total')}")
        if pass_fail == "❌":
            ok = False
        disease_id = data["items"][0]["id"]

        # ── 4. GET /diseases/{id} ────────────────────────────────────────────
        r = await c.get(f"/api/v1/diseases/{disease_id}")
        d = r.json()
        has_treatments = isinstance(d.get("treatments"), list) and len(d["treatments"]) > 0
        pass_fail = "✅" if r.status_code == 200 and has_treatments else "❌"
        print(f"{pass_fail} [4] GET /diseases/{{id}} → {r.status_code}, treatments={len(d.get('treatments', []))}")
        if pass_fail == "❌":
            ok = False

        # ── 5. GET /treatments ───────────────────────────────────────────────
        r = await c.get("/api/v1/treatments?per_page=5")
        data = r.json()
        pass_fail = "✅" if r.status_code == 200 and data["total"] == 30 else "❌"
        print(f"{pass_fail} [5] GET /treatments → {r.status_code}, total={data.get('total')}")
        if pass_fail == "❌":
            ok = False

        # ── 6. POST /predictions ─────────────────────────────────────────────
        png_bytes = minimal_png()
        files = {"image": ("leaf.png", io.BytesIO(png_bytes), "image/png")}
        r = await c.post("/api/v1/predictions", files=files, headers=auth)
        pass_fail = "✅" if r.status_code == 201 else "❌"
        pred_data = r.json() if r.status_code == 201 else {}
        confidence = pred_data.get("confidence", "N/A")
        is_healthy = pred_data.get("is_healthy", "N/A")
        print(f"{pass_fail} [6] POST /predictions → {r.status_code}, is_healthy={is_healthy}, confidence={confidence}")
        if pass_fail == "❌":
            print(f"    body: {r.text[:300]}")
            ok = False
        pred_id = pred_data.get("id")

        # ── 7. GET /predictions ──────────────────────────────────────────────
        r = await c.get("/api/v1/predictions", headers=auth)
        data = r.json()
        pass_fail = "✅" if r.status_code == 200 and data["total"] >= 1 else "❌"
        print(f"{pass_fail} [7] GET /predictions → {r.status_code}, total={data.get('total')}")
        if pass_fail == "❌":
            ok = False

        # ── 8. GET /predictions/{id} ─────────────────────────────────────────
        if pred_id:
            r = await c.get(f"/api/v1/predictions/{pred_id}", headers=auth)
            d = r.json()
            has_top = isinstance(d.get("top_predictions"), list)
            pass_fail = "✅" if r.status_code == 200 and has_top else "❌"
            print(f"{pass_fail} [8] GET /predictions/{{id}} → {r.status_code}, has_top5={has_top}")
            if pass_fail == "❌":
                ok = False

        # ── 9. PATCH /predictions/{id}/feedback ──────────────────────────────
        if pred_id:
            r = await c.patch(
                f"/api/v1/predictions/{pred_id}/feedback",
                json={"feedback": "correct", "notes": "looks right"},
                headers=auth,
            )
            pass_fail = "✅" if r.status_code == 200 else "❌"
            print(f"{pass_fail} [9] PATCH feedback → {r.status_code}")
            if pass_fail == "❌":
                ok = False

        # ── 10. GET /stats/overview ───────────────────────────────────────────
        r = await c.get("/api/v1/stats/overview", headers=auth)
        d = r.json()
        pass_fail = "✅" if r.status_code == 200 and d.get("total_scans", 0) >= 1 else "❌"
        print(f"{pass_fail} [10] GET /stats/overview → {r.status_code}, total_scans={d.get('total_scans')}")
        if pass_fail == "❌":
            print(f"    body: {r.text[:300]}")
            ok = False

        # ── 11. GET /stats/outbreak ───────────────────────────────────────────
        r = await c.get("/api/v1/stats/outbreak")
        pass_fail = "✅" if r.status_code == 200 and isinstance(r.json(), list) else "❌"
        print(f"{pass_fail} [11] GET /stats/outbreak → {r.status_code}, records={len(r.json())}")
        if pass_fail == "❌":
            ok = False

        # ── 12. Admin 403 for non-admin ───────────────────────────────────────
        r = await c.get("/api/v1/admin/users", headers=auth)
        pass_fail = "✅" if r.status_code == 403 else "❌"
        print(f"{pass_fail} [12] GET /admin/users (non-admin) → {r.status_code} (expected 403)")
        if pass_fail == "❌":
            ok = False

        # ── 13. Bad file type → 415 ───────────────────────────────────────────
        files = {"image": ("doc.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")}
        r = await c.post("/api/v1/predictions", files=files, headers=auth)
        pass_fail = "✅" if r.status_code in (415, 422) else "❌"
        print(f"{pass_fail} [13] POST /predictions (PDF) → {r.status_code} (expected 415/422)")
        if pass_fail == "❌":
            ok = False

    print()
    if ok:
        print("═══════════════════════════════════")
        print("  ✅  ALL PHASE 3 CHECKS PASSED")
        print("═══════════════════════════════════")
    else:
        print("═══════════════════════════════════")
        print("  ❌  SOME CHECKS FAILED — see above")
        print("═══════════════════════════════════")
        sys.exit(1)


asyncio.run(run())
