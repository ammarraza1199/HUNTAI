import hashlib

def hash_otp(otp: str) -> str:
    """Hashes the OTP using SHA-256."""
    return hashlib.sha256(otp.encode('utf-8')).hexdigest()

def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    """Verifies the plain OTP against the hashed OTP."""
    return hash_otp(plain_otp) == hashed_otp
