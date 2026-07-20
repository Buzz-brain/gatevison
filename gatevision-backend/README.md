# GateVision API

AI-powered Intelligent Vehicle Access Control System backend.

## Overview

GateVision is a production-grade backend for an intelligent vehicle access control system. It manages vehicle entry/exit, user authentication, and access logging with a clean, modular architecture designed for future AI integration.

## Features

- JWT-based authentication with role-based access control
- User management (Admin, Security Officer roles)
- MongoDB integration via Beanie ODM
- Repository pattern for clean data access
- Rate limiting, CORS, and security headers
- Structured logging (app + error logs)
- Standardized API response format
- Async-first, type-hinted codebase
- Swagger/OpenAPI documentation

## Tech Stack

- **Framework:** FastAPI
- **Database:** MongoDB (via Motor + Beanie)
- **Auth:** JWT + bcrypt
- **Validation:** Pydantic v2
- **Config:** Pydantic Settings (.env)

## Project Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management endpoints
│   │   ├── vehicles/      # Vehicle endpoints (placeholder)
│   │   ├── entries/       # Entry log endpoints (placeholder)
│   │   ├── exits/         # Exit log endpoints (placeholder)
│   │   ├── logs/          # Activity logs (placeholder)
│   │   ├── dashboard/     # Dashboard data (placeholder)
│   │   └── health/        # Health check endpoint
│   ├── config/            # Pydantic Settings configuration
│   ├── core/              # Core application logic
│   ├── database/          # MongoDB connection & initialization
│   ├── middleware/         # CORS, rate limiting, security headers
│   ├── models/            # Beanie ODM documents
│   ├── repositories/      # Data access layer (repository pattern)
│   ├── schemas/           # Pydantic request/response schemas
│   ├── services/          # Business logic layer
│   ├── security/          # JWT, password hashing, dependencies
│   └── utils/             # Logging, helpers
├── tests/                 # Test suite
├── logs/                  # Application logs
├── uploads/               # File uploads
├── requirements.txt
├── .env.example
└── run.py
```

## Installation

### Prerequisites

- Python 3.12+
- MongoDB running locally or remotely

### Setup

```bash
# Clone the repository
git clone <repo-url> && cd gatevision-backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

## Running Locally

```bash
python run.py
```

The server starts at `http://localhost:8000`.

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Available Endpoints

| Method | Path               | Description        | Auth Required |
|--------|-------------------|--------------------|---------------|
| GET    | /health           | Health check       | No            |
| POST   | /api/v1/auth/register | Register user  | No            |
| POST   | /api/v1/auth/login    | Login           | No            |
| GET    | /api/v1/auth/me       | Current user    | Yes           |
| GET    | /api/v1/users         | List users      | Admin         |
| GET    | /api/v1/users/{id}    | Get user        | Admin         |
| PUT    | /api/v1/users/{id}    | Update user     | Admin         |
| DELETE | /api/v1/users/{id}    | Delete user     | Admin         |

## Environment Variables

Key variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017 |
| DATABASE_NAME | Database name | gatevision |
| JWT_SECRET_KEY | JWT signing key | (required) |
| JWT_ACCESS_TOKEN_EXPIRE_MINUTES | Token expiry | 60 |
| LOG_LEVEL | Logging level | INFO |

## Response Format

All endpoints return:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## Development

```bash
# Run tests
pytest

# Run with reload
python run.py
```
