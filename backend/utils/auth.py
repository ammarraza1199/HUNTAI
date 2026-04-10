# backend/utils/auth.py
# HuntAI - AI Job Hunter Agent
# Supabase JWT Authentication Middleware / Dependency

import os
import jwt
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_supabase_jwt_secret():
    """Get the SUPABASE_JWT_SECRET from environment."""
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured on backend.")
    return secret

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Validates the Supabase JWT and returns the parsed user information.
    Used as a FastAPI dependency for protected routes.
    """
    token = credentials.credentials
    secret = get_supabase_jwt_secret()

    # DEBUG: See what algorithm the token is using
    try:
        header = jwt.get_unverified_header(token)
        print(f"DEBUG: TOKEN HEADER: {header}")
    except Exception as e:
        print(f"DEBUG: Failed to read token header: {str(e)}")
    
    try:
        # User's token is using ES256. Adding ES256 and RS256 to support modern Supabase configs.
        payload = jwt.decode(token, secret, algorithms=["HS256", "ES256", "RS256"], options={"verify_aud": False})
        
        # Payload contains 'sub' (User UUID), 'email', etc.
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing sub.")
            
        return {
            "id": user_id,
            "email": payload.get("email"),
            "full_name": payload.get("user_metadata", {}).get("full_name", "")
        }
    except jwt.ExpiredSignatureError:
        print("AUTH ERROR: Token has expired")
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidTokenError as e:
        print(f"AUTH ERROR: Invalid token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        print(f"AUTH ERROR: General Exception: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials.")
