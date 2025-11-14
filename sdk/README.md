# AgentTrace SDKs

Helper libraries for easily sending agent execution traces to AgentTrace.

## TypeScript SDK

### Installation

Copy `typescript/agent-trace-sdk.ts` into your project, or install via npm (if published):

```bash
npm install @agenttrace/sdk
```

### Usage

```typescript
import { AgentTraceSDK } from './agent-trace-sdk'

// Initialize SDK
const sdk = new AgentTraceSDK({
  apiUrl: 'http://localhost:8000',
  apiKey: 'your-auth-token' // Optional, required if using authentication
})

// Start a trace
const trace = sdk.startTrace('My Agent Run', 'Processing user request')

// Add steps
trace.thought('Analyzing user request...')
trace.action('Calling search API', { query: 'test' }, { results: ['result1'] }, 150, 50)
trace.observation('Search completed successfully')
trace.error('Failed to parse response', { code: 'PARSE_ERROR' })

// Upload trace
const result = await trace.upload()
console.log(`Trace uploaded: ${result.shareable_url}`)
```

### API Reference

#### `AgentTraceSDK`

**Constructor:**
- `config.apiUrl` (string, required): Base URL of AgentTrace API
- `config.apiKey` (string, optional): Authentication token

**Methods:**
- `startTrace(name?, description?, isPublic?)`: Start a new trace
- `uploadTrace(traceData, name?, description?, isPublic?)`: Upload a pre-formatted trace

#### `AgentTrace`

**Methods:**
- `addStep(type, content, inputs?, outputs?, error?, duration_ms?, tokens_used?, metadata?)`: Add a step
- `thought(content, metadata?)`: Add a thought step
- `action(content, inputs?, outputs?, duration_ms?, tokens_used?)`: Add an action step
- `observation(content, metadata?)`: Add an observation step
- `error(errorMessage, errorDetails?)`: Add an error step
- `upload()`: Upload the trace to AgentTrace
- `getData()`: Get current trace data (for debugging)

---

## Python SDK

### Installation

Copy `python/agent_trace_sdk.py` into your project, or install via pip (if published):

```bash
pip install agent-trace-sdk
```

### Usage

```python
from agent_trace_sdk import AgentTraceSDK

# Initialize SDK
sdk = AgentTraceSDK(
    api_url='http://localhost:8000',
    api_key='your-auth-token'  # Optional, required if using authentication
)

# Start a trace
trace = sdk.start_trace('My Agent Run', 'Processing user request')

# Add steps
trace.thought('Analyzing user request...')
trace.action('Calling search API', inputs={'query': 'test'}, outputs={'results': ['result1']}, duration_ms=150, tokens_used=50)
trace.observation('Search completed successfully')
trace.error('Failed to parse response', error_details={'code': 'PARSE_ERROR'})

# Upload trace
result = trace.upload()
print(f"Trace uploaded: {result['shareable_url']}")
```

### API Reference

#### `AgentTraceSDK`

**Constructor:**
- `api_url` (str, required): Base URL of AgentTrace API
- `api_key` (str, optional): Authentication token

**Methods:**
- `start_trace(name=None, description=None, is_public=False)`: Start a new trace
- `upload_trace(trace_data, name=None, description=None, is_public=False)`: Upload a pre-formatted trace

#### `AgentTrace`

**Methods:**
- `add_step(step_type, content, inputs=None, outputs=None, error=None, duration_ms=None, tokens_used=None, metadata=None)`: Add a step
- `thought(content, metadata=None)`: Add a thought step
- `action(content, inputs=None, outputs=None, duration_ms=None, tokens_used=None)`: Add an action step
- `observation(content, metadata=None)`: Add an observation step
- `error(error_message, error_details=None)`: Add an error step
- `upload()`: Upload the trace to AgentTrace
- `get_data()`: Get current trace data (for debugging)

---

## Step Types

- **thought**: Internal reasoning or decision-making
- **action**: An action taken (API call, function call, etc.)
- **observation**: Result or observation from an action
- **error**: An error that occurred

## Example: Full Agent Run

### TypeScript

```typescript
const trace = sdk.startTrace('Customer Support Bot', 'Handling support ticket #1234')

try {
  trace.thought('User asked about refund policy')
  trace.action('Querying knowledge base', { query: 'refund policy' })
  
  const result = await queryKB('refund policy')
  trace.observation('Found relevant article', { article_id: result.id })
  
  trace.action('Generating response', { article: result.content }, { response: '...' }, 250, 100)
  trace.observation('Response generated successfully')
} catch (error) {
  trace.error(error.message, { stack: error.stack })
}

await trace.upload()
```

### Python

```python
trace = sdk.start_trace('Customer Support Bot', 'Handling support ticket #1234')

try:
    trace.thought('User asked about refund policy')
    trace.action('Querying knowledge base', inputs={'query': 'refund policy'})
    
    result = query_kb('refund policy')
    trace.observation('Found relevant article', metadata={'article_id': result.id})
    
    trace.action('Generating response', inputs={'article': result.content}, outputs={'response': '...'}, duration_ms=250, tokens_used=100)
    trace.observation('Response generated successfully')
except Exception as e:
    trace.error(str(e), error_details={'stack': traceback.format_exc()})

trace.upload()
```

---

## Authentication

If your AgentTrace instance requires authentication, you need to provide an `api_key` when initializing the SDK. This should be a valid Supabase JWT token from your authenticated session.

---

## Error Handling

Both SDKs will raise exceptions if the upload fails. Always wrap upload calls in try-catch blocks:

```typescript
try {
  await trace.upload()
} catch (error) {
  console.error('Failed to upload trace:', error)
}
```

```python
try:
    trace.upload()
except Exception as e:
    print(f'Failed to upload trace: {e}')
```

