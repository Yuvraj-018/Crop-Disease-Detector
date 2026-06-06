"""CropGuard User Pydantic Schemas.

Defines request/response models for user registration, login, profile
management, and password changes.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    """Request body for POST /auth/register."""

    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    region: str | None = Field(default=None, max_length=100)
    language_pref: str = Field(default="en", max_length=10)

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        """Ensure password is not purely whitespace."""
        if v.strip() == "":
            raise ValueError("Password cannot be blank.")
        return v


class LoginRequest(BaseModel):
    """Request body for POST /auth/login."""

    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    """Request body for POST /auth/change-password."""

    current_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def new_not_same(cls, v: str, info) -> str:
        """Ensure new password differs from current password."""
        if "current_password" in info.data and v == info.data["current_password"]:
            raise ValueError("New password must differ from current password.")
        return v


class UserUpdate(BaseModel):
    """Request body for PATCH /auth/me."""

    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    region: str | None = Field(default=None, max_length=100)
    language_pref: str | None = Field(default=None, max_length=10)
    avatar_url: str | None = Field(default=None, max_length=500)


class UserResponse(BaseModel):
    """Safe user object returned by API responses (no hashed_password)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    phone: str | None
    region: str | None
    language_pref: str
    role: UserRole
    is_active: bool
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseModel):
    """Response body for successful login and register."""

    access_token: str
    token_type: str = "Bearer"
    user: UserResponse
