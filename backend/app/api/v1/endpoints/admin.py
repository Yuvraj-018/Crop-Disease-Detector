"""CropGuard Admin Endpoints (admin role required for all)."""

import uuid

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_admin
from app.core.exceptions import ResourceNotFoundError
from app.models.disease import Disease
from app.models.prediction import Prediction
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.prediction import PredictionDetailResponse
from app.schemas.user import UserResponse
from app.seeds.run_seeds import run_seeds
from app.services import stats_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/users",
    response_model=PaginatedResponse[UserResponse],
    summary="[Admin] List all users",
)
async def admin_list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[UserResponse]:
    filters = []
    if role:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)
    if search:
        t = f"%{search.lower()}%"
        filters.append(
            or_(func.lower(User.full_name).like(t), func.lower(User.email).like(t))
        )
    where = and_(*filters) if filters else True
    total = (await db.execute(select(func.count(User.id)).where(where))).scalar_one()
    offset = (page - 1) * per_page
    rows = await db.execute(
        select(User)
        .where(where)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    items = [UserResponse.model_validate(u) for u in rows.scalars().all()]
    total_pages = max(1, -(-total // per_page))
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="[Admin] Update user role or active status",
)
async def admin_update_user(
    user_id: uuid.UUID,
    is_active: bool | None = Body(default=None),
    role: UserRole | None = Body(default=None),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise ResourceNotFoundError("User not found.")
    if is_active is not None:
        user.is_active = is_active
    if role is not None:
        user.role = role
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get(
    "/predictions",
    response_model=PaginatedResponse[PredictionDetailResponse],
    summary="[Admin] List all predictions",
)
async def admin_list_predictions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID | None = Query(default=None),
    disease_id: uuid.UUID | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[PredictionDetailResponse]:
    from datetime import datetime

    filters = []
    if user_id:
        filters.append(Prediction.user_id == user_id)
    if disease_id:
        filters.append(Prediction.disease_id == disease_id)
    if date_from:
        filters.append(Prediction.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        filters.append(Prediction.created_at <= datetime.fromisoformat(date_to))

    where = and_(*filters) if filters else True
    total = (
        await db.execute(select(func.count(Prediction.id)).where(where))
    ).scalar_one()
    offset = (page - 1) * per_page
    rows = await db.execute(
        select(Prediction)
        .where(where)
        .options(
            selectinload(Prediction.disease).selectinload(Disease.crop),
            selectinload(Prediction.disease).selectinload(Disease.treatments),
            selectinload(Prediction.user),
            selectinload(Prediction.crop),
        )
        .order_by(Prediction.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    items = [PredictionDetailResponse.model_validate(p) for p in rows.scalars().all()]
    total_pages = max(1, -(-total // per_page))
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/stats", summary="[Admin] Get platform-wide statistics")
async def admin_stats(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return platform-wide aggregated statistics."""
    return await stats_service.get_admin_stats(db)


@router.post("/seed", summary="[Admin] Re-run idempotent seed data")
async def admin_seed(_: User = Depends(require_admin)) -> dict:
    """Run the seed script. Safe to call multiple times (idempotent)."""
    await run_seeds()
    from app.seeds.seed_data import CROPS, DISEASES, TREATMENTS

    return {
        "message": "Seed completed",
        "crops": len(CROPS),
        "diseases": len(DISEASES),
        "treatments": len(TREATMENTS),
    }
