"""
Startup script for Notification Service
Ensures proper Python path configuration for shared modules
"""
import sys
import os
from pathlib import Path

# Add project root to Python path
# .../run.py -> .../notification-service -> .../services -> .../peakano
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Now import and run the main application
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
