#!/bin/bash

# Quick Start Script for Medical Imaging Backend
# This script sets up the development environment

set -e

echo "=================================================="
echo "Medical Imaging Backend - Quick Start"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3.11+ is required${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is required${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is required${NC}"
    exit 1
fi

echo -e "${GREEN}âœ" All prerequisites installed${NC}"
echo ""

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

echo -e "${GREEN}âœ" Virtual environment created${NC}"
echo ""

# Install shared dependencies
echo "Installing shared dependencies..."
pip install -r requirements.txt

echo -e "${GREEN}âœ" Shared dependencies installed${NC}"
echo ""

# Install auth service dependencies
echo "Installing Auth Service dependencies..."
cd services/auth-service
pip install -r requirements.txt
cd ../..

echo -e "${GREEN}âœ" Auth Service dependencies installed${NC}"
echo ""

# Start infrastructure services
echo "Starting infrastructure services with Docker Compose..."
docker-compose up -d

echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo "Checking service health..."

# PostgreSQL
if docker exec medical-imaging-postgres pg_isready -U admin > /dev/null 2>&1; then
    echo -e "${GREEN}âœ" PostgreSQL is ready${NC}"
else
    echo -e "${RED}âœ— PostgreSQL is not ready${NC}"
fi

# Redis
if docker exec medical-imaging-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}âœ" Redis is ready${NC}"
else
    echo -e "${RED}âœ— Redis is not ready${NC}"
fi

# RabbitMQ
if docker exec medical-imaging-rabbitmq rabbitmqctl status > /dev/null 2>&1; then
    echo -e "${GREEN}âœ" RabbitMQ is ready${NC}"
else
    echo -e "${RED}âœ— RabbitMQ is not ready${NC}"
fi

echo ""
echo "=================================================="
echo "Setup Complete!"
echo "=================================================="
echo ""
echo "Infrastructure services are running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - MongoDB: localhost:27017"
echo "  - Redis: localhost:6379"
echo "  - RabbitMQ: localhost:5672 (Management UI: http://localhost:15672)"
echo "  - Keycloak: http://localhost:8080 (admin/admin)"
echo "  - MinIO: http://localhost:9001 (admin/admin123456)"
echo ""
echo "To start the Auth Service:"
echo "  cd services/auth-service"
echo "  python -m app.main"
echo ""
echo "API Documentation will be available at:"
echo "  http://localhost:8001/docs"
echo ""
echo "To stop infrastructure services:"
echo "  docker-compose down"
echo ""
echo "=================================================="