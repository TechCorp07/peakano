#!/bin/bash

# Metrics Service Quickstart Script
set -e

echo "========================================="
echo "Metrics Service Setup"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0;0m' # No Color

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
fi

# Install Python dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Create database (using TimescaleDB container)
echo -e "${GREEN}Creating TimescaleDB database...${NC}"
docker exec -i medical-imaging-timescaledb psql -U admin -c "CREATE DATABASE metrics_db;" 2>/dev/null || echo "Database may already exist"

# Install TimescaleDB extension
echo -e "${GREEN}Installing TimescaleDB extension...${NC}"
docker exec -i medical-imaging-timescaledb psql -U admin -d metrics_db -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;" 2>/dev/null || echo "Extension may already exist"

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
alembic upgrade head

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "To start the service, run:"
echo "  python -m app.main"
echo ""
echo "Or with uvicorn:"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8011 --reload"
echo ""
echo "API documentation will be available at:"
echo "  http://localhost:8011/docs"
echo ""
echo "TimescaleDB Features:"
echo "  - Time-series optimization enabled"
echo "  - Auto-retention policies (30 days for raw data)"
echo "  - Hypertables for system_metrics and user_activity"