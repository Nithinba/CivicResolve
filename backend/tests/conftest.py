"""
Pytest fixtures and test database setup for CivicResolve backend tests.
Uses in-memory SQLite with StaticPool for fast, isolated, lock-free execution.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Department, User

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables and seed data for testing session."""
    Base.metadata.create_all(bind=test_engine)

    db = TestingSessionLocal()
    try:
        # Seed departments
        depts = [
            Department(name="Road Maintenance Department", description="Roads", is_active=True),
            Department(name="Sanitation Department", description="Waste", is_active=True),
            Department(name="Water Supply Department", description="Water", is_active=True),
            Department(name="Electricity Department", description="Electric", is_active=True),
            Department(name="Drainage Department", description="Drainage", is_active=True),
            Department(name="Public Safety Department", description="Safety", is_active=True),
            Department(name="General Administration", description="Admin", is_active=True),
        ]
        db.add_all(depts)

        # Seed admin
        admin_user = User(
            username="admin_tester",
            email="admin_tester@civicresolve.gov",
            hashed_password=hash_password("AdminTest@123"),
            full_name="Admin Tester",
            role="admin",
            is_active=True,
        )
        db.add(admin_user)

        # Seed citizen
        citizen_user = User(
            username="citizen_tester",
            email="citizen_tester@example.com",
            hashed_password=hash_password("CitizenTest@123"),
            full_name="Citizen Tester",
            role="citizen",
            is_active=True,
        )
        db.add(citizen_user)

        # Seed secondary citizen
        other_citizen = User(
            username="other_citizen",
            email="other@example.com",
            hashed_password=hash_password("OtherPass@123"),
            full_name="Other Citizen",
            role="citizen",
            is_active=True,
        )
        db.add(other_citizen)

        db.commit()
    finally:
        db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """Test client."""
    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture
def db_session():
    """Yield DB session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def citizen_token(db_session):
    user = db_session.query(User).filter(User.username == "citizen_tester").first()
    return create_access_token(data={"sub": str(user.id), "role": user.role})


@pytest.fixture
def other_citizen_token(db_session):
    user = db_session.query(User).filter(User.username == "other_citizen").first()
    return create_access_token(data={"sub": str(user.id), "role": user.role})


@pytest.fixture
def admin_token(db_session):
    user = db_session.query(User).filter(User.username == "admin_tester").first()
    return create_access_token(data={"sub": str(user.id), "role": user.role})
