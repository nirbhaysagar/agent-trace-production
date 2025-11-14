"""
AgentTrace Python SDK

A lightweight helper library for sending agent execution traces to AgentTrace.

Usage:
    from agent_trace_sdk import AgentTraceSDK

    sdk = AgentTraceSDK(
        api_url='http://localhost:8000',
        api_key='your-auth-token'  # Optional, if using auth
    )

    # Start a trace
    trace = sdk.start_trace('My Agent Run')

    # Add steps
    trace.add_step('thought', 'Analyzing user request...')
    trace.add_step('action', 'Calling API', inputs={'query': 'test'}, outputs={'results': []})
    trace.add_step('observation', 'API call successful')

    # Finish and upload
    result = trace.upload()
    print(f"Trace uploaded: {result['shareable_url']}")
"""

import json
import time
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
import requests


class AgentTrace:
    """Represents a single trace session"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.steps: List[Dict[str, Any]] = []
        self.start_time = time.time()

    def add_step(
        self,
        step_type: str,
        content: str,
        inputs: Optional[Dict[str, Any]] = None,
        outputs: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        duration_ms: Optional[int] = None,
        tokens_used: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a step to the trace"""
        self.steps.append({
            'id': self._generate_id(),
            'type': step_type,
            'content': content,
            'inputs': inputs or {},
            'outputs': outputs or {},
            'error': error,
            'duration_ms': duration_ms,
            'tokens_used': tokens_used,
            'metadata': metadata or {},
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        })

    def thought(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add a thought step"""
        self.add_step('thought', content, metadata=metadata)

    def action(
        self,
        content: str,
        inputs: Optional[Dict[str, Any]] = None,
        outputs: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[int] = None,
        tokens_used: Optional[int] = None,
    ) -> None:
        """Add an action step"""
        self.add_step('action', content, inputs, outputs, None, duration_ms, tokens_used)

    def observation(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add an observation step"""
        self.add_step('observation', content, metadata=metadata)

    def error(self, error_message: str, error_details: Optional[Dict[str, Any]] = None) -> None:
        """Add an error step"""
        self.add_step('error', error_message, error=error_message, metadata=error_details)

    def upload(self) -> Dict[str, Any]:
        """Upload the trace to AgentTrace"""
        trace_data = {'steps': self.steps}

        headers = {'Content-Type': 'application/json'}
        if self.config.get('api_key'):
            headers['Authorization'] = f"Bearer {self.config['api_key']}"

        body: Dict[str, Any] = {'trace_data': trace_data}

        if self.config.get('name'):
            body['name'] = self.config['name']

        if self.config.get('description'):
            body['description'] = self.config['description']

        if 'is_public' in self.config:
            body['is_public'] = self.config['is_public']

        response = requests.post(
            f"{self.config['api_url']}/api/traces/upload",
            headers=headers,
            json=body,
        )

        if not response.ok:
            error_detail = response.json().get('detail', response.text) if response.headers.get('content-type', '').startswith('application/json') else response.text
            raise Exception(f"Failed to upload trace: {error_detail}")

        return response.json()

    def get_data(self) -> Dict[str, Any]:
        """Get the current trace data (for debugging)"""
        return {'steps': self.steps}

    def _generate_id(self) -> str:
        """Generate a unique step ID"""
        return f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:9]}"


class AgentTraceSDK:
    """Main SDK class for AgentTrace"""

    def __init__(self, api_url: str, api_key: Optional[str] = None):
        """
        Initialize the SDK

        Args:
            api_url: The base URL of the AgentTrace API (e.g., 'http://localhost:8000')
            api_key: Optional authentication token
        """
        self.config = {
            'api_url': api_url.rstrip('/'),
            'api_key': api_key,
        }

    def start_trace(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_public: bool = False,
    ) -> AgentTrace:
        """
        Start a new trace

        Args:
            name: Optional name for the trace
            description: Optional description
            is_public: Whether the trace should be publicly viewable

        Returns:
            An AgentTrace instance
        """
        config = self.config.copy()
        if name:
            config['name'] = name
        if description:
            config['description'] = description
        config['is_public'] = is_public
        return AgentTrace(config)

    def upload_trace(
        self,
        trace_data: Dict[str, Any],
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_public: bool = False,
    ) -> Dict[str, Any]:
        """
        Upload a pre-formatted trace

        Args:
            trace_data: Dictionary with 'steps' key containing list of step dictionaries
            name: Optional name for the trace
            description: Optional description
            is_public: Whether the trace should be publicly viewable

        Returns:
            Response from the API with trace ID and shareable URL
        """
        headers = {'Content-Type': 'application/json'}
        if self.config.get('api_key'):
            headers['Authorization'] = f"Bearer {self.config['api_key']}"

        body: Dict[str, Any] = {
            'trace_data': [
                {
                    'type': step.get('type', 'unknown'),
                    'content': step.get('content', ''),
                    'inputs': step.get('inputs', {}),
                    'outputs': step.get('outputs', {}),
                    'error': step.get('error'),
                    'duration_ms': step.get('duration_ms'),
                    'tokens_used': step.get('tokens_used'),
                    'metadata': step.get('metadata', {}),
                    'timestamp': step.get('timestamp', datetime.utcnow().isoformat() + 'Z'),
                }
                for step in trace_data.get('steps', [])
            ]
        }

        if name:
            body['name'] = name
        if description:
            body['description'] = description
        body['is_public'] = is_public

        response = requests.post(
            f"{self.config['api_url']}/api/traces/upload",
            headers=headers,
            json=body,
        )

        if not response.ok:
            error_detail = response.json().get('detail', response.text) if response.headers.get('content-type', '').startswith('application/json') else response.text
            raise Exception(f"Failed to upload trace: {error_detail}")

        return response.json()

