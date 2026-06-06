"""CropGuard API v1 Router.

Import and register all endpoint sub-routers here.
"""

from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.diseases import router as diseases_router
from app.api.v1.endpoints.predictions import router as predictions_router
from app.api.v1.endpoints.stats import router as stats_router
from app.api.v1.endpoints.treatments import router as treatments_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(predictions_router)
api_router.include_router(diseases_router)
api_router.include_router(treatments_router)
api_router.include_router(stats_router)
api_router.include_router(admin_router)
