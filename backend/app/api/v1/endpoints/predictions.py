"""CropGuard Prediction Endpoints.

Full CRUD for predictions: upload → inference → result with treatments,
paginated history with filters, feedback, and deletion.
"""

import uuid
from datetime import UTC, date

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_db
from app.core.exceptions import PermissionDeniedError, ResourceNotFoundError
from app.core.limiter import get_user_or_ip, limiter
from app.models.disease import Disease
from app.models.prediction import Prediction, PredictionFeedback
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.prediction import (
    FeedbackUpdate,
    PredictionDetailResponse,
    PredictionResponse,
)
from app.services import inference
from app.services.image_processor import ImageProcessor

router = APIRouter(prefix="/predictions", tags=["Predictions"])

_processor = ImageProcessor()


@router.post(
    "",
    response_model=PredictionDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a crop image and get a disease prediction",
)
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def create_prediction(
    request: Request,
    image: UploadFile = File(..., description="JPEG or PNG crop leaf image"),
    crop_id: uuid.UUID | None = Form(default=None),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PredictionDetailResponse:
    """Upload an image, run mock inference, persist the prediction, return results."""
    # 1. Validate and process image
    processed = await _processor.process(image, current_user.id)

    # 2. Run inference
    result = await inference.predict(b"", db)  # bytes not needed in mock mode

    # 3. Find disease from top prediction class_label
    disease: Disease | None = None
    if not result.is_healthy:
        d_result = await db.execute(
            select(Disease)
            .where(Disease.class_label == result.top_prediction.class_label)
            .options(selectinload(Disease.crop), selectinload(Disease.treatments))
        )
        disease = d_result.scalar_one_or_none()

    # 4. Build top_predictions JSONB payload
    top_preds_json = [
        {
            "label": s.class_label,
            "confidence": s.confidence,
            "disease_id": None,
        }
        for s in result.top_5
    ]

    # 5. Create prediction record
    prediction = Prediction(
        user_id=current_user.id,
        image_url=processed.original_url,
        thumbnail_url=processed.thumbnail_url,
        original_filename=image.filename,
        file_size_bytes=processed.file_size_bytes,
        disease_id=disease.id if disease else None,
        confidence=result.top_prediction.confidence,
        is_healthy=result.is_healthy,
        model_version=result.model_version,
        top_predictions=top_preds_json,
        latitude=latitude,
        longitude=longitude,
        crop_id=disease.crop_id if disease else crop_id,
    )
    db.add(prediction)
    await db.commit()

    # Reload with all relationships
    reloaded = await db.execute(
        select(Prediction)
        .where(Prediction.id == prediction.id)
        .options(
            selectinload(Prediction.disease).selectinload(Disease.crop),
            selectinload(Prediction.disease).selectinload(Disease.treatments),
            selectinload(Prediction.user),
            selectinload(Prediction.crop),
        )
    )
    pred = reloaded.scalar_one()
    return PredictionDetailResponse.model_validate(pred)


@router.get(
    "",
    response_model=PaginatedResponse[PredictionResponse],
    status_code=status.HTTP_200_OK,
    summary="List prediction history with filters",
)
async def list_predictions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    crop_id: uuid.UUID | None = Query(default=None),
    disease_id: uuid.UUID | None = Query(default=None),
    is_healthy: bool | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    feedback: PredictionFeedback | None = Query(default=None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[PredictionResponse]:
    """Return paginated, filtered prediction history for the current user."""
    filters = [Prediction.user_id == current_user.id]
    if crop_id:
        filters.append(Prediction.crop_id == crop_id)
    if disease_id:
        filters.append(Prediction.disease_id == disease_id)
    if is_healthy is not None:
        filters.append(Prediction.is_healthy == is_healthy)
    if date_from:
        filters.append(Prediction.created_at >= date_from)
    if date_to:
        from datetime import datetime

        end = datetime(date_to.year, date_to.month, date_to.day, 23, 59, 59, tzinfo=UTC)
        filters.append(Prediction.created_at <= end)
    if feedback:
        filters.append(Prediction.feedback == feedback)

    total_result = await db.execute(
        select(func.count(Prediction.id)).where(and_(*filters))
    )
    total: int = total_result.scalar_one()

    offset = (page - 1) * per_page
    rows = await db.execute(
        select(Prediction)
        .where(and_(*filters))
        .order_by(desc(Prediction.created_at))
        .offset(offset)
        .limit(per_page)
    )
    items = [PredictionResponse.model_validate(p) for p in rows.scalars().all()]
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
    "/{prediction_id}",
    response_model=PredictionDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a prediction with full nested details",
)
async def get_prediction(
    prediction_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PredictionDetailResponse:
    """Return a single prediction with nested disease, crop, treatments, user."""
    result = await db.execute(
        select(Prediction)
        .where(Prediction.id == prediction_id)
        .options(
            selectinload(Prediction.disease).selectinload(Disease.crop),
            selectinload(Prediction.disease).selectinload(Disease.treatments),
            selectinload(Prediction.user),
            selectinload(Prediction.crop),
        )
    )
    pred = result.scalar_one_or_none()
    if pred is None:
        raise ResourceNotFoundError("Prediction not found.")
    if pred.user_id != current_user.id and current_user.role.value != "admin":
        raise PermissionDeniedError("You do not own this prediction.")
    return PredictionDetailResponse.model_validate(pred)


@router.patch(
    "/{prediction_id}/feedback",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit feedback on a prediction",
)
async def update_feedback(
    prediction_id: uuid.UUID,
    body: FeedbackUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PredictionResponse:
    """Record whether the prediction was correct, incorrect, or unknown."""
    result = await db.execute(select(Prediction).where(Prediction.id == prediction_id))
    pred = result.scalar_one_or_none()
    if pred is None:
        raise ResourceNotFoundError("Prediction not found.")
    if pred.user_id != current_user.id:
        raise PermissionDeniedError("You do not own this prediction.")
    pred.feedback = body.feedback
    pred.feedback_notes = body.notes
    await db.commit()
    await db.refresh(pred)
    return PredictionResponse.model_validate(pred)


@router.delete(
    "/{prediction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a prediction and its image files",
)
async def delete_prediction(
    prediction_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete the prediction record and remove its image files from disk."""
    from pathlib import Path

    result = await db.execute(select(Prediction).where(Prediction.id == prediction_id))
    pred = result.scalar_one_or_none()
    if pred is None:
        raise ResourceNotFoundError("Prediction not found.")
    if pred.user_id != current_user.id and current_user.role.value != "admin":
        raise PermissionDeniedError("You do not own this prediction.")

    # Remove image files from disk
    for url in [pred.image_url, pred.thumbnail_url]:
        if url:
            path = Path(url.lstrip("/"))
            if path.exists():
                path.unlink(missing_ok=True)

    await db.delete(pred)
    await db.commit()
