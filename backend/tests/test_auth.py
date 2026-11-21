"""
Authentication test suite covering registration, validation, login, and authorization.
"""

def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "new_citizen",
            "email": "new_citizen@example.com",
            "password": "Password123!",
            "full_name": "New Citizen",
            "phone": "555-1234",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "new_citizen"
    assert data["email"] == "new_citizen@example.com"
    assert data["role"] == "citizen"
    assert "hashed_password" not in data


def test_register_duplicate_username(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "citizen_tester",
            "email": "unique@example.com",
            "password": "Password123!",
            "full_name": "Duplicate Test",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_duplicate_email(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "unique_username",
            "email": "citizen_tester@example.com",
            "password": "Password123!",
            "full_name": "Duplicate Test",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_invalid_email(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "invalid_email_user",
            "email": "not-an-email",
            "password": "Password123!",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 422


def test_register_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "short_pw_user",
            "email": "short@example.com",
            "password": "123",
            "full_name": "Short Password",
        },
    )
    assert response.status_code == 422


def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "citizen_tester", "password": "CitizenTest@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "citizen_tester"


def test_login_wrong_password(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "citizen_tester", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "nobody_exists", "password": "SomePassword123"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, citizen_token):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "citizen_tester"


def test_get_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
