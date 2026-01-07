# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Medical Imaging Annotation Training Platform** built with a microservices architecture. The platform enables medical professionals to annotate medical images (DICOM), train on annotation tasks, and evaluate performance using AI-assisted tools.

## Architecture

### Microservices Structure

The system consists of 10 independent services in the `services/` directory:
- **auth-service** (port 8001): Authentication and authorization via Keycloak
- **storage-service**: File storage using MinIO (S3-compatible)
- **dicom-service**: DICOM image processing and Orthanc integration
- **annotation-service**: Medical image annotation workflows
- **evaluation-service**: Performance evaluation and metrics
- **lms-service**: Learning Management System
- **ai-service**: AI model inference and segmentation
- **notification-service**: Email and push notifications
- **metrics-service**: TimescaleDB-based metrics collection
- **websocket-service**: Real-time communication

### Shared Code Organization

The `shared/` directory contains common utilities used across all services:

- **shared/common/**: Core infrastructure clients
  - `database.py`: PostgreSQL (SQLAlchemy async) and MongoDB (Motor) managers
  - `redis_client.py`: Redis async client for caching and pub/sub
  - `rabbitmq_client.py`: RabbitMQ client with predefined exchanges, queues, and routing keys
  - `exceptions.py`: Custom exception hierarchy (AppException, UnauthorizedException, etc.)
  - `responses.py`: Standardized API response formats
  - `utils.py`: General utilities

- **shared/auth/**: Authentication utilities
  - `jwt.py`: JWT token manager with access/refresh token creation and password hashing (bcrypt)

- **shared/models/**: Database model bases
  - `base.py`: SQLAlchemy Base with TimestampMixin and SoftDeleteMixin

### Service Structure Pattern

Each service follows this structure:
```
services/<service-name>/
├── app/
│   ├── main.py              # FastAPI app with lifespan management
│   ├── config.py            # Pydantic settings with .env support
│   ├── api/v1/              # API route handlers
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── utils/               # Service-specific utilities
└── requirements.txt
```

### Infrastructure Stack

Defined in `docker-compose.yml`:
- **PostgreSQL** (port 5432): Primary database with multiple databases (auth_db, lms_db, evaluation_db, keycloak, orthanc, storage_db)
- **MongoDB** (port 27017): Document storage
- **Redis** (port 6379): Caching and session management
- **RabbitMQ** (ports 5672, 15672): Message queue with management UI
- **Keycloak** (port 8080): Identity and access management
- **MinIO** (ports 9000, 9001): S3-compatible object storage
- **Orthanc** (ports 4242, 8042): DICOM server
- **TimescaleDB** (port 5433): Time-series metrics database

## Development Commands

### Environment Setup

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies (root requirements first, then service-specific)
pip install -r requirements.txt
pip install -r services/<service-name>/requirements.txt
```

### Running Services

```bash
# Start infrastructure services
docker-compose up -d

# Run a specific service (from service directory)
cd services/auth-service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Or run from root with Python module syntax
python -m services.auth-service.app.main
```

### Code Quality

```bash
# Format code
black .

# Sort imports
isort .

# Lint code
flake8 .

# Type checking
mypy services/<service-name>
```

### Testing

```bash
# Run tests (when test files exist)
pytest

# Run tests with coverage
pytest --cov=services --cov-report=html

# Run specific service tests
pytest services/<service-name>/tests/
```

## Key Architectural Patterns

### Service Communication

Services communicate through:
1. **RabbitMQ** for async event-driven communication
   - Predefined exchanges: `annotation.exchange`, `evaluation.exchange`, `notification.exchange`, `ai.inference.exchange`, `dicom.exchange`
   - Routing keys follow pattern: `<domain>.<action>` (e.g., `annotation.created`, `ai.segment.request`)
   - See `shared/common/rabbitmq_client.py` for full list of Exchanges, RoutingKeys, and Queues

2. **Redis** for caching and real-time pub/sub
   - Session storage
   - Temporary data caching
   - Real-time notifications

### Database Access Pattern

- Each service initializes its own database connection in `main.py` lifespan
- Use `get_db()` dependency injection for PostgreSQL sessions
- Use `get_mongo_collection(collection_name)` for MongoDB access
- All models should inherit from `shared.models.base.Base` and include `TimestampMixin` for created_at/updated_at

### Configuration Management

- Each service uses Pydantic Settings with `.env` file support
- Settings class in `app/config.py` with `@lru_cache()` decorator
- Environment variables override default values
- Required settings: SERVICE_NAME, VERSION, DATABASE_URL, REDIS_URL, RABBITMQ_URL

### Authentication Flow

- JWT-based authentication via `shared/auth/jwt.py`
- Keycloak integration for SSO and user management
- Access tokens expire in 30 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Password hashing uses bcrypt with 12 rounds

### Exception Handling

- All custom exceptions inherit from `AppException` in `shared/common/exceptions.py`
- Services have global exception handlers in `main.py` that return standardized error responses
- Use specific exception types: `UnauthorizedException`, `NotFoundException`, `ValidationException`, etc.

## Service-Specific Notes

### Auth Service
- Integrates with Keycloak for user management
- Manages JWT token lifecycle
- Endpoints: `/api/v1/auth` (login, register, refresh) and `/api/v1/users`

### Storage Service
- Manages MinIO buckets: dicom, annotations, exports, ai-models, certificates, temp
- Handles file upload/download with presigned URLs
- Integrates with DICOM service for medical image storage

### DICOM Service
- Integrates with Orthanc DICOM server (port 4242)
- Processes DICOM images using pydicom, SimpleITK, and nibabel
- Publishes DICOM events to RabbitMQ

## Python Path Handling

Some services (like storage-service) add the shared directory to sys.path:
```python
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../shared')))
```

Ensure imports work correctly when adding new services by following this pattern if needed.

## Medical Imaging Libraries

This codebase works with medical imaging formats:
- **pydicom**: DICOM file reading/writing
- **SimpleITK**: Medical image processing
- **nibabel**: Neuroimaging data access (NIfTI, etc.)

When working with medical images, be aware of coordinate systems, pixel spacing, and metadata preservation requirements.
