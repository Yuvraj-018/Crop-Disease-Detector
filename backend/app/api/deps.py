"""CropGuard API Dependencies.

FastAPI dependency functions for database sessions, current user extraction,
and role-based access control.
"""

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the authenticated user from the JWT token."""
    payload = decode_token(token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Token does not contain a user identifier.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthenticationError("User not found.")
    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    """Ensure the authenticated user is active."""
    if not user.is_active:
        raise AuthenticationError("Account is disabled.")
    return user


def require_admin(user: User = Depends(get_current_active_user)) -> User:
    """Raise 403 if the current user is not an admin."""
    if user.role != UserRole.admin:
        raise PermissionDeniedError("Admin access required.")
    return user


def require_agronomist(user: User = Depends(get_current_active_user)) -> User:
    """Raise 403 if the current user is not an agronomist or admin."""
    if user.role not in (UserRole.agronomist, UserRole.admin):
        raise PermissionDeniedError("Agronomist or admin access required.")
    return user
