#!/bin/bash
# Quick Start Script for WebSocket Service

set -e

echo "=================================="
echo "WebSocket Service - Quick Start"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "Error: Please run this script from the websocket-service directory"
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
if ! docker ps | grep -q redis; then
    echo "⚠️  Redis not running. Start with: docker-compose up -d redis"
fi

# Final instructions
echo ""
echo "WebSocket Service is ready!"
echo ""
echo "To start the service, run:"
echo "  python -m app.main"
echo ""
echo "Service will be available at:"
echo "  HTTP: http://localhost:8010"
echo "  WebSocket: ws://localhost:8010/ws"
echo ""
echo "API Documentation:"
echo "  http://localhost:8010/docs"
echo ""
echo "Test WebSocket connection:"
echo "  ws://localhost:8010/ws?user_id=test-user"
echo ""