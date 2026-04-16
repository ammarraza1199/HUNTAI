# backend/utils/auth.py
# HuntAI - AI Job Hunter Agent
# JWT Authentication Middleware / Dependency

from fastapi import HTTPException, Depends, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from backend.auth.jwt_handler import verify_token

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    token: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Validates the local JWT. Supports Bearer header OR token query parameter for SSE.
    """
    # 1. Get token from header or query string (aggressive check)
    final_token = None
    if credentials:
        final_token = credentials.credentials
    if not final_token:
        # Check query params directly from request if standard injection is shadowed
        final_token = request.query_params.get("token") or token

    if not final_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # 2. Decode and validate
        payload = verify_token(final_token)
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing sub.")
            
        return {
            "id": user_id,
            "email": email,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
