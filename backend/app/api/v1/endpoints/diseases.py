"""CropGuard Disease & Crop Endpoints (public)."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.core.exceptions import ResourceNotFoundError
from app.models.crop import Crop
from app.models.disease import Disease, DiseaseSeverity
from app.schemas.common import PaginatedResponse
from app.schemas.crop import CropResponse
from app.schemas.disease import DiseaseDetailResponse, DiseaseResponse

router = APIRouter(tags=["Diseases & Crops"])


# ---------------------------------------------------------------------------
# Crops
# ---------------------------------------------------------------------------


@router.get("/crops", response_model=list[CropResponse], summary="List all crops")
async def list_crops(db: AsyncSession = Depends(get_db)) -> list[CropResponse]:
    """Return all crops ordered by name."""
    result = await db.execute(select(Crop).order_by(Crop.name))
    return [CropResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/crops/{crop_id}", response_model=CropResponse, summary="Get a crop")
async def get_crop(
    crop_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> CropResponse:
    """Return a crop with its basic details."""
    result = await db.execute(select(Crop).where(Crop.id == crop_id))
    crop = result.scalar_one_or_none()
    if crop is None:
        raise ResourceNotFoundError("Crop not found.")
    return CropResponse.model_validate(crop)


# ---------------------------------------------------------------------------
# Diseases
# ---------------------------------------------------------------------------


@router.get(
    "/diseases",
    response_model=PaginatedResponse[DiseaseResponse],
    summary="List diseases with optional filters",
)
async def list_diseases(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    crop_id: uuid.UUID | None = Query(default=None),
    severity: DiseaseSeverity | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[DiseaseResponse]:
    """Return paginated diseases, optionally filtered by crop, severity, or search term."""
    filters = []
    if crop_id:
        filters.append(Disease.crop_id == crop_id)
    if severity:
        filters.append(Disease.severity == severity)
    if search:
        term = f"%{search.lower()}%"
        filters.append(
            or_(
                func.lower(Disease.name).like(term),
                func.lower(Disease.description).like(term),
            )
        )

    from sqlalchemy import and_

    where_clause = and_(*filters) if filters else True

    total = (
        await db.execute(select(func.count(Disease.id)).where(where_clause))
    ).scalar_one()

    offset = (page - 1) * per_page
    rows = await db.execute(
        select(Disease)
        .where(where_clause)
        .order_by(Disease.name)
        .offset(offset)
        .limit(per_page)
    )
    items = [DiseaseResponse.model_validate(d) for d in rows.scalars().all()]
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
    "/diseases/{disease_id}",
    response_model=DiseaseDetailResponse,
    summary="Get a disease with its crop and treatments",
)
async def get_disease(
    disease_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> DiseaseDetailResponse:
    """Return a disease with nested crop and treatment list."""
    result = await db.execute(
        select(Disease)
        .where(Disease.id == disease_id)
        .options(selectinload(Disease.crop), selectinload(Disease.treatments))
    )
    disease = result.scalar_one_or_none()
    if disease is None:
        raise ResourceNotFoundError("Disease not found.")
    return DiseaseDetailResponse.model_validate(disease)
