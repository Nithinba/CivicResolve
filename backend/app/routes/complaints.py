"""
Complaint submission and citizen tracking endpoints.
"""

import math
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.auth import get_current_user
from app.database import get_db
from app.gemini_service import analyze_complaint, check_duplicate_complaints
from app.models import AIAnalysis, Complaint, ComplaintUpdate, Department, User
from app.schemas import (
    ComplaintResponse,
    ComplaintTrackResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    PaginatedComplaintsResponse,
)
from app.utils import (
    generate_complaint_id,
    sanitize_string,
    save_upload_file,
    validate_file_extension,
    validate_file_size,
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    title: str = Form(...),
    description: str = Form(...),
    location_text: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a new citizen civic complaint with optional image.
    Automatically initiates Google Gemini AI classification and department assignment.
    """
    clean_title = sanitize_string(title)
    clean_description = sanitize_string(description)
    clean_location = sanitize_string(location_text)

    if len(clean_title) < 5 or len(clean_title) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title must be between 5 and 200 characters",
        )
    if len(clean_description) < 10 or len(clean_description) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description must be between 10 and 5000 characters",
        )
    if len(clean_location) < 3 or len(clean_location) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location must be between 3 and 500 characters",
        )

    # Handle image upload if present
    saved_image_path = None
    if image and image.filename:
        if not validate_file_extension(image.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Allowed: .jpg, .jpeg, .png, .gif, .webp",
            )
        file_bytes = await image.read()
        if not validate_file_size(len(file_bytes)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image size exceeds maximum allowed size of 5 MB",
            )
        saved_image_path = save_upload_file(file_bytes, image.filename)

    # Generate unique complaint ID
    complaint_id_str = generate_complaint_id()

    # Step 1: Run Google Gemini AI analysis
    ai_result = analyze_complaint(clean_title, clean_description, clean_location)

    # Step 2: Attempt department matching based on AI recommendation
    matched_dept = None
    rec_dept_name = ai_result.get("department")
    if rec_dept_name:
        matched_dept = (
            db.query(Department)
            .filter(Department.name.ilike(f"%{rec_dept_name.split()[0]}%"))
            .first()
        )

    # Step 3: Create Complaint in DB
    new_complaint = Complaint(
        complaint_id=complaint_id_str,
        title=clean_title,
        description=clean_description,
        location_text=clean_location,
        latitude=latitude,
        longitude=longitude,
        image_path=saved_image_path,
        status="reported",
        citizen_id=current_user.id,
        department_id=matched_dept.id if matched_dept else None,
    )
    db.add(new_complaint)
    db.flush()

    # Step 4: Persist AI Analysis
    analysis_record = AIAnalysis(
        complaint_id=new_complaint.id,
        issue_category=ai_result.get("issue_category", "Other Civic Issues"),
        detected_problem=ai_result.get("detected_problem", clean_title),
        priority=ai_result.get("priority", "Medium"),
        severity_score=ai_result.get("severity_score", 5),
        public_safety_risk=ai_result.get("public_safety_risk", "Medium"),
        department=ai_result.get("department", "General Administration"),
        reason_for_classification=ai_result.get("reason_for_classification", "Automatic intake classification"),
        recommended_action=ai_result.get("recommended_action", "Municipal inspection required"),
        estimated_resolution_time=ai_result.get("estimated_resolution_time", "3-5 business days"),
        raw_response=ai_result.get("raw_response"),
    )
    db.add(analysis_record)

    # Step 5: Add initial update trail
    initial_update = ComplaintUpdate(
        complaint_id=new_complaint.id,
        previous_status=None,
        new_status="reported",
        remarks=f"Complaint lodged by citizen. AI routed to {ai_result.get('department')}.",
        updated_by_id=current_user.id,
    )
    db.add(initial_update)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


@router.get("", response_model=PaginatedComplaintsResponse)
def get_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get paginated complaints.
    Citizens only see their own complaints; Admins see all.
    """
    query = db.query(Complaint)
    if current_user.role != "admin":
        query = query.filter(Complaint.citizen_id == current_user.id)

    if status:
        query = query.filter(Complaint.status == status)

    if category or priority:
        query = query.join(Complaint.ai_analysis)
        if category:
            query = query.filter(AIAnalysis.issue_category == category)
        if priority:
            query = query.filter(AIAnalysis.priority == priority)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1

    items = (
        query.order_by(desc(Complaint.created_at))
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


@router.get("/track/{complaint_id_string}", response_model=ComplaintTrackResponse)
def track_complaint(complaint_id_string: str, db: Session = Depends(get_db)):
    """
    Public tracking endpoint using complaint ID string (e.g. CIV-261121-12345).
    Safely reveals status without exposing citizen personal identity.
    """
    complaint = (
        db.query(Complaint)
        .filter(Complaint.complaint_id == complaint_id_string.strip())
        .first()
    )
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint ID not found in system",
        )

    dept_name = complaint.department.name if complaint.department else (
        complaint.ai_analysis.department if complaint.ai_analysis else "Pending Assignment"
    )
    priority = complaint.ai_analysis.priority if complaint.ai_analysis else "Normal"
    latest_remark = complaint.updates[0].remarks if complaint.updates else None

    return ComplaintTrackResponse(
        complaint_id=complaint.complaint_id,
        title=complaint.title,
        status=complaint.status,
        department_name=dept_name,
        priority=priority,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        latest_update_remarks=latest_remark,
    )


@router.post("/check-duplicates", response_model=DuplicateCheckResponse)
def check_duplicates_endpoint(
    req: DuplicateCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze whether a potential grievance submission duplicates an existing complaint in the system.
    """
    # Fetch recent active complaints
    recent_complaints = (
        db.query(Complaint)
        .filter(Complaint.status.in_(["reported", "in_progress"]))
        .order_by(desc(Complaint.created_at))
        .limit(20)
        .all()
    )

    items = [
        {
            "complaint_id": c.complaint_id,
            "title": c.title,
            "description": c.description,
            "location_text": c.location_text,
        }
        for c in recent_complaints
    ]

    duplicates = check_duplicate_complaints(
        req.title, req.description, req.location_text, items
    )
    return DuplicateCheckResponse(potential_duplicates=duplicates)


@router.get("/{id}", response_model=ComplaintResponse)
def get_complaint_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get full complaint details with AI analysis, timeline updates, and resolution.
    Citizens can only view their own complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if current_user.role != "admin" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this complaint",
        )

    return complaint
