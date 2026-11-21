"""
Administrator complaint management, resolution workflows, and administrative actions.
"""

from datetime import datetime, timezone
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc

from app.auth import get_current_admin
from app.database import get_db
from app.models import (
    AIAnalysis,
    Complaint,
    ComplaintUpdate,
    Department,
    ResolutionRecord,
    User,
)
from app.schemas import (
    ComplaintResponse,
    DashboardResponse,
    DepartmentUpdateRequest,
    PaginatedComplaintsResponse,
    RejectRequest,
    ResolveRequest,
    StatusUpdateRequest,
)

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_admin_dashboard(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get live system-wide statistics for the administrator dashboard.
    """
    total = db.query(func.count(Complaint.id)).scalar() or 0
    reported = db.query(func.count(Complaint.id)).filter(Complaint.status == "reported").scalar() or 0
    in_progress = db.query(func.count(Complaint.id)).filter(Complaint.status == "in_progress").scalar() or 0
    resolved = db.query(func.count(Complaint.id)).filter(Complaint.status == "resolved").scalar() or 0
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.status == "rejected").scalar() or 0

    critical_count = (
        db.query(func.count(Complaint.id))
        .join(Complaint.ai_analysis)
        .filter(AIAnalysis.priority == "Critical", Complaint.status != "resolved", Complaint.status != "rejected")
        .scalar()
        or 0
    )

    # By department
    dept_rows = (
        db.query(Department.name, func.count(Complaint.id))
        .outerjoin(Complaint, Department.id == Complaint.department_id)
        .group_by(Department.name)
        .all()
    )
    by_department = [{"name": r[0], "count": r[1]} for r in dept_rows]

    # By category
    cat_rows = (
        db.query(AIAnalysis.issue_category, func.count(AIAnalysis.id))
        .group_by(AIAnalysis.issue_category)
        .all()
    )
    by_category = [{"category": r[0], "count": r[1]} for r in cat_rows]

    # Recent 5 complaints
    recent = (
        db.query(Complaint)
        .order_by(desc(Complaint.created_at))
        .limit(5)
        .all()
    )

    return DashboardResponse(
        total_complaints=total,
        reported_count=reported,
        in_progress_count=in_progress,
        resolved_count=resolved,
        rejected_count=rejected,
        critical_count=critical_count,
        by_department=by_department,
        by_category=by_category,
        recent_complaints=recent,
    )


@router.get("/complaints", response_model=PaginatedComplaintsResponse)
def get_all_complaints_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Administrator complaints listing with comprehensive filtering, search, and priority sorting.
    """
    query = db.query(Complaint).outerjoin(Complaint.ai_analysis)

    if status:
        query = query.filter(Complaint.status == status)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if category:
        query = query.filter(AIAnalysis.issue_category == category)
    if priority:
        query = query.filter(AIAnalysis.priority == priority)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Complaint.title.ilike(search_pattern))
            | (Complaint.description.ilike(search_pattern))
            | (Complaint.complaint_id.ilike(search_pattern))
            | (Complaint.location_text.ilike(search_pattern))
        )

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1

    # Order by Critical priority first, then date descending
    priority_order = case(
        (AIAnalysis.priority == "Critical", 1),
        (AIAnalysis.priority == "High", 2),
        (AIAnalysis.priority == "Medium", 3),
        (AIAnalysis.priority == "Low", 4),
        else_=5,
    )

    items = (
        query.order_by(priority_order, desc(Complaint.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return PaginatedComplaintsResponse(
        items=items,
        total=total,
        page=page,
        pages=pages,
        limit=limit,
    )


@router.get("/complaints/{id}", response_model=ComplaintResponse)
def get_complaint_admin(
    id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get complaint details with full administrative scope.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    return complaint


@router.put("/complaints/{id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    id: int,
    req: StatusUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Update complaint status to 'in_progress' or 'reported' with administrative remarks.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = req.status
    complaint.updated_at = datetime.now(timezone.utc)

    # Log trail
    update_log = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=old_status,
        new_status=req.status,
        remarks=req.remarks or f"Status transitioned to {req.status} by administrator.",
        updated_by_id=admin.id,
    )
    db.add(update_log)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.put("/complaints/{id}/department", response_model=ComplaintResponse)
def update_complaint_department(
    id: int,
    req: DepartmentUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Assign or reassign the responsible department.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    dept = db.query(Department).filter(Department.id == req.department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected department does not exist")

    old_dept_name = complaint.department.name if complaint.department else "Unassigned"
    complaint.department_id = dept.id
    complaint.updated_at = datetime.now(timezone.utc)

    update_log = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=complaint.status,
        new_status=complaint.status,
        remarks=f"Department reassigned from '{old_dept_name}' to '{dept.name}' by admin.",
        updated_by_id=admin.id,
    )
    db.add(update_log)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/complaints/{id}/resolve", response_model=ComplaintResponse)
def resolve_complaint(
    id: int,
    req: ResolveRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Officially resolve a grievance with resolution details and audit log.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = "resolved"
    now_utc = datetime.now(timezone.utc)
    complaint.updated_at = now_utc

    # Create or update resolution record
    if complaint.resolution:
        complaint.resolution.resolution_description = req.resolution_description
        complaint.resolution.resolution_date = now_utc
        complaint.resolution.admin_remarks = req.admin_remarks
        complaint.resolution.resolved_by_id = admin.id
    else:
        res = ResolutionRecord(
            complaint_id=complaint.id,
            resolution_description=req.resolution_description,
            resolution_date=now_utc,
            admin_remarks=req.admin_remarks,
            resolved_by_id=admin.id,
        )
        db.add(res)

    # Add update record
    update_log = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=old_status,
        new_status="resolved",
        remarks=f"Issue marked Resolved. Description: {req.resolution_description}",
        updated_by_id=admin.id,
    )
    db.add(update_log)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/complaints/{id}/reject", response_model=ComplaintResponse)
def reject_complaint(
    id: int,
    req: RejectRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Reject an invalid or out-of-jurisdiction complaint with mandatory explanation.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = "rejected"
    complaint.updated_at = datetime.now(timezone.utc)

    update_log = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=old_status,
        new_status="rejected",
        remarks=f"Complaint Rejected by authority. Reason: {req.reason}",
        updated_by_id=admin.id,
    )
    db.add(update_log)
    db.commit()
    db.refresh(complaint)
    return complaint
