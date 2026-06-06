"""
CropGuard Inference Service
============================
MOCK MODE: Returns realistic dummy predictions.

MODEL SWAP GUIDE
-----------------
To connect a real PyTorch model:
  1. Set MOCK_MODE = False
  2. Set MODEL_PATH to your .pt or .onnx file path in config
  3. Implement _load_model() to load your model
  4. Implement _real_predict(image_tensor) → list[ClassScore]
  5. No other file in the codebase needs to change.

The contract this service must fulfil:
  Input:  image_bytes: bytes (preprocessed 224x224 RGB JPEG)
  Output: InferenceResult dataclass (defined below)
"""

import asyncio
import random
import time
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.disease import Disease

MOCK_MODE = True
HEALTHY_LABEL = "Healthy"
HEALTHY_PROBABILITY = 0.20  # 20% chance of a healthy result
CONFIDENCE_RANGE = (0.72, 0.98)
MOCK_MODEL_VERSION = "mock-v0.1"


@dataclass
class ClassScore:
    """A single class-label confidence pair from inference."""

    class_label: str
    confidence: float


@dataclass
class InferenceResult:
    """Full inference output returned by the service."""

    top_prediction: ClassScore
    top_5: list[ClassScore]  # always 5 items, descending confidence
    is_healthy: bool
    model_version: str
    inference_time_ms: float


# Module-level label cache — populated on first DB call
_LABEL_CACHE: list[str] = []


async def _get_labels(db: AsyncSession) -> list[str]:
    """Fetch all disease class_labels from DB, caching after first call."""
    global _LABEL_CACHE
    if not _LABEL_CACHE:
        result = await db.execute(select(Disease.class_label))
        _LABEL_CACHE = [row[0] for row in result.all()]
    return _LABEL_CACHE


def _generate_top5(
    top_label: str,
    all_labels: list[str],
    top_confidence: float,
) -> list[ClassScore]:
    """Build a realistic top-5 list with descending probabilities."""
    other_labels = [lbl for lbl in all_labels if lbl != top_label]
    remaining = 1.0 - top_confidence
    other_labels_sample = random.sample(other_labels, min(4, len(other_labels)))

    # Partition remaining probability across the other 4 entries
    splits = sorted(
        [random.uniform(0.01, 0.15) for _ in range(len(other_labels_sample) - 1)]
    )
    probabilities = []
    prev = 0.0
    for s in splits:
        probabilities.append(min((s - prev) * remaining / 1.0, remaining))
        prev = s
    probabilities.append(max(0.005, remaining - sum(probabilities)))
    # Normalise so they actually sum as expected
    probabilities = sorted(probabilities, reverse=True)

    top5 = [ClassScore(class_label=top_label, confidence=round(top_confidence, 4))]
    for label, prob in zip(other_labels_sample, probabilities):
        top5.append(
            ClassScore(class_label=label, confidence=round(max(prob, 0.005), 4))
        )

    return top5


async def predict(image_bytes: bytes, db: AsyncSession) -> InferenceResult:
    """Run mock inference on image bytes, simulating ML latency.

    When MOCK_MODE is False this function must be replaced with real model
    inference — no other file in the codebase requires modification.
    """
    start = time.perf_counter()

    # Simulate model inference latency (50–250 ms)
    await asyncio.sleep(random.uniform(0.05, 0.25))

    labels = await _get_labels(db)

    is_healthy = random.random() < HEALTHY_PROBABILITY

    if is_healthy or not labels:
        top_label = HEALTHY_LABEL
        top_conf = round(random.uniform(*CONFIDENCE_RANGE), 4)
        top5 = [ClassScore(class_label=HEALTHY_LABEL, confidence=top_conf)]
        # Pad with low-scoring disease labels
        if labels:
            for lbl in random.sample(labels, min(4, len(labels))):
                top5.append(
                    ClassScore(
                        class_label=lbl,
                        confidence=round(random.uniform(0.005, 0.06), 4),
                    )
                )
    else:
        top_label = random.choice(labels)
        top_conf = round(random.uniform(*CONFIDENCE_RANGE), 4)
        top5 = _generate_top5(top_label, labels, top_conf)

    elapsed_ms = (time.perf_counter() - start) * 1000

    return InferenceResult(
        top_prediction=top5[0],
        top_5=top5[:5],
        is_healthy=is_healthy,
        model_version=MOCK_MODEL_VERSION,
        inference_time_ms=round(elapsed_ms, 2),
    )
