"""CropGuard Treatment Pydantic Schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.treatment import EffectivenessLevel, TreatmentType


class TreatmentResponse(BaseModel):
    """Treatment object returned by API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    disease_id: uuid.UUID
    name: str
    type: TreatmentType
    description: str
    active_ingredient: str | None
    dosage: str | None
    application_method: str | None
    timing: str | None
    waiting_period: str | None
    cost_estimate: EffectivenessLevel
    effectiveness: EffectivenessLevel
    is_certified_organic: bool
    created_at: datetime
    updated_at: datetime


class TreatmentCreate(BaseModel):
    """Input schema for creating a treatment (seed use)."""

    disease_id: uuid.UUID
    name: str
    type: TreatmentType
    description: str
    active_ingredient: str | None = None
    dosage: str | None = None
    application_method: str | None = None
    timing: str | None = None
    waiting_period: str | None = None
    cost_estimate: EffectivenessLevel
    effectiveness: EffectivenessLevel
    is_certified_organic: bool = False
