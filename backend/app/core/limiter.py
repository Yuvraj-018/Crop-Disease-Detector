"""CropGuard Rate Limiting Configuration.

Defines the slowapi Limiter instance and custom key functions.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_or_ip(request: Request) -> str:
    """Return 'user_<user_id>' if authenticated, fallback to remote IP address."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from app.core.security import decode_token

            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                return f"user_{user_id}"
        except Exception:
            pass
    return get_remote_address(request)


# Initialize slowapi Limiter with default IP-based limiting
limiter = Limiter(key_func=get_remote_address)
