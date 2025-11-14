from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging
import httpx
from security import (
    sanitize_trace_data,
    validate_trace_size,
    validate_file_type,
    validate_json_structure,
    generate_secure_filename,
    require_rate_limit,
    SecurityConfig,
)
from ai_service import get_ai_service
from subscription_service import get_subscription_service
from stripe_service import get_stripe_service

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AgentTrace API",
    description="API for debugging AI agent execution traces",
    version="1.0.0"
)

# CORS middleware - Configure for production
# In production, ALLOWED_ORIGINS should be set explicitly
# For development, allow localhost
default_origins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", default_origins)
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Log CORS configuration (without sensitive data)
if os.getenv("DEBUG", "False").lower() == "true":
    logger.info(f"CORS allowed origins: {len(allowed_origins)} origin(s) configured")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
# Prefer service role key when available so backend can insert/select without RLS hurdles
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
selected_supabase_key = supabase_service_role_key or supabase_anon_key
supabase: Optional[Client] = None
in_memory_traces: Dict[str, Dict[str, Any]] = {}

# Validate Supabase credentials are real (not placeholders)
def is_valid_supabase_url(url: Optional[str]) -> bool:
    """Check if URL is a valid Supabase URL (not a placeholder)"""
    if not url:
        return False
    # Check if it's a placeholder
    if "your_supabase" in url.lower() or "here" in url.lower():
        return False
    # Check if it's a valid URL format
    return url.startswith("http://") or url.startswith("https://")

def is_valid_supabase_key(key: Optional[str]) -> bool:
    """Check if key is a valid Supabase key (not a placeholder)"""
    if not key:
        return False
    # Check if it's a placeholder
    if "your_" in key.lower() or "here" in key.lower():
        return False
    # Valid Supabase keys are typically long strings
    return len(key) > 20

if is_valid_supabase_url(supabase_url) and is_valid_supabase_key(selected_supabase_key):
    try:
        supabase = create_client(supabase_url, selected_supabase_key)
        logger.info("Supabase client initialized using %s key", "service role" if supabase_service_role_key else "anon")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        logger.warning("Continuing without database - using in-memory storage")
        supabase = None
elif supabase_url and not selected_supabase_key:
    logger.warning("Supabase URL set but no API key found. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.")
elif supabase_url or selected_supabase_key:
    logger.warning("Supabase credentials appear to be placeholders. Running without database - using in-memory storage.")
else:
    logger.warning("Supabase credentials not found, running without database - using in-memory storage")

# Pydantic Models
class AgentStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    step_type: str = Field(..., description="Type of step: thought, action, observation, error")
    timestamp: datetime = Field(default_factory=datetime.now)
    content: str = Field(..., description="The main content of the step")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    duration_ms: Optional[int] = Field(None, description="Duration in milliseconds")
    tokens_used: Optional[int] = Field(None, description="Number of tokens used")
    error: Optional[str] = Field(None, description="Error message if applicable")
    inputs: Optional[Dict[str, Any]] = Field(default_factory=dict)
    outputs: Optional[Dict[str, Any]] = Field(default_factory=dict)

