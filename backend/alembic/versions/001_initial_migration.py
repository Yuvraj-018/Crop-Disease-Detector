"""CropGuard Initial Alembic Migration.

Creates PostGIS extension, all ENUM types, and all application tables
in the correct dependency order. Fully reversible via downgrade().
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all database objects from scratch."""
    # PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # ENUM types
    op.execute("CREATE TYPE userrole AS ENUM ('farmer', 'agronomist', 'admin');")
    op.execute("CREATE TYPE diseaseseverity AS ENUM ('low', 'medium', 'high', 'critical');")
    op.execute("CREATE TYPE treatmenttype AS ENUM ('organic', 'chemical', 'cultural', 'biological');")
    op.execute("CREATE TYPE costlevel AS ENUM ('low', 'medium', 'high');")
    op.execute("CREATE TYPE effectivenesslevel AS ENUM ('low', 'medium', 'high');")
    op.execute("CREATE TYPE predictionfeedback AS ENUM ('correct', 'incorrect', 'unsure');")

    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("region", sa.String(100), nullable=True),
        sa.Column("language_pref", sa.String(10), nullable=False, server_default="en"),
        sa.Column("role", postgresql.ENUM("farmer", "agronomist", "admin", name="userrole", create_type=False), nullable=False, server_default="farmer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_email", "users", ["email"])

    # crops
    op.create_table(
        "crops",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("scientific_name", sa.String(200), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_constraint("uq_crops_name", "crops", ["name"])

    # diseases
    op.create_table(
        "diseases",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("crop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("crops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("severity", postgresql.ENUM("low", "medium", "high", "critical", name="diseaseseverity", create_type=False), nullable=False),
        sa.Column("symptoms", postgresql.ARRAY(sa.Text), nullable=False),
        sa.Column("causes", sa.Text, nullable=True),
        sa.Column("prevention", sa.Text, nullable=True),
        sa.Column("class_label", sa.String(150), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_constraint("uq_disease_class_label", "diseases", ["class_label"])
    op.create_unique_constraint("uq_disease_crop_name", "diseases", ["crop_id", "name"])
    op.create_index("ix_disease_class_label", "diseases", ["class_label"])
    op.create_index("ix_disease_severity", "diseases", ["severity"])

    # treatments
    op.create_table(
        "treatments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("disease_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("diseases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("type", postgresql.ENUM("organic", "chemical", "cultural", "biological", name="treatmenttype", create_type=False), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("active_ingredient", sa.String(300), nullable=True),
        sa.Column("dosage", sa.String(300), nullable=True),
        sa.Column("application_method", sa.Text, nullable=True),
        sa.Column("timing", sa.String(300), nullable=True),
        sa.Column("waiting_period", sa.String(100), nullable=True),
        sa.Column("cost_estimate", postgresql.ENUM("low", "medium", "high", name="costlevel", create_type=False), nullable=False),
        sa.Column("effectiveness", postgresql.ENUM("low", "medium", "high", name="effectivenesslevel", create_type=False), nullable=False),
        sa.Column("is_certified_organic", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # predictions
    op.create_table(
        "predictions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("original_filename", sa.String(255), nullable=True),
        sa.Column("file_size_bytes", sa.Integer, nullable=True),
        sa.Column("disease_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("diseases.id", ondelete="SET NULL"), nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("is_healthy", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("gradcam_url", sa.String(500), nullable=True),
        sa.Column("model_version", sa.String(50), nullable=False, server_default="mock-v0"),
        sa.Column("top_predictions", postgresql.JSONB, nullable=True),
        sa.Column("feedback", postgresql.ENUM("correct", "incorrect", "unsure", name="predictionfeedback", create_type=False), nullable=True),
        sa.Column("feedback_notes", sa.Text, nullable=True),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("crop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("crops.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_prediction_user_id", "predictions", ["user_id"])
    op.create_index("ix_prediction_disease_id", "predictions", ["disease_id"])
    op.create_index("ix_prediction_created_at", "predictions", ["created_at"])
    op.execute(
        "CREATE INDEX ix_prediction_geo ON predictions (latitude, longitude) WHERE latitude IS NOT NULL;"
    )


def downgrade() -> None:
    """Drop all database objects in reverse dependency order."""
    op.drop_table("predictions")
    op.drop_table("treatments")
    op.drop_table("diseases")
    op.drop_table("crops")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS predictionfeedback;")
    op.execute("DROP TYPE IF EXISTS effectivenesslevel;")
    op.execute("DROP TYPE IF EXISTS costlevel;")
    op.execute("DROP TYPE IF EXISTS treatmenttype;")
    op.execute("DROP TYPE IF EXISTS diseaseseverity;")
    op.execute("DROP TYPE IF EXISTS userrole;")
