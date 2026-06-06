"""CropGuard Statistics Service.

Computes aggregated stats for the stats overview and outbreak map endpoints.
All queries use SQLAlchemy 2.0 async style with proper typing (no text() hacks).
"""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import Numeric, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.disease import Disease
from app.models.prediction import Prediction, PredictionFeedback
from app.models.user import User


async def get_user_overview(user_id: uuid.UUID, db: AsyncSession) -> dict:
    """Compute dashboard overview stats for a single user."""

    now = datetime.now(UTC)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    base = select(Prediction).where(Prediction.user_id == user_id)

    # total scans
    total_scans: int = (
        await db.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()

    # diseases_found (not healthy)
    diseases_found: int = (
        await db.execute(
            select(func.count()).select_from(
                base.where(Prediction.is_healthy.is_(False)).subquery()
            )
        )
    ).scalar_one()

    # healthy_count
    healthy_count = total_scans - diseases_found

    # this month
    this_month_scans: int = (
        await db.execute(
            select(func.count()).select_from(
                base.where(Prediction.created_at >= month_start).subquery()
            )
        )
    ).scalar_one()

    # most common disease
    cnt_col = func.count(Prediction.id)
    most_common_row = (
        await db.execute(
            select(Disease.name, cnt_col.label("cnt"))
            .join(Disease, Prediction.disease_id == Disease.id)
            .where(Prediction.user_id == user_id)
            .group_by(Disease.name)
            .order_by(cnt_col.desc())
            .limit(1)
        )
    ).first()
    most_common_disease = (
        {"name": most_common_row[0], "count": most_common_row[1]}
        if most_common_row
        else None
    )

    # accuracy_rate — % correct feedback among graded predictions
    fb_row = (
        await db.execute(
            select(
                func.count().label("total"),
                func.sum(
                    case(
                        (Prediction.feedback == PredictionFeedback.correct, 1),
                        else_=0,
                    )
                ).label("correct"),
            ).where(
                Prediction.user_id == user_id,
                Prediction.feedback.isnot(None),
            )
        )
    ).first()
    if fb_row and fb_row[0]:
        accuracy_rate = round((fb_row[1] or 0) / fb_row[0] * 100, 1)
    else:
        accuracy_rate = 0.0

    # scans_by_week — last 8 weeks
    eight_weeks_ago = now - timedelta(weeks=8)
    week_label = func.to_char(Prediction.created_at, 'IYYY-"W"IW')
    week_rows = (
        await db.execute(
            select(week_label.label("week"), func.count().label("count"))
            .where(
                Prediction.user_id == user_id,
                Prediction.created_at >= eight_weeks_ago,
            )
            .group_by(week_label)
            .order_by(week_label)
        )
    ).all()
    scans_by_week = [{"week": r[0], "count": r[1]} for r in week_rows]

    # disease_distribution — top 5
    dist_cnt = func.count(Prediction.id)
    dist_rows = (
        await db.execute(
            select(Disease.name.label("disease_name"), dist_cnt.label("count"))
            .join(Disease, Prediction.disease_id == Disease.id)
            .where(Prediction.user_id == user_id)
            .group_by(Disease.name)
            .order_by(dist_cnt.desc())
            .limit(5)
        )
    ).all()
    total_diseased = sum(r[1] for r in dist_rows) or 1
    disease_distribution = [
        {
            "disease_name": r[0],
            "count": r[1],
            "percentage": round(r[1] / total_diseased * 100, 1),
        }
        for r in dist_rows
    ]

    return {
        "total_scans": total_scans,
        "diseases_found": diseases_found,
        "healthy_count": healthy_count,
        "this_month_scans": this_month_scans,
        "most_common_disease": most_common_disease,
        "accuracy_rate": accuracy_rate,
        "scans_by_week": scans_by_week,
        "disease_distribution": disease_distribution,
    }


async def get_admin_stats(db: AsyncSession) -> dict:
    """Compute platform-wide admin statistics."""
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(weeks=1)

    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_preds = (await db.execute(select(func.count(Prediction.id)))).scalar_one()
    preds_today = (
        await db.execute(
            select(func.count(Prediction.id)).where(
                Prediction.created_at >= today_start
            )
        )
    ).scalar_one()
    new_users = (
        await db.execute(
            select(func.count(User.id)).where(User.created_at >= week_start)
        )
    ).scalar_one()

    top_cnt = func.count(Prediction.id)
    top_diseases = [
        {"name": r[0], "count": r[1]}
        for r in (
            await db.execute(
                select(Disease.name, top_cnt.label("count"))
                .join(Disease, Prediction.disease_id == Disease.id)
                .group_by(Disease.name)
                .order_by(top_cnt.desc())
                .limit(5)
            )
        ).all()
    ]

    # Most affected region
    region_cnt = func.count(Prediction.id)
    region_row = (
        await db.execute(
            select(User.region, region_cnt.label("cnt"))
            .join(Prediction, Prediction.user_id == User.id)
            .where(User.region.isnot(None))
            .group_by(User.region)
            .order_by(region_cnt.desc())
            .limit(1)
        )
    ).first()
    most_affected_region = region_row[0] if region_row else None

    return {
        "total_users": total_users,
        "total_predictions": total_preds,
        "predictions_today": preds_today,
        "most_affected_region": most_affected_region,
        "top_diseases": top_diseases,
        "new_users_this_week": new_users,
    }


async def get_outbreak_data(db: AsyncSession) -> list[dict]:
    """Return geo-clustered outbreak data for predictions with lat/lon.

    Rounds lat/lon to 1 decimal place to cluster nearby predictions.
    Uses proper SQLAlchemy Numeric cast — no text() in type positions.
    """
    # Cast float columns to Numeric so PostgreSQL ROUND(numeric, int) works
    lat_rounded = func.round(cast(Prediction.latitude, Numeric(10, 4)), 1)
    lon_rounded = func.round(cast(Prediction.longitude, Numeric(10, 4)), 1)
    count_col = func.count(Prediction.id)

    rows = (
        await db.execute(
            select(
                Disease.name.label("disease_name"),
                Disease.id.label("disease_id"),
                Disease.severity.label("severity"),
                lat_rounded.label("lat"),
                lon_rounded.label("lon"),
                count_col.label("count"),
                func.max(Prediction.created_at).label("last_seen"),
            )
            .join(Disease, Prediction.disease_id == Disease.id)
            .where(
                Prediction.latitude.isnot(None),
                Prediction.longitude.isnot(None),
            )
            .group_by(
                Disease.name,
                Disease.id,
                Disease.severity,
                lat_rounded,
                lon_rounded,
            )
            .order_by(count_col.desc())
            .limit(500)
        )
    ).all()

    return [
        {
            "disease_name": r.disease_name,
            "disease_id": str(r.disease_id),
            "severity": r.severity.value,
            "latitude": float(r.lat),
            "longitude": float(r.lon),
            "count": r.count,
            "last_seen": r.last_seen.isoformat(),
        }
        for r in rows
    ]
