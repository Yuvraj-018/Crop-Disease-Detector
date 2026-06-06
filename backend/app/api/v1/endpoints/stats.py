"""CropGuard Stats Endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.services import stats_service

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/overview", summary="Get personal dashboard stats")
async def stats_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return aggregated stats for the current user's dashboard."""
    return await stats_service.get_user_overview(current_user.id, db)


@router.get("/outbreak", summary="Get geo-clustered outbreak data (public)")
async def outbreak_data(db: AsyncSession = Depends(get_db)) -> list:
    """Return geo-clustered disease predictions for the outbreak map."""
    return await stats_service.get_outbreak_data(db)
