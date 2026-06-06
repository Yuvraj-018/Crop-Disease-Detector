"""CropGuard Prediction Model.

Defines the `predictions` table recording each image upload, inference result,
user feedback, and optional geo-coordinates for the outbreak map.
"""

from enum import Enum

from sqlalchemy import Boolean, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class PredictionFeedback(str, Enum):
    """Enumeration of user feedback values for a prediction."""

    correct = "correct"
    incorrect = "incorrect"
    unsure = "unsure"


class Prediction(Base, UUIDMixin, TimestampMixin):
    """SQLAlchemy model recording a crop image analysis and its result."""

    __tablename__ = "predictions"
    __table_args__ = (
        Index("ix_prediction_user_id", "user_id"),
        Index("ix_prediction_disease_id", "disease_id"),
        Index("ix_prediction_created_at", "created_at"),
        Index(
            "ix_prediction_geo",
            "latitude",
            "longitude",
            postgresql_where="latitude IS NOT NULL",
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    disease_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diseases.id", ondelete="SET NULL"),
        nullable=True,
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_healthy: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    gradcam_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    model_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="mock-v0"
    )
    top_predictions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    feedback: Mapped[PredictionFeedback | None] = mapped_column(
        SAEnum(PredictionFeedback, name="predictionfeedback"), nullable=True
    )
    feedback_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    crop_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crops.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="predictions"
    )  # noqa: F821
    disease: Mapped["Disease | None"] = relationship(  # noqa: F821
        "Disease", back_populates="predictions", lazy="selectin"
    )
    crop: Mapped["Crop | None"] = relationship(  # noqa: F821
        "Crop", back_populates="predictions", lazy="selectin"
    )
