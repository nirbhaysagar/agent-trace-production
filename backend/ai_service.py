import os
import json
import hashlib
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Cache entry structure: {hash: {"response": {...}, "created_at": datetime}}
_analysis_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_HOURS = 24


class AIAnalysisService:
    """Service for AI-powered error analysis using OpenAI"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.enabled = os.getenv("AI_ENABLED", "True").lower() == "true"
        self.model = os.getenv("AI_MODEL", "gpt-4o-mini")
        self.cache_enabled = os.getenv("AI_CACHE_ENABLED", "True").lower() == "true"
        
        # Validate model
        if self.model not in ["gpt-4o-mini", "gpt-3.5-turbo"]:
            logger.warning(f"Invalid AI_MODEL '{self.model}', defaulting to 'gpt-4o-mini'")
            self.model = "gpt-4o-mini"
        
        self.client = None
        if self.api_key and self.enabled:
            try:
                self.client = OpenAI(api_key=self.api_key)
                logger.info(f"AIAnalysisService initialized with model: {self.model}")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.client = None
    
    def is_enabled(self) -> bool:
        """Check if AI features are enabled"""
        return self.enabled and self.client is not None
    
    def _get_model(self) -> str:
        """Get the configured model"""
        return self.model
    
    def _generate_cache_key(self, error_message: str, step_context: Dict[str, Any], trace_context: Dict[str, Any]) -> str:
        """Generate a cache key from error message and context"""
        cache_data = {
            "error": error_message,
            "step_type": step_context.get("step_type", ""),
            "content": step_context.get("content", "")[:500],  # Limit content length
            "inputs": json.dumps(step_context.get("inputs", {}), sort_keys=True),
            "trace_id": trace_context.get("trace_id", ""),
        }
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.sha256(cache_string.encode()).hexdigest()
    
    def _get_cached_analysis(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached analysis if available and not expired"""
        if not self.cache_enabled:
            return None
        
        if cache_key not in _analysis_cache:
            return None
        
        cache_entry = _analysis_cache[cache_key]
        created_at = cache_entry.get("created_at")
        
        # Check if cache entry is expired
        if isinstance(created_at, datetime):
            age = datetime.now() - created_at
            if age > timedelta(hours=CACHE_TTL_HOURS):
                # Cache expired, remove it
                del _analysis_cache[cache_key]
                return None
        
        return cache_entry.get("response")
    
    def _store_cached_analysis(self, cache_key: str, response: Dict[str, Any]):
        """Store analysis in cache"""
        if not self.cache_enabled:
            return
        
        _analysis_cache[cache_key] = {
            "response": response,
            "created_at": datetime.now()
        }
    
    def _generate_prompt(self, error_message: str, step_context: Dict[str, Any], trace_context: Dict[str, Any]) -> str:
        """Generate the prompt for AI analysis"""
        step_type = step_context.get("step_type", "unknown")
        content = step_context.get("content", "")[:1000]  # Limit content length
        inputs = step_context.get("inputs", {})
        
        # Get previous steps context (last 2-3 steps)
        previous_steps = trace_context.get("previous_steps", [])
        previous_context = ""
        if previous_steps:
            previous_context = "\n\nPrevious Steps Context:\n"
            for prev_step in previous_steps[-3:]:  # Last 3 steps
                prev_type = prev_step.get("step_type", "unknown")
                prev_content = prev_step.get("content", "")[:200]
                previous_context += f"- {prev_type}: {prev_content}\n"
        
        prompt = f"""Analyze this AI agent error and provide a clear, actionable analysis.

Error Message:
{error_message}

Step Context:
- Step Type: {step_type}
- Content: {content[:500]}
- Inputs: {json.dumps(inputs, indent=2) if inputs else "None"}{previous_context}

Please provide a JSON response with the following structure:
{{
  "summary": "A clear, concise error summary (1-2 sentences)",
  "root_cause": "The likely root cause of the error (1-2 sentences)",
  "suggested_fix": "Actionable steps to fix the error (2-3 numbered steps)"
}}

Format your response as valid JSON only, no additional text."""
        
        return prompt
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, str]:
        """Parse AI response and extract structured data"""
        try:
            # Try to extract JSON from response
            # Sometimes AI wraps JSON in markdown code blocks
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            
            # Parse JSON
            parsed = json.loads(response_text)
            
            # Validate required fields
            required_fields = ["summary", "root_cause", "suggested_fix"]
            for field in required_fields:
                if field not in parsed:
                    raise ValueError(f"Missing required field: {field}")
            
            return {
                "summary": str(parsed["summary"]),
                "root_cause": str(parsed["root_cause"]),
                "suggested_fix": str(parsed["suggested_fix"])
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            # Fallback: return a basic structure
            return {
                "summary": "Failed to parse AI response",
                "root_cause": "The AI response could not be parsed",
                "suggested_fix": "Please try again or check the error manually"
            }
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            return {
                "summary": "Error analyzing response",
                "root_cause": str(e),
                "suggested_fix": "Please try again"
            }
    
    def analyze_error(
        self, 
        error_message: str, 
        step_context: Dict[str, Any], 
        trace_context: Dict[str, Any],
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Analyze an error using AI
        
        Args:
            error_message: The error message to analyze
            step_context: Context about the step (step_type, content, inputs, etc.)
            trace_context: Context about the trace (trace_id, previous_steps, etc.)
            force_refresh: If True, skip cache and force new analysis
        
        Returns:
            Dict with summary, root_cause, suggested_fix, model_used, cached, created_at
        """
        if not self.is_enabled():
            raise ValueError("AI features are not enabled or OpenAI client is not configured")
        
        # Generate cache key
        cache_key = self._generate_cache_key(error_message, step_context, trace_context)
        
        # Check cache first (unless force refresh)
        if not force_refresh:
            cached_response = self._get_cached_analysis(cache_key)
            if cached_response:
                logger.info(f"Returning cached analysis for error: {error_message[:50]}")
                return {
                    **cached_response,
                    "cached": True
                }
        
        # Call OpenAI API
        try:
            prompt = self._generate_prompt(error_message, step_context, trace_context)
            
            logger.info(f"Calling OpenAI API with model: {self.model}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert AI debugging assistant. Analyze errors and provide clear, actionable insights."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent, focused responses
                max_tokens=500,  # Limit response length
            )
            
            # Extract response text
            response_text = response.choices[0].message.content
            
            # Parse response
            parsed_response = self._parse_ai_response(response_text)
            
            # Build full response
            full_response = {
                "summary": parsed_response["summary"],
                "root_cause": parsed_response["root_cause"],
                "suggested_fix": parsed_response["suggested_fix"],
                "model_used": self.model,
                "cached": False,
                "created_at": datetime.now().isoformat()
            }
            
            # Store in cache
            self._store_cached_analysis(cache_key, full_response)
            
            return full_response
            
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            raise ValueError(f"Failed to analyze error: {str(e)}")


# Global instance
_ai_service: Optional[AIAnalysisService] = None


def get_ai_service() -> AIAnalysisService:
    """Get or create the global AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIAnalysisService()
    return _ai_service


