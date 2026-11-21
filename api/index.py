import os
import sys
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# In Vercel serverless environment, use /tmp for writeable SQLite database and uploads
if "VERCEL" in os.environ or os.environ.get("VERCEL_ENV"):
    os.environ["DATABASE_URL"] = "sqlite:////tmp/civicresolve.db"
    os.environ["UPLOAD_DIR"] = "/tmp/uploads"

from app.main import app
