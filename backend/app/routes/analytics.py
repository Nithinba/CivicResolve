"""
Civic intelligence analytics endpoints for data-driven municipal operations.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import get_current_admin
from app.database import get_db
from app.models import (
    AIAnalysis,
    Complaint,
    Department,
    ResolutionRecord,
    User,
)
from app.schemas import (
    AnalyticsOverviewResponse,
    DepartmentAnalyticsResponse,
    DistributionItem,
    MonthlyTrend,
)

router = APIRouter(prefix="/analytics", tags=["Civic Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get aggregated civic intelligence distributions and trends.
    """
    # 1. Category distribution
    cat_rows = (
        db.query(AIAnalysis.issue_category, func.count(AIAnalysis.id))
        .group_by(AIAnalysis.issue_category)
        .all()
    )
    categories = [DistributionItem(label=r[0] or "Uncategorized", count=r[1]) for r in cat_rows]

    # 2. Priority distribution
    pri_rows = (
        db.query(AIAnalysis.priority, func.count(AIAnalysis.id))
        .group_by(AIAnalysis.priority)
        .all()
    )
    priorities = [DistributionItem(label=r[0] or "Normal", count=r[1]) for r in pri_rows]

    # 3. Status distribution
    stat_rows = (
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    statuses = [DistributionItem(label=r[0], count=r[1]) for r in stat_rows]

    # 4. Monthly trends (last 6 months or all months present)
    month_rows = (
        db.query(
            func.strftime("%Y-%m", Complaint.created_at).label("month"),
            func.count(Complaint.id),
        )
        .group_by("month")
        .order_by("month")
        .limit(12)
        .all()
    )
    trends = [MonthlyTrend(month=r[0] or datetime.now(timezone.utc).strftime("%Y-%m"), count=r[1]) for r in month_rows]
    if not trends:
        trends = [MonthlyTrend(month=datetime.now(timezone.utc).strftime("%Y-%m"), count=0)]

    return AnalyticsOverviewResponse(
        category_distribution=categories,
        priority_distribution=priorities,
        status_distribution=statuses,
        monthly_trends=trends,
    )


@router.get("/departments", response_model=DepartmentAnalyticsResponse)
def get_departments_analytics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Performance analytics per municipal department.
    """
    departments = db.query(Department).filter(Department.is_active == True).all()
    results = []

    for d in departments:
        total = db.query(func.count(Complaint.id)).filter(Complaint.department_id == d.id).scalar() or 0
        resolved = (
            db.query(func.count(Complaint.id))
            .filter(Complaint.department_id == d.id, Complaint.status == "resolved")
            .scalar()
            or 0
        )

        # Calculate average resolution days
        resolved_records = (
            db.query(Complaint.created_at, ResolutionRecord.resolution_date)
            .join(ResolutionRecord, Complaint.id == ResolutionRecord.complaint_id)
            .filter(Complaint.department_id == d.id)
            .all()
        )
        if resolved_records:
            total_days = sum(
                max(0.1, (r[1] - r[0]).total_seconds() / 86400.0)
                for r in resolved_records
                if r[1] and r[0]
            )
            avg_days = round(total_days / len(resolved_records), 1)
        else:
            avg_days = 0.0

        results.append({
            "department_name": d.name,
            "total_complaints": total,
            "resolved_complaints": resolved,
            "avg_resolution_days": avg_days,
        })

    return DepartmentAnalyticsResponse(departments=results)
