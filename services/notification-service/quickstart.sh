#!/bin/bash
# Quick Start Script for Notification Service

set -e

echo "=================================="
echo "Notification Service - Quick Start"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "Error: Please run this script from the notification-service directory"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r ../../../requirements.txt
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Check if Docker services are running
echo ""
echo "Checking Docker services..."
if ! docker ps | grep -q postgres; then
    echo "⚠️  PostgreSQL not running. Start with: docker-compose up -d postgres"
fi

if ! docker ps | grep -q rabbitmq; then
    echo "⚠️  RabbitMQ not running. Start with: docker-compose up -d rabbitmq"
fi

# Check if database exists
echo ""
echo "Checking database..."
DB_EXISTS=$(docker exec -i $(docker ps -qf "name=postgres") psql -U admin -tAc "SELECT 1 FROM pg_database WHERE datname='notification_db'" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo "Creating notification_db database..."
    docker exec -i $(docker ps -qf "name=postgres") psql -U admin -c "CREATE DATABASE notification_db;"
    echo "✓ Database created"
else
    echo "✓ Database exists"
fi

# Run migrations
echo ""
echo "Running database migrations..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head
    echo "✓ Migrations complete"
else
    echo "⚠️  No alembic.ini found. Skipping migrations."
fi

# Final instructions
echo ""
echo "Notification Service is ready!"
echo ""
echo "⚠️  IMPORTANT: Configure your notification providers in .env:"
echo "  - Email: SMTP_USERNAME, SMTP_PASSWORD (or SENDGRID_API_KEY)"
echo "  - SMS: AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME"
echo "  - Push: FCM_SERVER_KEY (optional)"
echo ""
echo "To start the service, run:"
echo "  python -m app.main"
echo ""
echo "Service will be available at:"
echo "  http://localhost:8008"
echo ""
echo "API Documentation:"
echo "  http://localhost:8008/docs"
echo ""