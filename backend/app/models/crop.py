"""CropGuard Crop Model.

Defines the `crops` table representing types of crops (Tomato, Wheat, etc.).
"""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Crop(Base, UUIDMixin, TimestampMixin):
    """SQLAlchemy model representing an agricultural crop type."""

    __tablename__ = "crops"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    scientific_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    diseases: Mapped[list["Disease"]] = relationship(  # noqa: F821
        "Disease", back_populates="crop", cascade="all, delete-orphan"
    )
    predictions: Mapped[list["Prediction"]] = relationship(  # noqa: F821
        "Prediction", back_populates="crop"
    )
