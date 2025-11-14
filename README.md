# 🕵️ AgentTrace — The Debugger for AI Agents

Document Version: 1.0
Last Updated: October 27, 2025

## 🌍 Vision & Mission

**Vision:** To become the essential observability and debugging platform for developers building complex AI agentic systems.

**Mission:** Provide developers with intuitive tools to visualize, understand, and debug the step-by-step execution flow of their AI agents, transforming opaque "black boxes" into transparent, manageable processes.

**Motto:** "See inside your agent's mind."

## 💡 The Problem: Agent Opacity

Building sophisticated AI agents (using frameworks like LangChain, CrewAI, or custom logic) is becoming easier, but debugging them is a nightmare.

### Key Pain Points:

- **"Black Box" Execution:** It's incredibly hard to understand why an agent made a specific decision or took a certain action.
- **Messy Logs:** Agent logs are often verbose, unstructured JSON dumps, making it difficult to trace the flow of execution, identify errors, or pinpoint inefficiencies.
- **Lack of Visualization:** Standard logging tools don't provide a visual representation of the agent's thought process, tool usage, and interactions over time.
- **Collaboration Difficulty:** Sharing and discussing specific agent runs or failures is cumbersome.

Debugging AI agents today feels like debugging complex distributed systems without the proper observability tools. AgentTrace aims to be that tool.

## 🧩 The Solution: Visual Trace Debugging

AgentTrace is a web-based platform that ingests AI agent execution logs and renders them as an interactive, visual trace. It allows developers to step through the agent's process, inspect inputs/outputs at each stage, and quickly identify bottlenecks or errors.

**Core Value Proposition:** Bring clarity and debuggability to complex AI agent workflows.

### Example Use Cases:

- **Debugging Failures:** An agent fails mid-run. The developer uploads the log to AgentTrace and instantly sees the exact step where the error occurred, the inputs to that step, and the error message.
- **Optimizing Performance:** An agent seems slow. AgentTrace's timeline view shows which steps (e.g., specific LLM calls, tool usage) are taking the most time.
- **Understanding Agent Logic:** A developer wants to understand why an agent chose a specific tool. AgentTrace displays the agent's "thought" process or reasoning logged just before the tool was called.
- **Sharing & Collaboration:** A developer finds a bug and shares a unique AgentTrace URL with their team, linking directly to the problematic step in the execution trace.

## ⚙️ Core Features & Roadmap

<<<<<<< HEAD
## 💰 Pricing & Plans

- **Developer (Free):** Guest-mode debugging with timeline visualization, side-by-side comparisons, search & filters, shareable public URLs, and a dashboard for guest sessions.
- **Pro Lifetime ($59 one-time):** OAuth sign-in, user-scoped private traces with 90-day retention, authenticated API ingestion + official SDKs, AI-powered summaries & suggested fixes, global search, saved filters, and usage analytics.
- **Team (Coming Soon):** Enterprise collaboration, governance controls, and advanced analytics. Contact us to join the waitlist.

=======
>>>>>>> 15c854915bbd8a81e28d90794abc55b5466a9512
### Phase 1: The Visualizer MVP (Target: 3-4 Weeks)

Goal: Launch a functional web application that can ingest a manually provided JSON log and render a useful, shareable trace visualization. Prove the core value proposition.

- [✅] **Log Ingestion (Manual):** A simple UI where the user can paste or upload a JSON log file conforming to a specific (initially simple) schema.
- [✅] **Robust JSON Parsing Backend:** A Python (FastAPI) backend endpoint that receives the JSON log, validates its structure (using Pydantic), and potentially parses/transforms it into a standardized trace format.
- [✅] **Core Trace Visualization:** A Next.js/TypeScript frontend that renders the parsed trace data. Key views:
  - **Timeline View:** A chronological list of agent steps (e.g., Thought, Action, Observation).
  - **Step Detail View:** Clicking a step shows its full inputs, outputs, metadata (like duration, tokens used), and any errors.
- [✅] **Basic Filtering/Search:** Allow filtering steps by type (e.g., show only LLM calls, show only errors).
- [✅] **Shareable Links:** Ability to save a parsed trace (potentially using Supabase or similar for simple storage) and generate a unique, shareable URL.
- [✅] **Basic Auth (Optional but Recommended):** Use Supabase Auth or similar if saving traces, to keep them private to the user.

### Phase 2: Direct Integration & AI Assistance (Target: Q1 2026)

Goal: Reduce friction by allowing direct log ingestion via API and add initial AI-powered analysis features.

- [ ] **API Endpoint for Log Ingestion:** Provide a secure API endpoint where agent frameworks (or custom code) can directly push logs to AgentTrace.
- [ ] **SDK / Logging Adapters:** (Potential) Provide simple logging adapters for popular agent frameworks (LangChain, CrewAI) to standardize log formats and push to the API.
- [ ] **Trace Comparison:** Allow side-by-side comparison of two different agent runs (useful for A/B testing prompts or agent versions).
- [✅] **AI-Powered Error Summary:** Integrate an LLM call to automatically summarize complex errors found within a trace.
- [ ] **Basic Analytics:** Show aggregate stats for a trace (total duration, token counts, number of errors).
- [ ] **User Accounts & Saved Traces:** A proper backend (using PostgreSQL/Supabase) to save traces associated with user accounts.

