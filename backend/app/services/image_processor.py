"""CropGuard Image Processing Service.

Validates, saves, and thumbnails uploaded crop images.
All file I/O is synchronous (Pillow) but called from async endpoints
via run_in_executor where necessary.
"""

import uuid
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import ImageProcessingError, UnsupportedMediaTypeError

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
# Magic bytes for JPEG and PNG
_JPEG_MAGIC = b"\xff\xd8\xff"
_PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
THUMBNAIL_SIZE = (256, 256)
MIN_DIMENSION = 100  # pixels


@dataclass
class ProcessedImage:
    """Metadata returned after a successful image upload & processing."""

    original_url: str  # path relative to UPLOAD_DIR
    thumbnail_url: str
    width: int
    height: int
    file_size_bytes: int
    format: str  # 'JPEG' or 'PNG'


class ImageProcessor:
    """Handles validation, storage, and thumbnail generation of crop images."""

    def __init__(self) -> None:
        self.upload_dir = Path(settings.UPLOAD_DIR)

    def _validate_magic(self, header: bytes) -> str:
        """Check magic bytes and return 'JPEG' or 'PNG'. Raises on unknown."""
        if header[:3] == _JPEG_MAGIC:
            return "JPEG"
        if header[:8] == _PNG_MAGIC:
            return "PNG"
        raise UnsupportedMediaTypeError(
            "File is not a valid JPEG or PNG image (magic bytes mismatch)."
        )

    def _validate_extension(self, filename: str) -> None:
        """Ensure the file extension is an allowed image type."""
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise UnsupportedMediaTypeError(
                f"File extension '{ext}' is not allowed. Use JPEG or PNG."
            )

    async def process(self, file: UploadFile, user_id: uuid.UUID) -> ProcessedImage:
        """Validate, save, and thumbnail the uploaded file.

        Steps:
        1. Check extension
        2. Read bytes and check size limit
        3. Verify magic bytes
        4. Open with Pillow and check minimum dimensions
        5. Save original
        6. Generate and save 256×256 thumbnail
        """
        # 1. Extension check
        self._validate_extension(file.filename or "upload.jpg")

        # 2. Read and size check
        image_bytes = await file.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(image_bytes) > max_bytes:
            raise ImageProcessingError(
                f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB."
            )

        # 3. Magic bytes check
        fmt = self._validate_magic(image_bytes[:8])

        # 4. Open with Pillow
        try:
            import io

            img = Image.open(io.BytesIO(image_bytes))
            img.verify()  # check integrity
            img = Image.open(io.BytesIO(image_bytes))  # re-open after verify
        except UnidentifiedImageError as exc:
            raise UnsupportedMediaTypeError("Cannot identify image format.") from exc
        except Exception as exc:
            raise ImageProcessingError(f"Invalid image file: {exc}") from exc

        width, height = img.size
        if width < MIN_DIMENSION or height < MIN_DIMENSION:
            raise ImageProcessingError(
                f"Image must be at least {MIN_DIMENSION}×{MIN_DIMENSION} pixels. "
                f"Got {width}×{height}."
            )

        # 5. Build output paths
        today = date.today().isoformat()
        file_id = uuid.uuid4()
        save_dir = self.upload_dir / str(user_id) / today
        save_dir.mkdir(parents=True, exist_ok=True)

        original_filename = f"{file_id}.jpg"
        thumb_filename = f"{file_id}_thumb.jpg"
        original_path = save_dir / original_filename
        thumb_path = save_dir / thumb_filename

        # Save original as JPEG
        img_rgb = img.convert("RGB")
        img_rgb.save(str(original_path), format="JPEG", quality=92)

        # 6. Thumbnail
        thumb = img_rgb.copy()
        thumb.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
        thumb.save(str(thumb_path), format="JPEG", quality=85)

        # Build relative URLs (served from /uploads/)
        rel_original = f"/uploads/{user_id}/{today}/{original_filename}"
        rel_thumb = f"/uploads/{user_id}/{today}/{thumb_filename}"

        return ProcessedImage(
            original_url=rel_original,
            thumbnail_url=rel_thumb,
            width=width,
            height=height,
            file_size_bytes=len(image_bytes),
            format=fmt,
        )
