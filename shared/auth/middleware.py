"""
Authentication Middleware
Protects all service endpoints with JWT validation
"""
import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer
from starlette.responses import JSONResponse
from starlette.requests import Request as StarletteRequest
from starlette.types import ASGIApp, Scope, Receive, Send
from jose import jwt, JWTError
import httpx
import traceback

logger = logging.getLogger(__name__)

security = HTTPBearer()


class AuthMiddleware:
    """JWT Authentication Middleware (Pure ASGI)"""
    
    def __init__(
        self,
        app: ASGIApp,
        **kwargs
    ):
        self.app = app
        self.auth_service_url = kwargs.get('auth_service_url', "").rstrip('/')
        self.secret_key = kwargs.get('secret_key')
        self.algorithm = kwargs.get('algorithm', "HS256")
        self.exclude_paths = kwargs.get('exclude_paths') or [
            "/health", "/docs", "/redoc", "/openapi.json"
        ]
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] not in ["http", "websocket"]:
            await self.app(scope, receive, send)
            return

        try:
            # Create request object to easily access headers and url
            request = StarletteRequest(scope, receive)
            path = request.url.path

            # Skip authentication for excluded paths
            # Check both immediate path and /api/v1/ prefix
            if any(path.startswith(p) for p in self.exclude_paths) or \
               any(path.startswith(f"/api/v1{p}") for p in self.exclude_paths) or \
               path == "/" or path.startswith("/assets"):
                await self.app(scope, receive, send)
                return
            
            # Extract token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                response = JSONResponse(
                    {"detail": "Missing authorization header"},
                    status_code=401
                )
                await response(scope, receive, send)
                return
            
            # Extract Bearer token
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != "bearer":
                response = JSONResponse(
                    {"detail": "Invalid authentication scheme"},
                    status_code=401
                )
                await response(scope, receive, send)
                return
            
            token = parts[1]
            
            try:
                # Verify token locally (fast path)
                payload = jwt.decode(
                    token,
                    self.secret_key,
                    algorithms=[self.algorithm]
                )
                
                # Add user info to scope state
                if "state" not in scope:
                    scope["state"] = {}
                
                scope["state"]["user_id"] = payload.get("sub")
                scope["state"]["user_role"] = payload.get("role")
                scope["state"]["user_email"] = payload.get("email")
                
                # Continue processing request
                await self.app(scope, receive, send)
                return
                
            except JWTError as e:
                logger.error(f"JWT validation error: {e}")
                response = JSONResponse(
                    {"detail": "Invalid or expired token"},
                    status_code=401
                )
                await response(scope, receive, send)
                return
                
        except Exception as e:
            logger.error(f"Middleware error: {e}")
            traceback.print_exc()
            response = JSONResponse(
                {"detail": f"Internal Middleware Error: {str(e)}"},
                status_code=500
            )
            await response(scope, receive, send)
            return
                
        except Exception as e:
            logger.error(f"Middleware error: {e}")
            traceback.print_exc()
            response = JSONResponse(
                {"detail": f"Internal Middleware Error: {str(e)}"},
                status_code=500
            )
            await response(scope, receive, send)
            return
    
    async def verify_with_auth_service(self, token: str) -> Optional[dict]:
        """Verify token with Auth Service (fallback)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.auth_service_url}/api/v1/auth/verify",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Auth service verification failed: {e}")
            return None


def get_current_user(request: Request) -> dict:
    """Dependency to get current user from request state"""
    if not hasattr(request.state, "user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    return {
        "user_id": request.state.user_id,
        "role": request.state.user_role,
        "email": request.state.user_email
    }


def require_role(required_role: str):
    """Dependency to check user role"""
    def role_checker(request: Request):
        user = get_current_user(request)
        if user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {required_role}"
            )
        return user
    return role_checker
