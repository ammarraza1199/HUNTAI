import logging
from datetime import datetime
from backend.utils.mongodb import get_db
from backend.utils.otp_generator import generate_otp, get_otp_expiry
from backend.utils.security import hash_otp
from backend.utils.email_service import EmailService

logger = logging.getLogger(__name__)

class OTPService:
    @staticmethod
    async def process_otp_request(email: str) -> None:
        db = await get_db()
        users_collection = db["users"]
        
        # 1. Generate new OTP and Expiry
        plain_otp = generate_otp()
        hashed_otp = hash_otp(plain_otp)
        expiry = get_otp_expiry()

        # 2. Upsert user in DB
        now = datetime.utcnow()
        await users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "otp": hashed_otp,
                    "otp_expiry": expiry,
                    "updated_at": now
                },
                "$setOnInsert": {
                    "email": email,
                    "is_verified": False,
                    "created_at": now
                }
            },
            upsert=True
        )

        # 3. Send email asynchronously (this logic is synchronous inside EmailService right now, handled fast)
        EmailService.send_otp_email(email, plain_otp)
