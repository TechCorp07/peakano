"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional

from shared.common.database import get_db
from shared.common.redis_client import get_redis
from shared.common.responses import success_response
from shared.common.exceptions import InvalidCredentialsException, UnauthorizedException
from shared.auth.jwt import get_jwt_manager
from app.services.keycloak_client import get_keycloak
from app.config import settings

router = APIRouter()


# Schemas
class LoginRequest(BaseModel):
    """Login request schema"""
    username: str
    password: str


class RegisterRequest(BaseModel):
    """Registration request schema"""
    email: EmailStr
    username: str
    password: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with username and password
    Uses Keycloak if enabled, otherwise local authentication
    """
    if settings.KEYCLOAK_ENABLED:
        # Authenticate with Keycloak
        keycloak = get_keycloak()
        token_data = await keycloak.authenticate(
            login_data.username,
            login_data.password
        )
        
        if not token_data:
            raise InvalidCredentialsException()
        
        return TokenResponse(
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            expires_in=token_data["expires_in"]
        )
    else:
        # Local authentication (fallback)
        # TODO: Implement local user authentication
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Local authentication not yet implemented"
        )


@router.post("/register")
async def register(
    register_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user
    Creates user in Keycloak if enabled
    """
    if settings.KEYCLOAK_ENABLED:
        # Register in Keycloak
        keycloak = get_keycloak()
        
        # Check if user already exists
        existing_user = await keycloak.get_user_by_email(register_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        existing_username = await keycloak.get_user_by_username(register_data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
        
        # Create user in Keycloak
        keycloak_id = await keycloak.create_user(
            email=register_data.email,
            username=register_data.username,
            password=register_data.password,
            first_name=register_data.first_name,
            last_name=register_data.last_name,
            role="annotator"
        )
        
        if not keycloak_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user in Keycloak"
            )
        
        # TODO: Create user record in local database
        
        return success_response(
            data={"keycloak_id": keycloak_id},
            message="User registered successfully"
        )
    else:
        # Local registration
        # TODO: Implement local user registration
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Local registration not yet implemented"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest
):
    """
    Refresh access token using refresh token
    """
    if settings.KEYCLOAK_ENABLED:
        keycloak = get_keycloak()
        token_data = await keycloak.refresh_token(refresh_data.refresh_token)
        
        if not token_data:
            raise UnauthorizedException("Invalid or expired refresh token")
        
        return TokenResponse(
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            expires_in=token_data["expires_in"]
        )
    else:
        # Local token refresh
        jwt_manager = get_jwt_manager()
        payload = jwt_manager.verify_token(refresh_data.refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")
        
        # Create new access token
        new_access_token = jwt_manager.create_access_token(
            data={"sub": payload["sub"], "role": payload.get("role")}
        )
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=refresh_data.refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )


@router.post("/logout")
async def logout(
    refresh_data: RefreshTokenRequest,
    redis = Depends(get_redis)
):
    """
    Logout user (revoke tokens)
    """
    if settings.KEYCLOAK_ENABLED:
        keycloak = get_keycloak()
        success = await keycloak.logout(refresh_data.refresh_token)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to logout"
            )
    
    # Blacklist the refresh token in Redis
    await redis.set(
        f"blacklist:{refresh_data.refresh_token}",
        "1",
        expiration=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return success_response(message="Logged out successfully")


@router.get("/me")
async def get_current_user(
    # TODO: Add authentication dependency
):
    """
    Get current authenticated user
    """
    # TODO: Implement user retrieval from token
    return success_response(
        data={"message": "User endpoint - requires authentication"}
    )


@router.post("/forgot-password")
async def forgot_password(email: EmailStr):
    """
    Request password reset
    """
    # TODO: Implement password reset logic
    return success_response(
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str
):
    """
    Reset password with token
    """
    # TODO: Implement password reset logic
    return success_response(
        message="Password reset successfully"
    )

