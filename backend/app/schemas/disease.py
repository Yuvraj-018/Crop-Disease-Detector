"""CropGuard Disease Pydantic Schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.disease import DiseaseSeverity
from app.schemas.crop import CropResponse


class DiseaseResponse(BaseModel):
    """Disease object without treatments (for list endpoints)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    crop_id: uuid.UUID
    name: str
    description: str
    severity: DiseaseSeverity
    symptoms: list[str]
    causes: str | None
    prevention: str | None
    class_label: str
    image_url: str | None
    created_at: datetime
    updated_at: datetime


class DiseaseDetailResponse(DiseaseResponse):
    """Disease object including nested crop and treatments."""

    crop: CropResponse
    treatments: list["TreatmentResponse"]  # noqa: F821


class DiseaseCreate(BaseModel):
    """Input schema for creating a disease (seed use)."""

    crop_id: uuid.UUID
    name: str
    description: str
    severity: DiseaseSeverity
    symptoms: list[str]
    causes: str | None = None
    prevention: str | None = None
    class_label: str
    image_url: str | None = None


from app.schemas.treatment import TreatmentResponse  # noqa: E402

DiseaseDetailResponse.model_rebuild()
