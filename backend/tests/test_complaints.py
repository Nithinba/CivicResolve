"""
Complaint submission, retrieval, tracking, and duplicate check tests.
"""

def test_submit_complaint_success(client, citizen_token):
    response = client.post(
        "/api/complaints",
        data={
            "title": "Severe Pothole on Main Street",
            "description": "Deep dangerous pothole near the central junction causing vehicle damage and traffic bottleneck.",
            "location_text": "Corner of 5th Ave and Main St, Downtown",
            "latitude": 37.7749,
            "longitude": -122.4194,
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["complaint_id"].startswith("CIV-")
    assert data["title"] == "Severe Pothole on Main Street"
    assert data["status"] == "reported"
    assert data["ai_analysis"] is not None
    assert data["ai_analysis"]["issue_category"] in [
        "Road Infrastructure", "Waste Management", "Water Supply",
        "Electricity and Streetlights", "Drainage and Sanitation",
        "Public Safety", "Other Civic Issues"
    ]
    assert data["ai_analysis"]["priority"] in ["Critical", "High", "Medium", "Low"]


def test_submit_complaint_unauthenticated(client):
    response = client.post(
        "/api/complaints",
        data={
            "title": "Unauthenticated Complaint",
            "description": "This should not be allowed without a valid citizen auth token.",
            "location_text": "Nowhere",
        },
    )
    assert response.status_code == 401


def test_submit_complaint_invalid_title(client, citizen_token):
    response = client.post(
        "/api/complaints",
        data={
            "title": "Bad",
            "description": "Description is sufficiently long but title is too short.",
            "location_text": "Valid location",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert response.status_code == 400
    assert "Title must be between" in response.json()["detail"]


def test_get_own_complaints(client, citizen_token):
    response = client.get(
        "/api/complaints",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_citizen_cannot_see_others_complaint_by_id(client, citizen_token, other_citizen_token):
    # Create complaint as other citizen
    res = client.post(
        "/api/complaints",
        data={
            "title": "Water leak in residential lane",
            "description": "Fresh water leaking from high pressure underground pipe.",
            "location_text": "Block C, Green Park",
        },
        headers={"Authorization": f"Bearer {other_citizen_token}"},
    )
    other_complaint_id = res.json()["id"]

    # Try to access with first citizen
    access_attempt = client.get(
        f"/api/complaints/{other_complaint_id}",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert access_attempt.status_code == 403


def test_track_complaint_by_id(client, citizen_token):
    # Submit one first
    res = client.post(
        "/api/complaints",
        data={
            "title": "Flickering streetlight outside school",
            "description": "Streetlight keeps going off at night creating hazardous dark zone near school crossing.",
            "location_text": "Opposite St. Mary School",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    complaint_code = res.json()["complaint_id"]

    # Public track without auth
    track_res = client.get(f"/api/complaints/track/{complaint_code}")
    assert track_res.status_code == 200
    data = track_res.json()
    assert data["complaint_id"] == complaint_code
    assert data["status"] == "reported"
    # Ensure no citizen private fields
    assert "citizen" not in data
    assert "citizen_id" not in data


def test_track_nonexistent_complaint(client):
    track_res = client.get("/api/complaints/track/CIV-999999-00000")
    assert track_res.status_code == 404


def test_check_duplicates(client, citizen_token):
    response = client.post(
        "/api/complaints/check-duplicates",
        json={
            "title": "Severe Pothole on Main Street",
            "description": "Vehicle damage pothole near central junction",
            "location_text": "Main St Downtown",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "potential_duplicates" in data
