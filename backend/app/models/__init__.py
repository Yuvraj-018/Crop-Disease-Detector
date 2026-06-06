"""SQLAlchemy models package.

All models must be imported here so that SQLAlchemy's mapper can resolve
forward-referenced relationships (e.g. Prediction → Disease → Crop) before
any query, seed, or migration code runs.
"""

from app.models.base import Base, TimestampMixin, UUIDMixin  # noqa: F401
from app.models.crop import Crop  # noqa: F401
from app.models.disease import Disease, DiseaseSeverity  # noqa: F401
from app.models.prediction import Prediction, PredictionFeedback  # noqa: F401
from app.models.treatment import (  # noqa: F401
    EffectivenessLevel,
    Treatment,
    TreatmentType,
)
from app.models.user import User, UserRole  # noqa: F401
