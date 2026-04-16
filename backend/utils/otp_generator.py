import random
import string
from datetime import datetime, timedelta

def generate_otp(length: int = 6) -> str:
    """Generate a 6-digit numeric OTP."""
    digits = string.digits
    return ''.join(random.choice(digits) for _ in range(length))

def get_otp_expiry(minutes: int = 5) -> datetime:
    """Get the expiration time for the OTP."""
    return datetime.utcnow() + timedelta(minutes=minutes)
