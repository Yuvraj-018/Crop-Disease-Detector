"""CropGuard Disease Model.

Defines the `diseases` table linking diseases to crops, with severity
classification and symptoms stored as a PostgreSQL text array.
"""

from enum import Enum

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class DiseaseSeverity(str, Enum):
    """Enumeration of disease severity levels."""

    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Disease(Base, UUIDMixin, TimestampMixin):
    """SQLAlchemy model representing a crop disease."""

    __tablename__ = "diseases"
    __table_args__ = (
        UniqueConstraint("crop_id", "name", name="uq_disease_crop_name"),
        Index("ix_disease_class_label", "class_label"),
        Index("ix_disease_severity", "severity"),
    )

    crop_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[DiseaseSeverity] = mapped_column(
        SAEnum(DiseaseSeverity, name="diseaseseverity"), nullable=False
    )
    symptoms: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)
    causes: Mapped[str | None] = mapped_column(Text, nullable=True)
    prevention: Mapped[str | None] = mapped_column(Text, nullable=True)
    class_label: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    crop: Mapped["Crop"] = relationship("Crop", back_populates="diseases")  # noqa: F821
    treatments: Mapped[list["Treatment"]] = relationship(  # noqa: F821
        "Treatment", back_populates="disease", cascade="all, delete-orphan"
    )
    predictions: Mapped[list["Prediction"]] = relationship(  # noqa: F821
        "Prediction", back_populates="disease"
    )
