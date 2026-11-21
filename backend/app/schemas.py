"""
Pydantic schemas for request validation and response serialisation.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    """Body for POST /api/auth/register."""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username must contain only letters, digits, and underscores")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, v: str) -> str:
        return v.strip()


class UserResponse(BaseModel):
    """Public user representation (never includes password)."""
    id: int
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token response after login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------------------------
# AI Analysis
# ---------------------------------------------------------------------------

class AIAnalysisResponse(BaseModel):
    """AI analysis of a complaint."""
    id: int
    issue_category: str
    detected_problem: str
    priority: str
    severity_score: int
    public_safety_risk: str
    department: str
    reason_for_classification: str
    recommended_action: str
    estimated_resolution_time: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Complaint Updates
# ---------------------------------------------------------------------------

class ComplaintUpdateResponse(BaseModel):
    """A single status-update entry."""
    id: int
    previous_status: Optional[str] = None
    new_status: str
    remarks: Optional[str] = None
    updated_by_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Resolution
# ---------------------------------------------------------------------------

class ResolutionResponse(BaseModel):
    """Resolution record for a resolved complaint."""
    id: int
    resolution_description: str
    resolution_date: datetime
    admin_remarks: Optional[str] = None
    resolved_by_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Complaints
# ---------------------------------------------------------------------------

class DepartmentResponse(BaseModel):
    """Department information."""
    id: int
    name: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ComplaintResponse(BaseModel):
    """Full complaint response (authenticated views)."""
    id: int
    complaint_id: str
    title: str
    description: str
    location_text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_path: Optional[str] = None
    status: str
    citizen_id: int
    department_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None
    ai_analysis: Optional[AIAnalysisResponse] = None
    updates: List[ComplaintUpdateResponse] = []
    resolution: Optional[ResolutionResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComplaintTrackResponse(BaseModel):
    """Public complaint tracking response – NO citizen personal info."""
    complaint_id: str
    title: str
    status: str
    department_name: Optional[str] = None
    priority: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    latest_update_remarks: Optional[str] = None


class PaginatedComplaintsResponse(BaseModel):
    """Paginated list of complaints."""
    items: List[ComplaintResponse]
    total: int
    page: int
    pages: int
    limit: int


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

class StatusUpdateRequest(BaseModel):
    """Body for PUT /api/admin/complaints/{id}/status."""
    status: str = Field(..., pattern=r"^(in_progress|reported)$")
    remarks: Optional[str] = Field(None, max_length=2000)


class DepartmentUpdateRequest(BaseModel):
    """Body for PUT /api/admin/complaints/{id}/department."""
    department_id: int


class ResolveRequest(BaseModel):
    """Body for POST /api/admin/complaints/{id}/resolve."""
    resolution_description: str = Field(..., min_length=5, max_length=5000)
    admin_remarks: Optional[str] = Field(None, max_length=2000)


class RejectRequest(BaseModel):
    """Body for POST /api/admin/complaints/{id}/reject."""
    reason: str = Field(..., min_length=10, max_length=2000)


class DepartmentCount(BaseModel):
    name: str
    count: int


class CategoryCount(BaseModel):
    category: str
    count: int


class DashboardResponse(BaseModel):
    """Admin dashboard overview."""
    total_complaints: int
    reported_count: int
    in_progress_count: int
    resolved_count: int
    rejected_count: int
    critical_count: int
    by_department: List[DepartmentCount]
    by_category: List[CategoryCount]
    recent_complaints: List[ComplaintResponse]


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

class DistributionItem(BaseModel):
    label: str
    count: int


class MonthlyTrend(BaseModel):
    month: str
    count: int


class AnalyticsOverviewResponse(BaseModel):
    category_distribution: List[DistributionItem]
    priority_distribution: List[DistributionItem]
    status_distribution: List[DistributionItem]
    monthly_trends: List[MonthlyTrend]


class DepartmentAnalytics(BaseModel):
    department_name: str
    total_complaints: int
    resolved_complaints: int
    avg_resolution_days: Optional[float] = None


class DepartmentAnalyticsResponse(BaseModel):
    departments: List[DepartmentAnalytics]


# ---------------------------------------------------------------------------
# Duplicate check
# ---------------------------------------------------------------------------

class DuplicateCheckRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    location_text: str = Field(..., min_length=3, max_length=500)


class DuplicateMatch(BaseModel):
    complaint_id: str
    title: str
    similarity_reason: str


class DuplicateCheckResponse(BaseModel):
    potential_duplicates: List[DuplicateMatch]
