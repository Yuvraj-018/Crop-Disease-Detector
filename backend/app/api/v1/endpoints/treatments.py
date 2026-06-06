"""CropGuard Treatment Endpoints (public)."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.exceptions import ResourceNotFoundError
from app.models.treatment import EffectivenessLevel, Treatment, TreatmentType
from app.schemas.common import PaginatedResponse
from app.schemas.treatment import TreatmentResponse

router = APIRouter(prefix="/treatments", tags=["Treatments"])


@router.get(
    "",
    response_model=PaginatedResponse[TreatmentResponse],
    summary="List treatments with optional filters",
)
async def list_treatments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    disease_id: uuid.UUID | None = Query(default=None),
    type: TreatmentType | None = Query(default=None),
    effectiveness: EffectivenessLevel | None = Query(default=None),
    cost_estimate: EffectivenessLevel | None = Query(default=None),
    is_certified_organic: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[TreatmentResponse]:
    """Return paginated treatments with optional filtering."""
    filters = []
    if disease_id:
        filters.append(Treatment.disease_id == disease_id)
    if type:
        filters.append(Treatment.type == type)
    if effectiveness:
        filters.append(Treatment.effectiveness == effectiveness)
    if cost_estimate:
        filters.append(Treatment.cost_estimate == cost_estimate)
    if is_certified_organic is not None:
        filters.append(Treatment.is_certified_organic == is_certified_organic)

    where = and_(*filters) if filters else True

    total = (
        await db.execute(select(func.count(Treatment.id)).where(where))
    ).scalar_one()

    offset = (page - 1) * per_page
    rows = await db.execute(
        select(Treatment)
        .where(where)
        .order_by(Treatment.effectiveness.desc(), Treatment.name)
        .offset(offset)
        .limit(per_page)
    )
    items = [TreatmentResponse.model_validate(t) for t in rows.scalars().all()]
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


@router.get(
    "/{treatment_id}",
    response_model=TreatmentResponse,
    summary="Get a single treatment",
)
async def get_treatment(
    treatment_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> TreatmentResponse:
    """Return a single treatment record."""
    result = await db.execute(select(Treatment).where(Treatment.id == treatment_id))
    t = result.scalar_one_or_none()
    if t is None:
        raise ResourceNotFoundError("Treatment not found.")
    return TreatmentResponse.model_validate(t)
