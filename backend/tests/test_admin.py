"""
Administrator dashboard, status update, reassignment, resolution, and authorization tests.
"""

def test_citizen_cannot_access_admin_dashboard(client, citizen_token):
    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert res.status_code == 403


def test_admin_dashboard_stats(client, admin_token):
    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_complaints" in data
    assert "reported_count" in data
    assert "in_progress_count" in data
    assert "resolved_count" in data
    assert "by_department" in data
    assert "by_category" in data


def test_admin_view_all_complaints(client, admin_token, citizen_token):
    # Ensure at least one complaint exists
    client.post(
        "/api/complaints",
        data={
            "title": "Road damage on bridge approach",
            "description": "Severe road crack causing vehicle vibrations on bridge approach road.",
            "location_text": "North River Bridge Sector 4",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    res = client.get(
        "/api/admin/complaints",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) >= 1


def test_update_complaint_status(client, admin_token, citizen_token):
    # Create complaint
    create_res = client.post(
        "/api/complaints",
        data={
            "title": "Blocked drainage overflow",
            "description": "Drain water overflowing into pedestrian walkway near market square.",
            "location_text": "Market Square Gate 2",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    complaint_id = create_res.json()["id"]

    # Admin updates status to in_progress
    update_res = client.put(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "in_progress", "remarks": "Sanitation crew dispatched to inspect drainage line."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "in_progress"


def test_update_complaint_department(client, admin_token, citizen_token):
    # Create complaint
    create_res = client.post(
        "/api/complaints",
        data={
            "title": "Damaged bus stop shelter bench",
            "description": "Wooden bench broken with sharp nails protruding.",
            "location_text": "City Center Bus Stop",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    complaint_id = create_res.json()["id"]

    # Update to department 1 (Road Maintenance)
    dept_res = client.put(
        f"/api/admin/complaints/{complaint_id}/department",
        json={"department_id": 1},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dept_res.status_code == 200
    assert dept_res.json()["department_id"] == 1


def test_resolve_complaint(client, admin_token, citizen_token):
    # Create complaint
    create_res = client.post(
        "/api/complaints",
        data={
            "title": "Broken street lamp near clinic",
            "description": "Streetlight fixture hanging precariously from cable.",
            "location_text": "Health Clinic Lane",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    complaint_id = create_res.json()["id"]

    # Admin marks resolved
    res = client.post(
        f"/api/admin/complaints/{complaint_id}/resolve",
        json={
            "resolution_description": "Field electrical engineer replaced damaged fitting with LED unit and tested safety ground.",
            "admin_remarks": "Completed successfully.",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "resolved"
    assert data["resolution"] is not None
    assert "LED unit" in data["resolution"]["resolution_description"]


def test_reject_complaint_with_reason(client, admin_token, citizen_token):
    # Create complaint
    create_res = client.post(
        "/api/complaints",
        data={
            "title": "Private lawn maintenance request",
            "description": "Requesting city workers to mow grass in my private residential backyard.",
            "location_text": "Private Villa 42",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    complaint_id = create_res.json()["id"]

    # Admin rejects
    reject_res = client.post(
        f"/api/admin/complaints/{complaint_id}/reject",
        json={"reason": "Municipal authority jurisdiction only covers public property and infrastructure."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"


def test_reject_complaint_short_reason(client, admin_token, citizen_token):
    # Create complaint
    create_res = client.post(
        "/api/complaints",
        data={
            "title": "Another complaint",
            "description": "Testing rejection validation for short explanations.",
            "location_text": "Test Street",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    complaint_id = create_res.json()["id"]

    # Admin rejects with too short reason (< 10 chars)
    reject_res = client.post(
        f"/api/admin/complaints/{complaint_id}/reject",
        json={"reason": "No"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reject_res.status_code == 422
