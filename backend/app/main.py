"""
CivicResolve FastAPI main entrypoint.
Configures CORS, static uploads mounting, database initialization, default seeding, and routers.
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import hash_password
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Department, User
from app.routes import admin, analytics, auth, complaints, departments

# Ensure database tables exist immediately on startup
Base.metadata.create_all(bind=engine)
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


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
    except Exception as e:
        db.rollback()
    finally:
        db.close()


# Run seeding on startup
try:
    seed_initial_data()
except Exception:
    pass

app = FastAPI(
    title="CivicResolve API",
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
upload_dir_path = Path(settings.UPLOAD_DIR)
upload_dir_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir_path)), name="uploads")

# Include Routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/")
def health_check():
    """Root health check."""
    return {
        "status": "healthy",
        "service": "CivicResolve API",
        "version": "1.0.0",
        "gemini_ai": "active" if bool(settings.GEMINI_API_KEY) else "fallback_mode",
    }