class AgentTrace(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = Field(None, description="Name of the trace")
    description: Optional[str] = Field(None, description="Description of the trace")
    created_at: datetime = Field(default_factory=datetime.now)
    steps: List[AgentStep] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    total_duration_ms: Optional[int] = Field(None, description="Total duration in milliseconds")
    total_tokens: Optional[int] = Field(None, description="Total tokens used")
    error_count: int = Field(default=0, description="Number of error steps")
    user_id: Optional[str] = Field(None, description="ID of the user who owns this trace")
    is_public: bool = Field(default=False, description="Whether the trace is publicly viewable")

class TraceUploadRequest(BaseModel):
    trace_data: Union[Dict[str, Any], List[Dict[str, Any]]]
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = False

class TraceResponse(BaseModel):
    id: str
    name: Optional[str]
    description: Optional[str]
    created_at: datetime
    steps: List[AgentStep]
    metadata: Dict[str, Any]
    total_duration_ms: Optional[int]
    total_tokens: Optional[int]
    error_count: int
    shareable_url: str
    user_id: Optional[str]
    is_public: bool

class SavedFilterRequest(BaseModel):
    name: str
    filters: Dict[str, Any]

class SavedFilterResponse(BaseModel):
    id: str
    name: str
    filters: Dict[str, Any]
    created_at: datetime

class VisibilityUpdateRequest(BaseModel):
    is_public: bool

class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    summary: str
    root_cause: str
    suggested_fix: str
    confidence: Optional[float] = None
    cached: bool = False
    model_used: str
    created_at: str

class AIAnalysisRequest(BaseModel):
    force_refresh: Optional[bool] = False

class QuickErrorAnalysisRequest(BaseModel):
    error_message: str = Field(..., description="The error message to analyze")
    context: Optional[str] = Field(None, description="Optional context about the error (e.g., what the agent was trying to do)")

class AIStatusResponse(BaseModel):
    enabled: bool
    model: Optional[str] = None
    configured: bool

class SubscriptionResponse(BaseModel):
    plan_type: str
    status: str
    current_period_end: Optional[str] = None
    cancel_at_period_end: bool = False

class UsageStatsResponse(BaseModel):
    trace_count: int
    trace_limit: int
    reset_date: Optional[str] = None

class CheckoutRequest(BaseModel):
    plan_type: str = Field(..., description="Plan type: pro or team")
    billing_interval: Optional[str] = Field(default="month", description="Billing interval: month, year, or lifetime")


def get_current_user(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = authorization.split(" ", 1)[1]
    if not supabase_url or not supabase_anon_key:
        raise HTTPException(status_code=503, detail="Authentication not configured")
    
    try:
        # Use Supabase REST API to verify the token via direct HTTP call
        with httpx.Client(timeout=5.0) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "apikey": supabase_anon_key,
            }
            response = client.get(
                f"{supabase_url}/auth/v1/user",
                headers=headers
            )
            if response.status_code == 200:
                user_data = response.json()
                return AuthenticatedUser(
                    id=user_data.get("id"),
                    email=user_data.get("email")
                )
            else:
                logger.error(f"Supabase auth returned status {response.status_code}: {response.text}")
                raise HTTPException(status_code=401, detail="Invalid authentication token")
    except httpx.HTTPError as exc:
        logger.error(f"HTTP error verifying Supabase token: {exc}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as exc:
        logger.error(f"Failed to verify Supabase token: {exc}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[AuthenticatedUser]:
    """Get current user if authenticated, otherwise return None for guest mode"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    if not supabase_url or not supabase_anon_key:
        return None
    try:
        # Use Supabase REST API to verify the token via direct HTTP call
        with httpx.Client(timeout=5.0) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "apikey": supabase_anon_key,
            }
            response = client.get(
                f"{supabase_url}/auth/v1/user",
                headers=headers
            )
            if response.status_code == 200:
                user_data = response.json()
                return AuthenticatedUser(
                    id=user_data.get("id"),
                    email=user_data.get("email")
                )
    except Exception:
        # Silently fail for guest mode
        pass
    return None

# Utility functions
def parse_timestamp(value: Any) -> datetime:
    """Parse timestamp value into datetime."""
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)):
        # assume unix timestamp seconds
        try:
            return datetime.fromtimestamp(value)
        except Exception:
            return datetime.now()
    if isinstance(value, str):
        for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(value)
        except Exception:
            return datetime.now()
    return datetime.now()


def parse_agent_log(log_data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> AgentTrace:
    """Parse raw log data into structured AgentTrace format"""
    steps = []
    total_duration = 0
    total_tokens = 0
    error_count = 0
    
    # Handle different log formats
    if isinstance(log_data, dict):
        # Single trace object
        raw_steps = log_data.get("steps", [log_data])
    elif isinstance(log_data, list):
        # List of steps
        raw_steps = log_data
    else:
        raise ValueError("Invalid log format")
    
    for i, step_data in enumerate(raw_steps):
        # Extract step information
        step_type = step_data.get("type", step_data.get("step_type", "unknown"))
        content = step_data.get("content", step_data.get("message", str(step_data)))
        
        # Extract metadata
        metadata = step_data.get("metadata", {})
        duration = step_data.get("duration_ms", step_data.get("duration"))
        tokens = step_data.get("tokens_used", step_data.get("tokens"))
        error = step_data.get("error", step_data.get("error_message"))
        
        # Extract inputs/outputs
        inputs = step_data.get("inputs", step_data.get("input", {}))
        outputs = step_data.get("outputs", step_data.get("output", {}))
        
        # Determine timestamp
        timestamp_value = step_data.get("timestamp") or step_data.get("time")
        timestamp = parse_timestamp(timestamp_value) if timestamp_value else datetime.now()

        # Create step
        step = AgentStep(
            step_type=step_type,
            content=content,
            metadata=metadata,
            duration_ms=duration,
            tokens_used=tokens,
            error=error,
            inputs=inputs if isinstance(inputs, dict) else {"raw": inputs},
            outputs=outputs if isinstance(outputs, dict) else {"raw": outputs},
            timestamp=timestamp,
        )
        
        steps.append(step)
        
        # Update totals
        if duration:
            total_duration += duration
        if tokens:
            total_tokens += tokens
        if error:
            error_count += 1
    
    # Calculate total duration if not provided
    if not total_duration and len(steps) > 1:
        start_time = steps[0].timestamp
        end_time = steps[-1].timestamp
        total_duration = int((end_time - start_time).total_seconds() * 1000)
    
    return AgentTrace(
        steps=steps,
        total_duration_ms=total_duration,
        total_tokens=total_tokens,
        error_count=error_count,
        metadata={"parsed_at": datetime.now().isoformat(), "step_count": len(steps)},
    )


def serialize_trace(trace: AgentTrace) -> Dict[str, Any]:
    """Convert AgentTrace into JSON-serializable dict."""
    trace_dict = trace.model_dump()
    trace_dict["created_at"] = trace.created_at.isoformat()
    serialized_steps = []
    for step in trace.steps:
        step_dict = step.model_dump()
        step_dict["timestamp"] = step.timestamp.isoformat()
        serialized_steps.append(step_dict)
    trace_dict["steps"] = serialized_steps
    return trace_dict


def store_trace(trace: AgentTrace, user_id: Optional[str] = None):
    """Persist trace either in Supabase or in-memory store."""
    trace_payload = serialize_trace(trace)
    trace_payload.setdefault("shareable_url", f"/trace/{trace.id}")
    
    # Track usage if user_id provided
    if user_id and supabase:
        try:
            subscription_service = get_subscription_service(supabase)
            subscription_service.increment_usage(user_id, "trace")
        except Exception as e:
            logger.error(f"Failed to increment usage: {e}")

    if supabase:
        try:
            supabase.table("traces").insert(trace_payload).execute()
            logger.info(f"Trace saved to database: {trace.id}")
        except Exception as e:
            logger.error(f"Failed to save trace to database: {e}")
            in_memory_traces[trace.id] = trace_payload
    else:
        in_memory_traces[trace.id] = trace_payload


def get_stored_trace(trace_id: str) -> Optional[Dict[str, Any]]:
    if trace_id in in_memory_traces:
        return in_memory_traces[trace_id]

    if supabase:
        try:
            result = supabase.table("traces").select("*").eq("id", trace_id).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            logger.error(f"Error retrieving trace from database: {e}")
    return None

# API Routes
@app.get("/")
async def root():
    return {"message": "AgentTrace API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/traces/upload-guest", response_model=TraceResponse)
async def upload_trace_guest(request: TraceUploadRequest, req: Request):
    """Upload trace as guest (no authentication required, stored in-memory only)"""
    try:
        # Security: Rate limiting
        require_rate_limit(req)
        
        # Security: Validate JSON structure
        if not validate_json_structure(request.trace_data):
            raise HTTPException(status_code=400, detail="Invalid trace data structure")
        
        # Security: Validate trace size
        if not validate_trace_size(request.trace_data):
            raise HTTPException(status_code=413, detail="Trace data too large")
        
        # Security: Sanitize sensitive data
        sanitized_data = sanitize_trace_data(request.trace_data)
        
        # Parse the trace
        trace = parse_agent_log(sanitized_data)
        trace.user_id = None  # No user for guest traces
        trace.is_public = False  # Guest traces are never public
        trace.metadata = trace.metadata or {}
        trace.metadata.update({"guest": True, "session_expires": "browser_close"})
        
        # Set name and description if provided
        if request.name:
            trace.name = request.name
        if request.description:
            trace.description = request.description
        
        # Store only in-memory (not in Supabase)
        trace_payload = serialize_trace(trace)
        trace_payload.setdefault("shareable_url", f"/trace/{trace.id}")
        in_memory_traces[trace.id] = trace_payload
        logger.info(f"Guest trace saved to memory: {trace.id}")
        
        # Generate shareable URL
        shareable_url = f"/trace/{trace.id}"
        
        return TraceResponse(
            id=trace.id,
            name=trace.name,
            description=trace.description,
            created_at=trace.created_at,
            steps=trace.steps,
            metadata=trace.metadata,
            total_duration_ms=trace.total_duration_ms,
            total_tokens=trace.total_tokens,
            error_count=trace.error_count,
            shareable_url=shareable_url,
            user_id=None,
            is_public=False,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing trace: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse trace: {str(e)}")

@app.post("/api/traces/upload", response_model=TraceResponse)
async def upload_trace(request: TraceUploadRequest, req: Request, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Upload and parse an agent trace with security validation"""
    try:
        # Security: Rate limiting
        require_rate_limit(req)
        
        # Security: Validate JSON structure
        if not validate_json_structure(request.trace_data):
            raise HTTPException(status_code=400, detail="Invalid trace data structure")
        
        # Security: Validate trace size
        if not validate_trace_size(request.trace_data):
            raise HTTPException(status_code=413, detail="Trace data too large")
        
        # Security: Sanitize sensitive data
        sanitized_data = sanitize_trace_data(request.trace_data)
        
        # Parse the trace
        trace = parse_agent_log(sanitized_data)
        trace.user_id = current_user.id
        trace.is_public = bool(request.is_public)
        trace.metadata = trace.metadata or {}
        trace.metadata.update({"owner": current_user.email})
        
        # Set name and description if provided
        if request.name:
            trace.name = request.name
        if request.description:
            trace.description = request.description
        
        # Check if user can create trace (only if Supabase is configured)
        if supabase:
            try:
                subscription_service = get_subscription_service(supabase)
                can_create, error_msg = subscription_service.can_create_trace(current_user.id)
                if not can_create:
                    raise HTTPException(status_code=403, detail=error_msg)
            except Exception as e:
                logger.warning(f"Failed to check subscription limits (continuing anyway): {e}")
        
        # Save to database if available
        # Persist trace
        store_trace(trace, current_user.id)
        
        # Generate shareable URL
        shareable_url = f"/trace/{trace.id}"
        
        return TraceResponse(
            id=trace.id,
            name=trace.name,
            description=trace.description,
            created_at=trace.created_at,
            steps=trace.steps,
            metadata=trace.metadata,
            total_duration_ms=trace.total_duration_ms,
            total_tokens=trace.total_tokens,
            error_count=trace.error_count,
            shareable_url=shareable_url,
            user_id=trace.user_id,
            is_public=trace.is_public,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing trace: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse trace: {str(e)}")

@app.post("/api/traces/upload-file-guest")
async def upload_trace_file_guest(file: UploadFile = File(...), req: Request = None):
    """Upload trace from file as guest (no authentication required, stored in-memory only)"""
    try:
        # Security: Rate limiting
        if req:
            require_rate_limit(req)
        
        # Security: Validate file type
        if not validate_file_type(file.filename or ""):
            raise HTTPException(status_code=400, detail="Invalid file type. Only JSON files are allowed.")
        
        # Security: Check file size
        if file.size and file.size > SecurityConfig.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Read file content
        content = await file.read()
        
        # Security: Validate content size
        if len(content) > SecurityConfig.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File content too large")
        
        log_data = json.loads(content.decode('utf-8'))
        
        # Security: Validate JSON structure
        if not validate_json_structure(log_data):
            raise HTTPException(status_code=400, detail="Invalid trace data structure")
        
        # Security: Validate trace size
        if not validate_trace_size(log_data):
            raise HTTPException(status_code=413, detail="Trace data too large")
        
        # Security: Sanitize sensitive data
        sanitized_data = sanitize_trace_data(log_data)
        
        # Parse the trace
        trace = parse_agent_log(sanitized_data)
        trace.user_id = None  # No user for guest traces
        trace.is_public = False  # Guest traces are never public
        trace.metadata = trace.metadata or {}
        trace.metadata.update({"guest": True, "session_expires": "browser_close"})
        
        # Security: Generate secure filename
        secure_filename = generate_secure_filename(file.filename or "trace")
        trace.name = secure_filename
        
        # Store only in-memory (not in Supabase)
        trace_payload = serialize_trace(trace)
        trace_payload.setdefault("shareable_url", f"/trace/{trace.id}")
        in_memory_traces[trace.id] = trace_payload
        logger.info(f"Guest trace saved to memory: {trace.id}")
        
        # Generate shareable URL
        shareable_url = f"/trace/{trace.id}"
        
        return TraceResponse(
            id=trace.id,
            name=trace.name,
            description=trace.description,
            created_at=trace.created_at,
            steps=trace.steps,
            metadata=trace.metadata,
            total_duration_ms=trace.total_duration_ms,
            total_tokens=trace.total_tokens,
            error_count=trace.error_count,
            shareable_url=shareable_url,
            user_id=None,
            is_public=False,
        )
        
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@app.post("/api/traces/upload-file")
async def upload_trace_file(file: UploadFile = File(...), req: Request = None, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Upload trace from a JSON file with security validation"""
    try:
        # Security: Rate limiting
        if req:
            require_rate_limit(req)
        
        # Security: Validate file type
        if not validate_file_type(file.filename or ""):
            raise HTTPException(status_code=400, detail="Invalid file type. Only JSON files are allowed.")
        
        # Security: Check file size
        if file.size and file.size > SecurityConfig.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Read file content
        content = await file.read()
        
        # Security: Validate content size
        if len(content) > SecurityConfig.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File content too large")
        
        log_data = json.loads(content.decode('utf-8'))
        
        # Security: Validate JSON structure
        if not validate_json_structure(log_data):
            raise HTTPException(status_code=400, detail="Invalid trace data structure")
        
        # Security: Validate trace size
        if not validate_trace_size(log_data):
            raise HTTPException(status_code=413, detail="Trace data too large")
        
        # Security: Sanitize sensitive data
        sanitized_data = sanitize_trace_data(log_data)
        
        # Parse the trace
        trace = parse_agent_log(sanitized_data)
        trace.user_id = current_user.id
        trace.is_public = False
        trace.metadata = trace.metadata or {}
        trace.metadata.update({"owner": current_user.email})
        
        # Security: Generate secure filename
        secure_filename = generate_secure_filename(file.filename or "trace")
        trace.name = secure_filename
        
        # Check if user can create trace (only if Supabase is configured)
        if supabase:
            try:
                subscription_service = get_subscription_service(supabase)
                can_create, error_msg = subscription_service.can_create_trace(current_user.id)
                if not can_create:
                    raise HTTPException(status_code=403, detail=error_msg)
            except Exception as e:
                logger.warning(f"Failed to check subscription limits (continuing anyway): {e}")
        
        # Persist trace
        store_trace(trace, current_user.id)
        
        # Generate shareable URL
        shareable_url = f"/trace/{trace.id}"
        
        return TraceResponse(
            id=trace.id,
            name=trace.name,
            description=trace.description,
            created_at=trace.created_at,
            steps=trace.steps,
            metadata=trace.metadata,
            total_duration_ms=trace.total_duration_ms,
            total_tokens=trace.total_tokens,
            error_count=trace.error_count,
            shareable_url=shareable_url,
            user_id=trace.user_id,
            is_public=trace.is_public,
        )
        
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@app.get("/api/traces/{trace_id}", response_model=TraceResponse)
async def get_trace(trace_id: str, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """Get a specific trace by ID (supports guest mode)"""
    trace_data = get_stored_trace(trace_id)
    if not trace_data:
        raise HTTPException(status_code=404, detail="Trace not found")

    try:
        user_id = trace_data.get("user_id")
        is_public = trace_data.get("is_public", False)
        is_guest = trace_data.get("metadata", {}).get("guest", False)
        
        # Guest traces are always accessible
        if is_guest:
            # Allow access to guest traces
            pass
        # Public traces are accessible to everyone
        elif is_public:
            # Allow access to public traces
            pass
        # Private traces require authentication and ownership
        elif user_id:
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required to view this trace")
            if user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to view this trace")

        created_at = trace_data["created_at"]
        if isinstance(created_at, str):
            created_at_dt = datetime.fromisoformat(created_at)
        else:
            created_at_dt = created_at

        steps = []
        for step_data in trace_data.get("steps", []):
            timestamp = step_data.get("timestamp")
            if isinstance(timestamp, str):
                step_data["timestamp"] = datetime.fromisoformat(timestamp)
            steps.append(AgentStep(**step_data))

        shareable_url = f"/trace/{trace_id}"

        return TraceResponse(
            id=trace_data["id"],
            name=trace_data.get("name"),
            description=trace_data.get("description"),
            created_at=created_at_dt,
            steps=steps,
            metadata=trace_data.get("metadata", {}),
            total_duration_ms=trace_data.get("total_duration_ms"),
            total_tokens=trace_data.get("total_tokens"),
            error_count=trace_data.get("error_count", 0),
            shareable_url=shareable_url,
            user_id=user_id,
            is_public=is_public,
        )

    except Exception as e:
        logger.error(f"Error retrieving trace: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve trace: {str(e)}")

@app.get("/api/traces")
async def list_traces(limit: int = 50, offset: int = 0, current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """List all traces (supports guest mode)"""
    try:
        if current_user:
            # Authenticated user: show their traces
            if supabase:
                result = supabase.table("traces").select(
                    "id,name,description,created_at,total_duration_ms,total_tokens,error_count,shareable_url,is_public,user_id,metadata"
                ).eq("user_id", current_user.id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                return {
                    "traces": result.data,
                    "total": len(result.data),
                }

            # Fallback to in-memory store
            traces = [t for t in in_memory_traces.values() if t.get("user_id") == current_user.id]
            traces_sorted = sorted(
                traces,
                key=lambda t: t.get("created_at", ""),
                reverse=True,
            )
            sliced = traces_sorted[offset : offset + limit]
            return {
                "traces": sliced,
                "total": len(traces),
            }
        else:
            # Guest user: show only guest traces from in-memory store
            traces = [t for t in in_memory_traces.values() if t.get("metadata", {}).get("guest", False)]
            traces_sorted = sorted(
                traces,
                key=lambda t: t.get("created_at", ""),
                reverse=True,
            )
            sliced = traces_sorted[offset : offset + limit]
            return {
                "traces": sliced,
                "total": len(traces),
            }

    except Exception as e:
        logger.error(f"Error listing traces: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list traces: {str(e)}")

@app.get("/api/search")
async def search_traces(q: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Search traces and steps by content and errors"""
    if not q or len(q.strip()) < 2:
        return {"results": []}
    
    query_lower = q.lower().strip()
    results = []
    
    try:
        if supabase:
            # Get all user's traces
            traces_result = supabase.table("traces").select(
                "id,name,steps"
            ).eq("user_id", current_user.id).execute()
            
            for trace in traces_result.data:
                trace_id = trace.get("id")
                trace_name = trace.get("name")
                steps = trace.get("steps", [])
                
                for step in steps:
                    step_id = step.get("id", "")
                    content = step.get("content", "")
                    error = step.get("error", "")
                    
                    # Search in content and error
                    content_match = query_lower in content.lower() if content else False
                    error_match = query_lower in error.lower() if error else False
                    
                    if content_match or error_match:
                        # Create snippet from matching text
                        snippet_source = content if content_match else error
                        snippet = snippet_source[:200] + "..." if len(snippet_source) > 200 else snippet_source
                        
                        results.append({
                            "trace_id": trace_id,
                            "step_id": step_id,
                            "snippet": snippet,
                            "trace_name": trace_name
                        })
        else:
            # Fallback to in-memory store
            for trace_id, trace_data in in_memory_traces.items():
                if trace_data.get("user_id") != current_user.id:
                    continue
                
                trace_name = trace_data.get("name")
                steps = trace_data.get("steps", [])
                
                for step in steps:
                    step_id = step.get("id", "")
                    content = step.get("content", "")
                    error = step.get("error", "")
                    
                    content_match = query_lower in content.lower() if content else False
                    error_match = query_lower in error.lower() if error else False
                    
                    if content_match or error_match:
                        snippet_source = content if content_match else error
                        snippet = snippet_source[:200] + "..." if len(snippet_source) > 200 else snippet_source
                        
                        results.append({
                            "trace_id": trace_id,
                            "step_id": step_id,
                            "snippet": snippet,
                            "trace_name": trace_name
                        })
        
        return {"results": results[:50]}  # Limit to 50 results
        
    except Exception as e:
        logger.error(f"Error searching traces: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search traces: {str(e)}")

@app.get("/api/filters")
async def list_filters(current_user: AuthenticatedUser = Depends(get_current_user)):
    """List all saved filters for the current user"""
    try:
        if supabase:
            result = supabase.table("saved_filters").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
            filters = []
            for f in result.data:
                filters.append({
                    "id": str(f["id"]),
                    "name": f["name"],
                    "filters": f["filters"],
                    "created_at": f["created_at"].isoformat() if hasattr(f["created_at"], "isoformat") else str(f["created_at"])
                })
            return {"filters": filters}
        else:
            # In-memory fallback (not persisted)
            return {"filters": []}
    except Exception as e:
        logger.error(f"Error listing filters: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list filters: {str(e)}")

@app.post("/api/filters", response_model=SavedFilterResponse)
async def create_filter(request: SavedFilterRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Save a new filter preset"""
    try:
        if not request.name or not request.name.strip():
            raise HTTPException(status_code=400, detail="Filter name is required")
        
        if supabase:
            filter_data = {
                "user_id": current_user.id,
                "name": request.name.strip(),
                "filters": request.filters
            }
            result = supabase.table("saved_filters").insert(filter_data).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to save filter")
            
            saved = result.data[0]
            return SavedFilterResponse(
                id=str(saved["id"]),
                name=saved["name"],
                filters=saved["filters"],
                created_at=datetime.fromisoformat(saved["created_at"]) if isinstance(saved["created_at"], str) else saved["created_at"]
            )
        else:
            # In-memory fallback (not persisted)
            filter_id = str(uuid.uuid4())
            return SavedFilterResponse(
                id=filter_id,
                name=request.name.strip(),
                filters=request.filters,
                created_at=datetime.now()
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating filter: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create filter: {str(e)}")

@app.delete("/api/filters/{filter_id}")
async def delete_filter(filter_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Delete a saved filter"""
    try:
        if supabase:
            # Verify ownership before deleting
            check_result = supabase.table("saved_filters").select("user_id").eq("id", filter_id).execute()
            if not check_result.data:
                raise HTTPException(status_code=404, detail="Filter not found")
            
            if check_result.data[0]["user_id"] != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this filter")
            
            supabase.table("saved_filters").delete().eq("id", filter_id).execute()
            return {"message": "Filter deleted successfully"}
        else:
            # In-memory fallback
            return {"message": "Filter deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting filter: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete filter: {str(e)}")

@app.put("/api/traces/{trace_id}/visibility")
async def update_trace_visibility(trace_id: str, request: VisibilityUpdateRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Update trace public/private visibility"""
    try:
        is_public = request.is_public
        if supabase:
            # Verify ownership
            check_result = supabase.table("traces").select("user_id").eq("id", trace_id).execute()
            if not check_result.data:
                raise HTTPException(status_code=404, detail="Trace not found")
            
            if check_result.data[0]["user_id"] != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to update this trace")
            
            supabase.table("traces").update({"is_public": is_public}).eq("id", trace_id).execute()
            return {"message": "Trace visibility updated successfully", "is_public": is_public}
        else:
            # In-memory fallback
            if trace_id in in_memory_traces:
                trace_data = in_memory_traces[trace_id]
                if trace_data.get("user_id") != current_user.id:
                    raise HTTPException(status_code=403, detail="Not authorized to update this trace")
                trace_data["is_public"] = is_public
                return {"message": "Trace visibility updated successfully", "is_public": is_public}
            else:
                raise HTTPException(status_code=404, detail="Trace not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating trace visibility: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update trace visibility: {str(e)}")

@app.post("/api/traces/{trace_id}/steps/{step_id}/ai-analysis", response_model=AIAnalysisResponse)
async def request_ai_analysis(
    trace_id: str, 
    step_id: str, 
    request: AIAnalysisRequest = AIAnalysisRequest(force_refresh=False),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Request AI analysis for an error step (authentication required)"""
    try:
        # Check subscription for AI features
        subscription_service = get_subscription_service(supabase)
        if not subscription_service.check_feature_access(current_user.id, "ai_features"):
            raise HTTPException(
                status_code=403, 
                detail="AI features require a Pro or Team subscription. Upgrade to access AI-powered error analysis."
            )
        
        # Check if AI is enabled
        ai_service = get_ai_service()
        if not ai_service.is_enabled():
            raise HTTPException(status_code=503, detail="AI features are currently disabled")
        
        # Get trace
        trace_data = get_stored_trace(trace_id)
        if not trace_data:
            raise HTTPException(status_code=404, detail="Trace not found")
        
        # Verify ownership (authenticated users only)
        user_id = trace_data.get("user_id")
        if user_id and user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to analyze this trace")
        
        # Find the step
        steps = trace_data.get("steps", [])
        step = None
        for s in steps:
            if s.get("id") == step_id:
                step = s
                break
        
        if not step:
            raise HTTPException(status_code=404, detail="Step not found")
        
        # Check if step has an error
        error_message = step.get("error")
        if not error_message:
            raise HTTPException(status_code=400, detail="Step does not have an error to analyze")
        
        # Build step context
        step_context = {
            "step_type": step.get("step_type", "unknown"),
            "content": step.get("content", ""),
            "inputs": step.get("inputs", {}),
            "outputs": step.get("outputs", {}),
        }
        
        # Build trace context with previous steps
        step_index = next((i for i, s in enumerate(steps) if s.get("id") == step_id), -1)
        previous_steps = steps[max(0, step_index - 3):step_index] if step_index >= 0 else []
        
        trace_context = {
            "trace_id": trace_id,
            "previous_steps": previous_steps,
        }
        
        # Request analysis
        force_refresh = request.force_refresh if request else False
        analysis = ai_service.analyze_error(
            error_message=error_message,
            step_context=step_context,
            trace_context=trace_context,
            force_refresh=force_refresh
        )
        
        return AIAnalysisResponse(**analysis)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error requesting AI analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze error: {str(e)}")

@app.get("/api/traces/{trace_id}/steps/{step_id}/ai-analysis", response_model=AIAnalysisResponse)
async def get_ai_analysis(
    trace_id: str, 
    step_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get cached AI analysis for an error step (authentication required)"""
    try:
        # Check if AI is enabled
        ai_service = get_ai_service()
        if not ai_service.is_enabled():
            raise HTTPException(status_code=503, detail="AI features are currently disabled")
        
        # Get trace
        trace_data = get_stored_trace(trace_id)
        if not trace_data:
            raise HTTPException(status_code=404, detail="Trace not found")
        
        # Verify ownership (authenticated users only)
        user_id = trace_data.get("user_id")
        if user_id and user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this trace")
        
        # Find the step
        steps = trace_data.get("steps", [])
        step = None
        for s in steps:
            if s.get("id") == step_id:
                step = s
                break
        
        if not step:
            raise HTTPException(status_code=404, detail="Step not found")
        
        # Check if step has an error
        error_message = step.get("error")
        if not error_message:
            raise HTTPException(status_code=400, detail="Step does not have an error to analyze")
        
        # Build step context
        step_context = {
            "step_type": step.get("step_type", "unknown"),
            "content": step.get("content", ""),
            "inputs": step.get("inputs", {}),
            "outputs": step.get("outputs", {}),
        }
        
        # Build trace context
        trace_context = {
            "trace_id": trace_id,
            "previous_steps": [],
        }
        
        # Try to get cached analysis by requesting it (which will check cache first)
        try:
            analysis = ai_service.analyze_error(
                error_message=error_message,
                step_context=step_context,
                trace_context=trace_context,
                force_refresh=False
            )
            return AIAnalysisResponse(**analysis)
        except ValueError as e:
            # If no cached analysis exists, return 404
            raise HTTPException(status_code=404, detail="No cached analysis found. Use POST endpoint to generate analysis.")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting AI analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis: {str(e)}")

@app.get("/api/ai/status", response_model=AIStatusResponse)
async def get_ai_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get AI feature status (authentication required)"""
    try:
        ai_service = get_ai_service()
        return AIStatusResponse(
            enabled=ai_service.is_enabled(),
            model=ai_service._get_model() if ai_service.is_enabled() else None,
            configured=ai_service.api_key is not None
        )
    except Exception as e:
        logger.error(f"Error getting AI status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI status: {str(e)}")

@app.post("/api/ai/quick-analysis", response_model=AIAnalysisResponse)
async def quick_error_analysis(
    request: QuickErrorAnalysisRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Quick error analysis - analyze an error message without a trace (authentication required)"""
    try:
        # Check subscription for AI features
        subscription_service = get_subscription_service(supabase)
        if not subscription_service.check_feature_access(current_user.id, "ai_features"):
            raise HTTPException(
                status_code=403, 
                detail="AI features require a Pro or Team subscription. Upgrade to access AI-powered error analysis."
            )
        
        # Check if AI is enabled
        ai_service = get_ai_service()
        if not ai_service.is_enabled():
            raise HTTPException(status_code=503, detail="AI features are currently disabled")
        
        # Validate error message
        if not request.error_message or not request.error_message.strip():
            raise HTTPException(status_code=400, detail="Error message is required")
        
        # Build minimal context for quick analysis
        step_context = {
            "step_type": "error",
            "content": request.context or "Quick error analysis",
            "inputs": {},
        }
        
        trace_context = {
            "trace_id": "quick-analysis",
            "previous_steps": [],
        }
        
        # Request analysis
        analysis = ai_service.analyze_error(
            error_message=request.error_message.strip(),
            step_context=step_context,
            trace_context=trace_context,
            force_refresh=False
        )
        
        return AIAnalysisResponse(**analysis)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error in quick error analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze error: {str(e)}")

# Subscription endpoints
@app.get("/api/subscription", response_model=SubscriptionResponse)
async def get_subscription(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get user's current subscription"""
    try:
        subscription_service = get_subscription_service(supabase)
        subscription = subscription_service.get_user_subscription(current_user.id)
        
        return SubscriptionResponse(
            plan_type=subscription.get("plan_type", "free"),
            status=subscription.get("status", "active"),
            current_period_end=subscription.get("current_period_end"),
            cancel_at_period_end=subscription.get("cancel_at_period_end", False),
        )
    except Exception as e:
        logger.error(f"Error getting subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get subscription: {str(e)}")

@app.get("/api/subscription/usage", response_model=UsageStatsResponse)
async def get_usage_stats(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get user's usage statistics"""
    try:
        subscription_service = get_subscription_service(supabase)
        usage = subscription_service.get_usage_stats(current_user.id)
        
        return UsageStatsResponse(
            trace_count=usage.get("trace_count", 0),
            trace_limit=usage.get("trace_limit", 10),
            reset_date=usage.get("reset_date"),
        )
    except Exception as e:
        logger.error(f"Error getting usage stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get usage stats: {str(e)}")

@app.post("/api/subscription/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Create Stripe checkout session"""
    try:
        if request.plan_type not in ["pro", "team"]:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        billing_interval = request.billing_interval or "month"
        if billing_interval not in ["month", "year", "lifetime"]:
            raise HTTPException(status_code=400, detail="Invalid billing interval")
        
        stripe_service = get_stripe_service(supabase)
        session = stripe_service.create_checkout_session(
            user_id=current_user.id,
            email=current_user.email or "",
            plan_type=request.plan_type,
            billing_interval=billing_interval,
        )
        
        if not session:
            raise HTTPException(status_code=500, detail="Failed to create checkout session")
        
        return {"checkout_url": session.get("url")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@app.post("/api/subscription/portal")
async def create_portal_session(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Create Stripe Customer Portal session"""
    try:
        stripe_service = get_stripe_service(supabase)
        portal_url = stripe_service.create_portal_session(current_user.id)
        
        if not portal_url:
            raise HTTPException(status_code=400, detail="No active subscription found")
        
        return {"portal_url": portal_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating portal session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        signature = request.headers.get("stripe-signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        stripe_service = get_stripe_service(supabase)
        result = stripe_service.handle_webhook(payload, signature)
        
        if not result:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to handle webhook: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
