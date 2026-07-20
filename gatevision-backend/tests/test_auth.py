from app.config.settings import settings


def test_settings_loaded():
    assert settings.APP_NAME == "GateVision API"
    assert settings.VERSION == "1.0.0"
    assert settings.DATABASE_NAME == "gatevision"


def test_app_imports():
    from app.main import app
    assert app.title == "GateVision API"
    assert app.version == "1.0.0"
    routes = [r.path for r in app.routes]
    assert "/health" in routes
    assert "/api/v1/auth/register" in routes
    assert "/api/v1/auth/login" in routes
    assert "/api/v1/auth/me" in routes
    assert "/api/v1/users" in routes
    assert "/api/v1/camera/start" in routes
    assert "/api/v1/camera/stop" in routes
    assert "/api/v1/camera/status" in routes
    assert "/api/v1/camera/capture" in routes
    assert "/api/v1/camera/detect" in routes
    assert "/api/v1/storage/images" in routes
    assert "/api/v1/storage/image/{image_id}" in routes
    assert "/docs" in routes
    assert "/openapi.json" in routes


def test_response_schema():
    from app.schemas.response import APIResponse, ErrorResponse
    resp = APIResponse(success=True, message="test", data={"key": "value"})
    assert resp.success is True
    assert resp.message == "test"
    assert resp.data == {"key": "value"}

    err = ErrorResponse(success=False, message="error", errors=["err1"])
    assert err.success is False
    assert err.message == "error"
    assert err.errors == ["err1"]


def test_user_model():
    from app.models.user import UserRole
    assert UserRole.ADMIN.value == "admin"
    assert UserRole.SECURITY_OFFICER.value == "security_officer"


def test_user_schema():
    from app.schemas.user import UserCreate
    schema = UserCreate(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        password="password123",
    )
    assert schema.first_name == "John"
    assert schema.last_name == "Doe"


def test_auth_schema():
    from app.schemas.auth import RegisterRequest, LoginRequest
    reg = RegisterRequest(first_name="A", last_name="B", email="a@b.com", password="pass1234")
    assert reg.first_name == "A"
    login = LoginRequest(email="a@b.com", password="pass1234")
    assert login.email == "a@b.com"


def test_password_hashing():
    from app.security.password import hash_password, verify_password
    hashed = hash_password("testpassword123")
    assert hashed != "testpassword123"
    assert verify_password("testpassword123", hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_jwt_token():
    from app.security.jwt import create_access_token, decode_access_token
    token = create_access_token({"sub": "test_user_id"})
    assert token is not None
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "test_user_id"


def test_project_structure():
    import os
    expected_dirs = [
        "app/api/v1/auth",
        "app/api/v1/users",
        "app/api/v1/vehicles",
        "app/api/v1/entries",
        "app/api/v1/exits",
        "app/api/v1/logs",
        "app/api/v1/dashboard",
        "app/api/v1/health",
        "app/api/v1/camera",
        "app/api/v1/storage",
        "app/config",
        "app/core",
        "app/database",
        "app/middleware",
        "app/models",
        "app/repositories",
        "app/schemas",
        "app/services",
        "app/services/ai",
        "app/services/ai/camera",
        "app/security",
        "app/utils",
        "app/uploads",
        "app/static",
        "tests",
    ]
    for d in expected_dirs:
        assert os.path.isdir(d), f"Directory {d} not found"
    expected_files = [
        "app/main.py",
        "run.py",
        "requirements.txt",
        ".env.example",
    ]
    for f in expected_files:
        assert os.path.isfile(f), f"File {f} not found"
