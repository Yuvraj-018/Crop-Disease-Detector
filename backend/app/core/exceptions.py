"""CropGuard Custom Exceptions.

All application-specific exceptions inherit from CropGuardException.
Each exception maps to a specific HTTP status code, handled
by registered exception handlers in main.py.
"""


class CropGuardException(Exception):  # noqa: N818
    """Base exception for all CropGuard errors. Maps to HTTP 500."""


class ImageValidationError(CropGuardException):
    """Raised when an uploaded image fails validation checks. Maps to HTTP 400."""


class ImageProcessingError(CropGuardException):
    """Raised when image processing fails (bad dimensions, corrupt file). Maps to 400."""


class ImageTooLargeError(CropGuardException):
    """Raised when an uploaded image exceeds the size limit. Maps to HTTP 413."""


class UnsupportedFileTypeError(CropGuardException):
    """Raised when an uploaded file type is not supported. Maps to HTTP 415."""


class UnsupportedMediaTypeError(CropGuardException):
    """Alias used by image_processor — invalid magic bytes or extension. Maps to 415."""


class AuthenticationError(CropGuardException):
    """Raised on authentication failures (invalid/expired token). Maps to HTTP 401."""


class PermissionDeniedError(CropGuardException):
    """Raised when a user lacks permission for an action. Maps to HTTP 403."""


class ResourceNotFoundError(CropGuardException):
    """Raised when a requested resource does not exist. Maps to HTTP 404."""


class DatabaseError(CropGuardException):
    """Raised on unexpected database errors. Maps to HTTP 500."""


class InferenceError(CropGuardException):
    """Raised when the ML inference pipeline fails. Maps to HTTP 500."""
