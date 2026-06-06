"""CropGuard Treatment Model.

Defines the `treatments` table with type, effectiveness, cost, and
application details for each treatment recommendation.
"""

from enum import Enum

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class TreatmentType(str, Enum):
    """Enumeration of treatment categories."""

    organic = "organic"
    chemical = "chemical"
    cultural = "cultural"
    biological = "biological"


class EffectivenessLevel(str, Enum):
    """Enumeration of effectiveness and cost levels."""

    low = "low"
    medium = "medium"
    high = "high"


class Treatment(Base, UUIDMixin, TimestampMixin):
    """SQLAlchemy model representing a crop disease treatment."""

    __tablename__ = "treatments"

    disease_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diseases.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[TreatmentType] = mapped_column(
        SAEnum(TreatmentType, name="treatmenttype"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    active_ingredient: Mapped[str | None] = mapped_column(String(300), nullable=True)
    dosage: Mapped[str | None] = mapped_column(String(300), nullable=True)
    application_method: Mapped[str | None] = mapped_column(Text, nullable=True)
    timing: Mapped[str | None] = mapped_column(String(300), nullable=True)
    waiting_period: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cost_estimate: Mapped[EffectivenessLevel] = mapped_column(
        SAEnum(EffectivenessLevel, name="costlevel"), nullable=False
    )
    effectiveness: Mapped[EffectivenessLevel] = mapped_column(
        SAEnum(EffectivenessLevel, name="effectivenesslevel"), nullable=False
    )
    is_certified_organic: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    disease: Mapped["Disease"] = relationship(
        "Disease", back_populates="treatments"
    )  # noqa: F821