### Phase 3: Real-Time & Advanced Observability (Target: Mid-Late 2026)

Goal: Move towards real-time monitoring and deeper insights, establishing AgentTrace as a full observability platform for AI agents.

- [ ] **Real-Time Trace Streaming:** Use WebSockets to display agent execution traces live as they happen.
- [ ] **Performance Monitoring:** Track metrics like step latency, token usage per step, and tool call success rates over time.
- [ ] **Automated Anomaly Detection:** Use statistical methods or AI to automatically flag unusual agent behavior or performance regressions.
- [ ] **AI-Assisted Debugging:** Allow users to ask questions about a trace (e.g., "Why did the agent choose Tool A instead of Tool B at this step?").
- [ ] **Team Collaboration Features:** Shared dashboards, trace annotations, integrations with tools like Slack/Jira.

## 🧱 Technical Architecture & Stack (MVP Focus)

| Layer | Stack / Tools | Purpose & Rationale |
|-------|---------------|-------------------|
| **Frontend** | React, Next.js, TypeScript, TailwindCSS, VisX/D3 | Fast UI for displaying complex trace data. Visualization library (VisX or D3) needed for potential graph/timeline views. |
| **Backend** | Python (FastAPI), Pydantic, OpenAI | Ideal for building a robust API endpoint that validates and parses complex JSON logs. asyncio handles I/O efficiently. OpenAI integration for AI-powered error analysis. |
| **Database** | Supabase (Postgres) (Optional MVP) | Initially, might just process logs ephemerally. Adding Supabase allows saving/sharing traces and user accounts. Can start minimal. |
| **Auth** | Supabase Auth (Optional MVP) | Needed if saving traces requires user accounts. |
| **Deployment** | Vercel (Frontend), Railway/Fly.io (Backend) | Vercel for Next.js. Railway/Fly.io are excellent for deploying containerized Python backends (like FastAPI). |

**Key Architectural Decision:** Separate frontend (Next.js) and backend (Python/FastAPI) allows using the best tool for each job. FastAPI + Pydantic is exceptionally good at handling complex JSON, which is the core of this project.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- Supabase account (for database and auth)

### Installation

1. **Clone and setup:**
```bash
git clone <repo-url>
cd agent-trace
```

2. **Backend setup:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

3. **Frontend setup:**
```bash
cd frontend
npm install
npm run dev
```

4. **Environment setup:**
   - Copy `.env.example` to `.env.local` in both frontend and backend
   - Add your Supabase credentials

### Usage

1. Open http://localhost:3000
2. Paste or upload a JSON log file
3. View the interactive trace visualization
4. Share traces with unique URLs

## 🤖 AI-Powered Error Analysis

AgentTrace includes AI-powered error analysis features that automatically analyze errors in agent traces and provide actionable insights.

### Features

- **Error Summary:** Get clear, concise summaries of complex errors in plain English
- **Root Cause Analysis:** Understand why errors occur with AI-powered root cause analysis
- **Suggested Fixes:** Receive actionable steps to resolve errors quickly
- **Caching:** Responses are cached for 24 hours to reduce costs and improve performance

### Configuration

AI features are configured via environment variables on the backend:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_ENABLED=True                    # Enable/disable AI features (True/False)
AI_MODEL=gpt-4o-mini              # Model to use: gpt-4o-mini or gpt-3.5-turbo
AI_CACHE_ENABLED=True             # Enable response caching (True/False)
```

### Feature Flag

The `AI_ENABLED` environment variable acts as a feature flag, allowing you to enable/disable AI features without changing code:

- **Purpose:** Control feature availability without redeploying
- **Benefits:**
  - Can disable if AI API is down
  - Can enable gradually (beta testing)
  - Can disable for cost control
  - No code changes needed to toggle

### Model Options

- **GPT-4o-mini** (default): ~$0.0002 per analysis - Recommended for most use cases. Fast, accurate, and cost-effective.
- **GPT-3.5-turbo**: ~$0.0004 per analysis - Alternative model option. Slightly higher cost but good performance.

### Authentication

AI features are **only available for authenticated users**. Guest users will see a "Sign in required" message when attempting to use AI analysis.

### API Endpoints

- `POST /api/traces/{trace_id}/steps/{step_id}/ai-analysis` - Request AI analysis for an error step (authentication required)
- `GET /api/traces/{trace_id}/steps/{step_id}/ai-analysis` - Get cached AI analysis (authentication required)
- `GET /api/ai/status` - Check AI feature availability (authentication required)

### Usage

1. Navigate to a trace that contains error steps
2. Click on any step in the timeline that has an error (look for the red error badge)
3. The AI analysis section will automatically appear below the error details
4. Expand sections to see summary, root cause, and suggested fixes
5. Click "Refresh" to get a new analysis, or use cached results for faster loading

### Cost Optimization

- Responses are cached for 24 hours using a hash-based cache key
- Cached analyses are free and load instantly
- Cache can be disabled via `AI_CACHE_ENABLED=False` if needed

## 📁 Project Structure

```
agent-trace/
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI app
│   ├── models/             # Pydantic models
│   ├── api/                # API routes
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 📄 License

MIT License - see LICENSE file for details.
