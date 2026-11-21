"""
Utility helpers – ID generation, file validation, etc.
"""

import os
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings


def generate_complaint_id() -> str:
    """
    Generate a unique complaint ID in the format ``CIV-YYMMDD-XXXXX``.

    Example: ``CIV-261121-48372``
    """
    now = datetime.now(timezone.utc)
    date_part = now.strftime("%y%m%d")
    random_part = f"{random.randint(0, 99999):05d}"
    return f"CIV-{date_part}-{random_part}"


def validate_file_extension(filename: str) -> bool:
    """Return True if the file extension is in the allowed set."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in settings.ALLOWED_EXTENSIONS


def validate_file_size(size: int) -> bool:
    """Return True if the file does not exceed the max upload size."""
    return size <= settings.MAX_FILE_SIZE


def save_upload_file(file_bytes: bytes, original_filename: str) -> str:
    """
    Persist an uploaded file under the configured upload directory.

    Returns the relative path suitable for storage in the database.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_name
    file_path.write_bytes(file_bytes)
    return str(file_path)


def sanitize_string(value: str) -> str:
    """Strip leading/trailing whitespace from a string."""
    return value.strip() if value else value
