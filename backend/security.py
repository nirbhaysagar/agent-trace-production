"""
Security utilities for AgentTrace API
"""
import os
import re
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token scheme
security = HTTPBearer()

class SecurityConfig:
    """Security configuration and utilities"""
    
    # Rate limiting configuration
    RATE_LIMIT_REQUESTS = 100  # requests per window
    RATE_LIMIT_WINDOW = 3600   # seconds (1 hour)
    
    # File upload limits
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_TRACE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # Content validation
    ALLOWED_FILE_TYPES = [".json"]
    MAX_STEPS_PER_TRACE = 1000
    MAX_STEP_CONTENT_LENGTH = 50000  # characters
    
    # Sensitive data patterns to filter
    SENSITIVE_PATTERNS = [
        r'(?i)(api[_-]?key|apikey)["\s]*[:=]["\s]*([^"\s,}]+)',
        r'(?i)(password|passwd|pwd)["\s]*[:=]["\s]*([^"\s,}]+)',
        r'(?i)(secret|token)["\s]*[:=]["\s]*([^"\s,}]+)',
        r'(?i)(auth[_-]?token|bearer)["\s]*[:=]["\s]*([^"\s,}]+)',
        r'(?i)(private[_-]?key|privkey)["\s]*[:=]["\s]*([^"\s,}]+)',
    ]

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def sanitize_trace_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize trace data by removing sensitive information"""
    if not isinstance(data, dict):
        return data
    
    sanitized = data.copy()
    
    # Recursively sanitize nested data
    for key, value in sanitized.items():
        if isinstance(value, dict):
            sanitized[key] = sanitize_trace_data(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_trace_data(item) if isinstance(item, dict) else item for item in value]
        elif isinstance(value, str):
            sanitized[key] = sanitize_sensitive_string(value)
    
    return sanitized

def sanitize_sensitive_string(text: str) -> str:
    """Remove sensitive data from strings using regex patterns"""
    if not isinstance(text, str):
        return text
    
    sanitized_text = text
    
    for pattern in SecurityConfig.SENSITIVE_PATTERNS:
        sanitized_text = re.sub(pattern, r'\1: [REDACTED]', sanitized_text)
    
    return sanitized_text

def validate_trace_size(data: Dict[str, Any]) -> bool:
    """Validate trace data size limits"""
    try:
        # Check JSON size
        json_str = str(data)
        if len(json_str.encode('utf-8')) > SecurityConfig.MAX_TRACE_SIZE:
            return False
        
        # Check step count
        if 'steps' in data and len(data['steps']) > SecurityConfig.MAX_STEPS_PER_TRACE:
            return False
        
        # Check individual step content length
        if 'steps' in data:
            for step in data['steps']:
                if isinstance(step, dict) and 'content' in step:
                    if len(str(step['content'])) > SecurityConfig.MAX_STEP_CONTENT_LENGTH:
                        return False
        
        return True
    except Exception as e:
        logger.error(f"Error validating trace size: {e}")
        return False

def validate_file_type(filename: str) -> bool:
    """Validate uploaded file type"""
    if not filename:
        return False
    
    file_ext = os.path.splitext(filename)[1].lower()
    return file_ext in SecurityConfig.ALLOWED_FILE_TYPES

def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    # Check for forwarded headers (proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    return request.client.host if request.client else "unknown"

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, client_ip: str) -> bool:
        """Check if request is allowed based on rate limit"""
        now = datetime.now()
        window_start = now - timedelta(seconds=SecurityConfig.RATE_LIMIT_WINDOW)
        
        # Clean old entries
        if client_ip in self.requests:
            self.requests[client_ip] = [
                req_time for req_time in self.requests[client_ip] 
                if req_time > window_start
            ]
        else:
            self.requests[client_ip] = []
        
        # Check if under limit
        if len(self.requests[client_ip]) >= SecurityConfig.RATE_LIMIT_REQUESTS:
            return False
        
        # Add current request
        self.requests[client_ip].append(now)
        return True

# Global rate limiter instance
rate_limiter = RateLimiter()

def check_rate_limit(request: Request):
    """Check rate limit for request"""
    client_ip = get_client_ip(request)
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429, 
            detail="Rate limit exceeded. Please try again later."
        )

def validate_json_structure(data: Dict[str, Any]) -> bool:
    """Validate basic JSON structure for trace data"""
    try:
        # Check required fields
        if not isinstance(data, dict):
            return False
        
        # Check if it looks like trace data
        if 'steps' not in data and 'trace' not in data and 'log' not in data:
            return False
        
        return True
    except Exception:
        return False

def generate_secure_filename(original_filename: str) -> str:
    """Generate secure filename for uploaded files"""
    # Remove path components and special characters
    filename = os.path.basename(original_filename)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Add timestamp and random component
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    random_suffix = secrets.token_hex(4)
    
    name, ext = os.path.splitext(filename)
    return f"{name}_{timestamp}_{random_suffix}{ext}"

# Security middleware dependencies
def require_auth(username: str = Depends(verify_token)):
    """Dependency for authenticated endpoints"""
    return username

def require_rate_limit(request: Request):
    """Dependency for rate limiting"""
    check_rate_limit(request)
    return True
