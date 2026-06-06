"""CropGuard FastAPI Application Entry Point.

This module initialises the FastAPI application with all middleware,
exception handlers, static file mounts, and API routers.
"""

import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    CropGuardException,
    DatabaseError,
    ImageProcessingError,
    ImageTooLargeError,
    ImageValidationError,
    InferenceError,
    PermissionDeniedError,
    ResourceNotFoundError,
    UnsupportedFileTypeError,
    UnsupportedMediaTypeError,
)
from app.core.limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create required directories on startup, clean up on shutdown."""
    uploads_dir = Path(settings.UPLOAD_DIR)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="CropGuard API",
    description="Crop disease detection and treatment recommendation API.",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.limiter = limiter


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next) -> Response:
    """Log every request with method, path, status code, duration, and user ID."""
    start_time = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from app.core.security import decode_token

            payload = decode_token(token)
            user_id = payload.get("sub")
        except Exception:
            pass

    user_id_str = f"user_id={user_id}" if user_id else "user_id=None"
    print(
        f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
        f"{request.method} {request.url.path} "
        f"{response.status_code} {duration_ms:.0f}ms {user_id_str}"
    )
    return response


# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------

uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------


def _error_response(
    code: str, message: str, details=None, status_code: int = 500
) -> JSONResponse:
    """Build a standardised JSON error response."""
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details}},
    )


@app.exception_handler(CropGuardException)
async def cropguard_exception_handler(request: Request, exc: CropGuardException):
    """Handle base CropGuard exceptions as HTTP 500."""
    return _error_response("INTERNAL_ERROR", str(exc), status_code=500)


@app.exception_handler(ImageValidationError)
async def image_validation_handler(request: Request, exc: ImageValidationError):
    """Handle image validation failures as HTTP 400."""
    return _error_response("IMAGE_VALIDATION_ERROR", str(exc), status_code=400)


@app.exception_handler(ImageTooLargeError)
async def image_too_large_handler(request: Request, exc: ImageTooLargeError):
    """Handle oversized images as HTTP 413."""
    return _error_response("IMAGE_TOO_LARGE", str(exc), status_code=413)


@app.exception_handler(UnsupportedFileTypeError)
async def unsupported_file_type_handler(
    request: Request, exc: UnsupportedFileTypeError
):
    """Handle unsupported file types as HTTP 415."""
    return _error_response("UNSUPPORTED_FILE_TYPE", str(exc), status_code=415)


@app.exception_handler(ImageProcessingError)
async def image_processing_handler(request: Request, exc: ImageProcessingError):
    """Handle corrupt/invalid image files as HTTP 400."""
    return _error_response("IMAGE_PROCESSING_ERROR", str(exc), status_code=400)


@app.exception_handler(UnsupportedMediaTypeError)
async def unsupported_media_type_handler(
    request: Request, exc: UnsupportedMediaTypeError
):
    """Handle wrong magic bytes / bad extension as HTTP 415."""
    return _error_response("UNSUPPORTED_MEDIA_TYPE", str(exc), status_code=415)


@app.exception_handler(AuthenticationError)
async def authentication_handler(request: Request, exc: AuthenticationError):
    """Handle authentication failures as HTTP 401."""
    return _error_response("AUTHENTICATION_ERROR", str(exc), status_code=401)


@app.exception_handler(PermissionDeniedError)
async def permission_denied_handler(request: Request, exc: PermissionDeniedError):
    """Handle permission failures as HTTP 403."""
    return _error_response("PERMISSION_DENIED", str(exc), status_code=403)


@app.exception_handler(ResourceNotFoundError)
async def resource_not_found_handler(request: Request, exc: ResourceNotFoundError):
    """Handle missing resources as HTTP 404."""
    return _error_response("NOT_FOUND", str(exc), status_code=404)


@app.exception_handler(DatabaseError)
async def database_error_handler(request: Request, exc: DatabaseError):
    """Handle database errors as HTTP 500."""
    return _error_response("DATABASE_ERROR", str(exc), status_code=500)


@app.exception_handler(InferenceError)
async def inference_error_handler(request: Request, exc: InferenceError):
    """Handle ML inference errors as HTTP 500."""
    return _error_response("INFERENCE_ERROR", str(exc), status_code=500)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit hits as HTTP 429 using standardized JSON format."""
    return _error_response(
        "RATE_LIMIT_EXCEEDED",
        "Too many requests. Please try again later.",
        status_code=429,
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Health"])
async def health_check():
    """Return application health status."""
    return {"status": "ok", "version": "0.1.0", "database": "connected"}
