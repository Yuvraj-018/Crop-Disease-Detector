"""CropGuard Crop Pydantic Schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CropResponse(BaseModel):
    """Crop object returned by API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    scientific_name: str | None
    description: str | None
    image_url: str | None
    created_at: datetime
    updated_at: datetime


class CropCreate(BaseModel):
    """Input schema for creating a crop (admin use)."""

    name: str
    scientific_name: str | None = None
    description: str | None = None
    image_url: str | None = None
