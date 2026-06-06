"""CropGuard Shared Pydantic Schemas.

Provides generic response wrappers and error models used across all endpoints.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper for list endpoints."""

    items: list[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class ErrorDetail(BaseModel):
    """Detail block inside an API error response."""

    code: str
    message: str
    details: dict | None = None


class ApiError(BaseModel):
    """Standard API error envelope."""

    error: ErrorDetail
