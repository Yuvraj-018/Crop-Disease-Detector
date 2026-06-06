"""CropGuard Prediction Pydantic Schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.prediction import PredictionFeedback
from app.schemas.crop import CropResponse
from app.schemas.disease import DiseaseDetailResponse
from app.schemas.user import UserResponse


class PredictionResultItem(BaseModel):
    """Single top-k prediction item from the inference service."""

    label: str
    confidence: float
    disease_id: uuid.UUID | None


class PredictionResponse(BaseModel):
    """Prediction object for list endpoints (no deep nesting)."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: uuid.UUID
    user_id: uuid.UUID
    image_url: str
    thumbnail_url: str | None
    original_filename: str | None
    file_size_bytes: int | None
    disease_id: uuid.UUID | None
    confidence: float | None
    is_healthy: bool
    model_version: str
    top_predictions: list[PredictionResultItem] | None
    feedback: PredictionFeedback | None
    feedback_notes: str | None
    latitude: float | None
    longitude: float | None
    crop_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class PredictionDetailResponse(PredictionResponse):
    """Full prediction response including nested disease, crop, and user."""

    disease: DiseaseDetailResponse | None
    crop: CropResponse | None
    user: UserResponse


class FeedbackUpdate(BaseModel):
    """Request body for PATCH /predictions/{id}/feedback."""

    feedback: PredictionFeedback
    notes: str | None = None
