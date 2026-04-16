from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from datetime import datetime

from backend.models.user_model import OTPRequest, OTPVerifyRequest, GoogleLoginRequest
from backend.auth.otp_service import OTPService
from backend.auth.google_oauth import verify_google_token
from backend.auth.jwt_handler import create_access_token
from backend.utils.mongodb import get_db
from backend.utils.security import verify_otp_hash

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """Generates an OTP and sends it via email."""
    try:
        await OTPService.process_otp_request(request.email)
        return {"message": "OTP sent successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    """Verifies the email OTP and returns a JWT."""
    db = await get_db()
    users_collection = db["users"]
    
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if not user.get("otp") or not user.get("otp_expiry"):
        raise HTTPException(status_code=400, detail="OTP not requested or already used.")
    
    # Check expiry
    if datetime.utcnow() > user["otp_expiry"]:
        raise HTTPException(status_code=400, detail="OTP has expired.")
    
    # Check match
    if not verify_otp_hash(request.otp, user["otp"]):
        raise HTTPException(status_code=401, detail="Invalid OTP.")

    # Mark as verified and clear OTP
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}, "$unset": {"otp": "", "otp_expiry": ""}}
    )

    # Generate token
    token = create_access_token({"sub": str(user["_id"]), "email": user["email"]})
    return {"access_token": token, "token_type": "bearer", "user": {"email": user["email"], "id": str(user["_id"])}}

@router.post("/google-login")
async def google_login(request: GoogleLoginRequest):
    """Verifies a Google OAuth token and logs the user in."""
    id_info = verify_google_token(request.token)
    email = id_info.get("email")
    google_id = id_info.get("sub")
    name = id_info.get("name", "")
    picture = id_info.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google token missing email.")

    db = await get_db()
    users_collection = db["users"]
    
    # Upsert user
    now = datetime.utcnow()
    result = await users_collection.find_one_and_update(
        {"email": email},
        {
            "$set": {
                "google_id": google_id,
                "is_verified": True,
                "full_name": name,
                "picture": picture,
                "updated_at": now
            },
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True,
        return_document=True
    )
    
    # Fetch again to get the inserted document and its ID (sometimes find_one_and_update with return_document returns after, but just in case)
    if not result:
        result = await users_collection.find_one({"email": email})

    token = create_access_token({"sub": str(result["_id"]), "email": email})
    return {"access_token": token, "token_type": "bearer", "user": {"email": email, "id": str(result["_id"]), "name": name, "picture": picture}}

@router.post("/logout")
async def logout():
    """Informs the server that the user is logging out. Client-side should clear JWT."""
    return {"message": "Successfully logged out. Please clear your local tokens."}
