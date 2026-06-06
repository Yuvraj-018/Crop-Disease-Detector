"""CropGuard Seed Runner.

Idempotent seed script — safe to run multiple times.
Checks for existing data before inserting to avoid duplicates.
Run with: python -m app.seeds.run_seeds
"""

import asyncio

from sqlalchemy import select

import app.models  # noqa: F401 — registers all SQLAlchemy models with the mapper
from app.core.database import AsyncSessionLocal
from app.models.crop import Crop
from app.models.disease import Disease
from app.models.treatment import Treatment
from app.seeds.seed_data import CROPS, DISEASES, TREATMENTS


async def seed_crops(session) -> dict[str, Crop]:
    """Seed 5 crops. Returns a mapping of crop name → Crop instance."""
    crop_map: dict[str, Crop] = {}
    for data in CROPS:
        result = await session.execute(select(Crop).where(Crop.name == data["name"]))
        crop = result.scalar_one_or_none()
        if crop is None:
            crop = Crop(**data)
            session.add(crop)
            print(f"  + Crop: {data['name']}")
        else:
            print(f"  . Crop exists: {data['name']}")
        crop_map[data["name"]] = crop
    await session.flush()
    return crop_map


async def seed_diseases(session, crop_map: dict[str, Crop]) -> dict[str, Disease]:
    """Seed 15 diseases linked to crops. Returns class_label → Disease map."""
    disease_map: dict[str, Disease] = {}
    for data in DISEASES:
        result = await session.execute(
            select(Disease).where(Disease.class_label == data["class_label"])
        )
        disease = result.scalar_one_or_none()
        if disease is None:
            crop_name = data.pop("crop_name")
            crop = crop_map[crop_name]
            disease = Disease(crop_id=crop.id, **data)
            session.add(disease)
            print(f"  + Disease: {disease.name}")
        else:
            data.pop("crop_name", None)
            print(f"  . Disease exists: {disease.name}")
        disease_map[disease.class_label] = disease
    await session.flush()
    return disease_map


async def seed_treatments(session, disease_map: dict[str, Disease]) -> int:
    """Seed 30 treatments. Returns count of newly inserted treatments."""
    count = 0
    for data in TREATMENTS:
        class_label = data.pop("disease_class_label")
        disease = disease_map.get(class_label)
        if disease is None:
            print(f"  ! Warning: disease not found for class_label={class_label}")
            continue

        result = await session.execute(
            select(Treatment).where(
                Treatment.disease_id == disease.id, Treatment.name == data["name"]
            )
        )
        treatment = result.scalar_one_or_none()
        if treatment is None:
            treatment = Treatment(disease_id=disease.id, **data)
            session.add(treatment)
            print(f"  + Treatment: {treatment.name}")
            count += 1
        else:
            print(f"  . Treatment exists: {treatment.name}")
    await session.flush()
    return count


async def run_seeds() -> None:
    """Run all seed operations within a single database transaction."""
    print("\n══════════════════════════════════════")
    print("  CropGuard Seed Runner")
    print("══════════════════════════════════════\n")

    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("▸ Seeding Crops...")
            crop_map = await seed_crops(session)

            print("\n▸ Seeding Diseases...")
            disease_map = await seed_diseases(session, crop_map)

            print("\n▸ Seeding Treatments...")
            await seed_treatments(session, disease_map)

    print("\n══════════════════════════════════════")
    print(f"  ✅ Crops:      {len(crop_map)}")
    print(f"  ✅ Diseases:   {len(disease_map)}")
    print(f"  ✅ Treatments: {len(TREATMENTS)}")
    print("══════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(run_seeds())
