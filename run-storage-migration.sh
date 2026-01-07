#!/bin/bash
# Migration script for storage-service
# Runs Alembic migrations inside the postgres container to avoid Windows networking issues

set -e  # Exit on error

# Configuration
PROJECT_ROOT="/c/Local Disk E/peakano"
CONTAINER_NAME="medical-imaging-postgres"
SERVICE_NAME="storage-service"
DATABASE_URL="postgresql+asyncpg://admin:admin123@localhost:5432/storage_db"

echo "========================================="
echo "Storage Service Migration Script"
echo "========================================="
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container '${CONTAINER_NAME}' is not running!"
    echo "Please start the container with: docker-compose up -d"
    exit 1
fi

echo "✓ Container '${CONTAINER_NAME}' is running"
echo ""

# Navigate to project root
echo "Navigating to project root: ${PROJECT_ROOT}"
cd "${PROJECT_ROOT}"
echo ""

# Copy shared directory
echo "Copying shared directory to container..."
if docker cp shared "${CONTAINER_NAME}:/tmp/"; then
    echo "✓ Shared directory copied successfully"
else
    echo "ERROR: Failed to copy shared directory"
    exit 1
fi
echo ""

# Copy storage-service directory
echo "Copying ${SERVICE_NAME} directory to container..."
if docker cp "services/${SERVICE_NAME}" "${CONTAINER_NAME}:/tmp/"; then
    echo "✓ ${SERVICE_NAME} directory copied successfully"
else
    echo "ERROR: Failed to copy ${SERVICE_NAME} directory"
    exit 1
fi
echo ""

# Run migration
echo "Running Alembic migration inside container..."
echo "Command: cd /tmp/${SERVICE_NAME} && PYTHONPATH=/tmp DATABASE_URL='${DATABASE_URL}' alembic upgrade head"
echo ""

if docker exec "${CONTAINER_NAME}" sh -c "cd /tmp/${SERVICE_NAME} && PYTHONPATH=/tmp DATABASE_URL='${DATABASE_URL}' alembic upgrade head"; then
    echo ""
    echo "========================================="
    echo "✓ Migration completed successfully!"
    echo "========================================="
else
    echo ""
    echo "========================================="
    echo "ERROR: Migration failed!"
    echo "========================================="
    exit 1
fi

# Cleanup (optional - uncomment if you want to clean up after migration)
# echo ""
# echo "Cleaning up temporary files in container..."
# docker exec "${CONTAINER_NAME}" sh -c "rm -rf /tmp/shared /tmp/${SERVICE_NAME}"
# echo "✓ Cleanup completed"
