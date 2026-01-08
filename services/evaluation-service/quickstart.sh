#!/bin/bash

# Evaluation Service Quickstart Script
set -e

echo "========================================="
echo "Evaluation Service Setup"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
fi

# Install Python dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Create database
echo -e "${GREEN}Creating database...${NC}"
docker exec -i postgres psql -U admin -c "CREATE DATABASE evaluation_db;" 2>/dev/null || echo "Database may already exist"

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
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8007 --reload"
echo ""
echo "API documentation will be available at:"
echo "  http://localhost:8007/docs"