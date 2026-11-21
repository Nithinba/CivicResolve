"""
CivicResolve FastAPI main entrypoint.
Unified production server: serves the REST APIs, uploaded evidence images,
and the built React Single Page Application (SPA).
"""

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.auth import hash_password
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Department, User
from app.routes import admin, analytics, auth, complaints, departments

# Ensure database tables exist immediately on startup
Base.metadata.create_all(bind=engine)
upload_dir_path = Path(settings.UPLOAD_DIR)
upload_dir_path.mkdir(parents=True, exist_ok=True)


def seed_initial_data():
    """Seed default municipal departments and default administrator user if they do not exist."""
    db = SessionLocal()
    try:
        # Default Departments
        default_depts = [
            ("Road Maintenance Department", "Repairs roads, potholes, pavements, and street dividers."),
            ("Sanitation Department", "Manages municipal garbage collection, bin overflow, and waste clearance."),
            ("Water Supply Department", "Maintains public water pipes, pressure, and clean drinking water distribution."),
            ("Electricity Department", "Maintains municipal streetlights, transformers, and electrical wiring safety."),
            ("Drainage Department", "Clears clogged sewers, storm drains, and open manholes."),
            ("Public Safety Department", "Oversees civic safety hazards, unsafe public spaces, and structural risks."),
            ("General Administration", "Handles cross-departmental and general civic infrastructure grievances."),
        ]
        for name, desc in default_depts:
            if not db.query(Department).filter(Department.name == name).first():
                db.add(Department(name=name, description=desc, is_active=True))

        # Default Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            db.add(
                User(
                    username="admin",
                    email="admin@civicresolve.gov",
                    hashed_password=hash_password("Admin@123456"),
                    full_name="Municipal Administrator",
                    phone="1800-CIVIC-01",
                    role="admin",
                    is_active=True,
                )
            )

        # Default Citizen Demo User for easy testing
        citizen_user = db.query(User).filter(User.username == "citizen").first()
        if not citizen_user:
            db.add(
                User(
                    username="citizen",
                    email="citizen@example.com",
                    hashed_password=hash_password("Citizen@123456"),
                    full_name="Jane Doe",
                    phone="555-0199",
                    role="citizen",
                    is_active=True,
                )
            )

        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


# Run seeding on startup
try:
    seed_initial_data()
except Exception:
    pass

app = FastAPI(
    title="CivicResolve Platform",
    description="AI-Powered Citizen Grievance Management and Resolution Platform API",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files directory for public viewing of issue/resolution images
app.mount("/uploads", StaticFiles(directory=str(upload_dir_path)), name="uploads")

# Include Routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/api/health")
def health_check():
    """Root health check for APIs."""
    return {
        "status": "healthy",
        "service": "CivicResolve Platform",
        "version": "1.0.0",
        "gemini_ai": "active" if bool(settings.GEMINI_API_KEY) else "fallback_mode",
    }


# Frontend SPA mounting
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Do not catch /api or /uploads requests that were not matched
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            raise HTTPException(status_code=404, detail="API route not found")

        target_file = frontend_dist / full_path
        if full_path and target_file.exists() and target_file.is_file():
            return FileResponse(str(target_file))

        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))

        return {"message": "CivicResolve API Online. Frontend dist not found."}
else:
    @app.get("/")
    def index_root():
        return {
            "status": "healthy",
            "service": "CivicResolve API",
            "message": "API is operational. Build frontend to view unified portal.",
        }
