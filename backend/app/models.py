"""
SQLAlchemy ORM models for CivicResolve.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _utcnow() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(timezone.utc)


class User(Base):
    """Registered user (citizen or admin)."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), nullable=False, default="citizen")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)

    # Relationships
    complaints = relationship("Complaint", back_populates="citizen", lazy="dynamic")


class Department(Base):
    """Municipal department responsible for resolving complaints."""

    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    contact_email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    complaints = relationship("Complaint", back_populates="department", lazy="dynamic")


class Complaint(Base):
    """A civic complaint submitted by a citizen."""

    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location_text = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_path = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="reported")
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Relationships
    citizen = relationship("User", back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    ai_analysis = relationship("AIAnalysis", back_populates="complaint", uselist=False, lazy="joined")
    updates = relationship("ComplaintUpdate", back_populates="complaint", order_by="ComplaintUpdate.created_at.desc()", lazy="joined")
    resolution = relationship("ResolutionRecord", back_populates="complaint", uselist=False, lazy="joined")


class AIAnalysis(Base):
    """AI-generated analysis of a complaint."""

    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    issue_category = Column(String(100), nullable=False)
    detected_problem = Column(String(500), nullable=False)
    priority = Column(String(20), nullable=False)
    severity_score = Column(Integer, nullable=False)
    public_safety_risk = Column(String(50), nullable=False)
    department = Column(String(100), nullable=False)
    reason_for_classification = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    estimated_resolution_time = Column(String(100), nullable=False)
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="ai_analysis")


class ComplaintUpdate(Base):
    """Status update log entry for a complaint."""

    __tablename__ = "complaint_updates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    previous_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    remarks = Column(Text, nullable=True)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="updates")
    updated_by = relationship("User")


class ResolutionRecord(Base):
    """Final resolution details for a resolved complaint."""

    __tablename__ = "resolution_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    resolution_description = Column(Text, nullable=False)
    resolution_date = Column(DateTime, nullable=False)
    admin_remarks = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="resolution")
    resolved_by = relationship("User")
