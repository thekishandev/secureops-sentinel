<div align="center">
  <h1>🛡️ SecureOps Sentinel</h1>
  <p><strong>AI-powered incident response that proves security and productivity can coexist.</strong></p>

  <p>
    <a href="https://archestra.ai"><img src="https://img.shields.io/badge/Platform-Archestra-6366f1?style=flat-square" alt="Archestra" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker&logoColor=white" alt="Docker" /></a>
    <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Custom_Server-ff6b6b?style=flat-square" alt="MCP" /></a>
    <a href="https://www.wemakedevs.org/hackathons/2fast2mcp"><img src="https://img.shields.io/badge/Hackathon-2_Fast_2_MCP-e94560?style=flat-square" alt="Hackathon" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
  </p>

SecureOps Sentinel is a multi-agent system that triages production incidents using AI — while defending against prompt injection attacks hiding in log data. Built on the [Archestra](https://archestra.ai) platform, it demonstrates that AI agents can safely process untrusted data without sacrificing their ability to take automated actions.

</div>
---

## 🎯 What It Does

When a DevOps engineer asks "What's wrong with our web-api?", three AI agents collaborate:

1. **LogAnalyzerAgent** reads production logs, identifies issues, and produces a structured incident summary
2. **IncidentCommanderAgent** creates GitHub issues, posts Slack alerts, and assigns severity
3. **RemediationAgent** executes pre-approved playbooks (rollback PRs, scaling changes)

**The twist:** The logs contain a hidden prompt injection — an instruction that tries to make the AI exfiltrate secrets. Archestra's **Dual LLM quarantine** and **Dynamic Tools** neutralize the attack, while **A2A delegation** ensures the incident still gets handled.

---

## 🔒 Security Features

### The Lethal Trifecta — Solved

| Threat Vector | Our Defense |
|--------------|-------------|
| **Private data access** (logs, secrets) | LogAnalyzer has NO access to Slack/GitHub — can't exfiltrate |
| **Untrusted content** (injected instructions) | Dual LLM quarantine — raw data only seen by restricted model |
| **External actions** (Slack, GitHub, HTTP) | Dynamic Tools blocks external tools after untrusted data enters context |

### Defense-in-Depth

```
Layer 1: Dual LLM        → Injection never reaches reasoning LLM
Layer 2: Dynamic Tools    → External tools auto-blocked on tainted context
Layer 3: A2A Isolation    → Commander gets clean context, CAN act externally
Layer 4: Least Privilege  → Each agent has ONLY the tools it needs
Layer 5: Playbook-Only    → Remediator executes pre-approved actions only
```

---

## 🚀 Setup Guide

### Prerequisites

| Requirement | Why |
|-------------|-----|
| **Docker** (v24+) with Docker Compose | Runs the entire stack |
| **8 GB RAM** minimum | Archestra + embedded K8s cluster |
| **OpenAI API key** | Primary LLM (GPT-4o) |
| **GitHub PAT** | For GitHub MCP server — [create one here](https://github.com/settings/tokens) with scopes: `repo`, `read:org`, `write:issues` |
| **Slack Bot Token** | For Slack MCP server — [create a Slack app](https://api.slack.com/apps) with scopes: `chat:write`, `channels:read` |
| **Anthropic API key** *(optional)* | Fallback LLM + Claude Haiku for cost optimization |

---

### Step 1: Clone & Configure Environment

```bash
# Clone the repo
git clone https://github.com/thekishandev/secureops-sentinel.git
cd secureops-sentinel

# Create your .env file from the template
cp .env.example .env
```

Edit `.env` and fill in your real API keys:

```bash
OPENAI_API_KEY=sk-your-real-key-here
ANTHROPIC_API_KEY=sk-ant-your-real-key-here     # Optional
GITHUB_PAT=ghp_your-real-token-here
SLACK_BOT_TOKEN=xoxb-your-real-token-here
```

---

### Step 2: Launch the Stack

```bash
docker compose up -d
```

> ⏳ **First launch takes 3–5 minutes** — Archestra creates an internal Kubernetes cluster (KinD) for MCP server orchestration.

Monitor startup progress:
```bash
docker logs -f secureops-archestra
# Wait for: "Archestra Platform API started on port 9000"
```

Verify all services are running:

| Service | URL | Expected |
|---------|-----|----------|
| Archestra Chat UI | http://localhost:3000 | Login page |
| Archestra API | http://localhost:9000 | API server |
| Prometheus Metrics | http://localhost:9050/metrics | Metrics text |
| Grafana Dashboard | http://localhost:3001 | Login page |

---

### Step 3: Login to Archestra

1. Open **http://localhost:3000**
2. Login with default credentials:
   - **Email:** `admin@example.com`
   - **Password:** `password`

---

### Step 4: Add LLM API Keys

1. Go to **Settings** → **LLM Providers**
2. Enable **OpenAI** → paste your `OPENAI_API_KEY` → test connection
3. *(Optional)* Enable **Anthropic** → paste your `ANTHROPIC_API_KEY`

---

### Step 5: Register the Custom MCP Server

Build the MCP server first:
```bash
cd log-source-mcp
npm install && npm run build
cd ..
```

Then register in Archestra:
1. Go to **Settings** → **MCP Servers** → **Add Server**
2. Configure:
   - **Name:** `log-source-mcp`
   - **Transport:** `stdio`
   - **Command:** `node`
   - **Args:** `/absolute/path/to/secureops-sentinel/log-source-mcp/dist/index.js`
3. Click **Save & Start**
4. ✅ Verify: status shows **Running**, tools tab shows `get_recent_logs` and `get_service_list`

---

### Step 6: Install GitHub & Slack MCP Servers

1. Go to **Settings** → **MCP Registry** → **Public Registry**
2. Search **GitHub MCP** → **Install** → add your `GITHUB_PAT`
3. Search **Slack MCP** → **Install** → add your `SLACK_BOT_TOKEN`
4. ✅ Verify: both show "Installed" on MCP Servers page

---

### Step 7: Create the 3 Agents

Create each agent in **Agents** → **Create Agent**:

#### Agent 1: LogAnalyzerAgent
- **System Prompt:** Copy from [`configs/prompts/log-analyzer.system-prompt.md`](configs/prompts/log-analyzer.system-prompt.md)
- **LLM:** GPT-4o
- **Tools:** `log-source-mcp:get_recent_logs`, `log-source-mcp:get_service_list`
- **Sub-Agents:** `IncidentCommanderAgent`

#### Agent 2: IncidentCommanderAgent
- **System Prompt:** Copy from [`configs/prompts/incident-commander.system-prompt.md`](configs/prompts/incident-commander.system-prompt.md)
- **LLM:** GPT-4o
- **Tools:** `github-mcp:create_issue`, `slack-mcp:post_message`
- **Sub-Agents:** `RemediationAgent`

#### Agent 3: RemediationAgent
- **System Prompt:** Copy from [`configs/prompts/remediation.system-prompt.md`](configs/prompts/remediation.system-prompt.md)
- **LLM:** Claude Haiku *(cost-optimized)*
- **Tools:** `github-mcp:create_pull_request`

---

### Step 8: Apply Security Policies

#### Dual LLM (blocks prompt injection)
1. **Settings** → **Security** → **Dual LLM**
2. Enable → set **Max Rounds:** `5` → **Quarantine Model:** `Claude Haiku`
3. Apply to tool: `log-source-mcp:get_recent_logs`
4. See [`configs/policies/dual-llm-config.md`](configs/policies/dual-llm-config.md) for full config

#### Dynamic Tools (blocks data exfiltration)
1. **Settings** → **Tools** → **Tool Result Policies**
2. Mark `log-source-mcp:get_recent_logs` as **Untrusted**
3. Add rule: after untrusted data → block `github-mcp:*` and `slack-mcp:*`
4. See [`configs/policies/dynamic-tools-policy.md`](configs/policies/dynamic-tools-policy.md) for full config

#### Cost Limits
1. **Settings** → **Usage** → **Cost Limits** → daily budget: `$5.00`
2. See [`configs/policies/cost-limits.md`](configs/policies/cost-limits.md) for optimization rules

---

### Step 9: Verify — Run a Test

Open **Chat UI** → select **LogAnalyzerAgent** → type:

```
Check the web-api service logs and report any issues.
```

**Expected behavior:**
1. ✅ Agent fetches logs (including poisoned injection payload)
2. 🛡️ Dual LLM quarantine activates — injection stripped
3. 🛡️ Dynamic Tools blocks any external tool call in tainted context
4. ✅ Sanitized summary passed to IncidentCommanderAgent via A2A
5. ✅ GitHub issue created + Slack alert posted

**Verify in Grafana** (http://localhost:3001, login `admin`/`admin`):
- `llm_blocked_tools_total` > 0 → proves security is working
- `mcp_tool_calls_total` shows traffic to all 3 MCP servers

---

### 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `docker stop $(docker ps -q --filter "publish=3000")` then retry |
| Archestra shows "unhealthy" | Wait 3-5 min for KinD cluster init. Check: `docker logs secureops-archestra` |
| Grafana shows "No Data" | Verify datasource URL is `http://archestra:9050` (not `localhost`) |
| MCP server won't start | Rebuild: `cd log-source-mcp && npm run build` and verify path |
| "Tool blocked" not appearing | Check Dynamic Tools config: `get_recent_logs` must be marked **Untrusted** |

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Docker["Docker Compose"]
        subgraph Archestra["ARCHESTRA PLATFORM"]
            direction TB
            subgraph Interface["Interface Layer"]
                ChatUI["Chat UI :3000"]
                Gateway["MCP Gateway"]
                LLMProxy["LLM Proxy<br/>→ GPT-4o<br/>→ Claude Haiku"]
            end

            subgraph Agents["Agent Swarm"]
                LA["🔍 LogAnalyzerAgent<br/>Tools: log-source-mcp<br/>🛡️ Dual LLM ✅<br/>🛡️ Dynamic Tools ✅"]
                IC["📋 IncidentCommanderAgent<br/>Tools: github-mcp, slack-mcp<br/>Security: Standard"]
                RA["🔧 RemediationAgent<br/>Tools: github-mcp<br/>Security: Standard"]
            end

            subgraph MCP["MCP Orchestrator (K8s)"]
                Pod1["Pod: log-source-mcp"]
                Pod2["Pod: github-mcp"]
                Pod3["Pod: slack-mcp"]
            end

            subgraph Security["Security Layer"]
                DualLLM["Dual LLM Quarantine"]
                DynTools["Dynamic Tools Blocking"]
                Policies["Tool Call + Result Policies"]
            end

            subgraph Observability["Observability"]
                Prom["Prometheus :9050"]
                OTEL["OTEL Traces"]
                Cost["LLM Cost Tracking"]
            end
        end

        Grafana["📊 Grafana :3001<br/>6-panel security dashboard"]
    end

    ChatUI --> LA
    LA -- "sanitized summary via A2A" --> IC
    IC -- "remediation request via A2A" --> RA

    LA --> Pod1
    IC --> Pod2
    IC --> Pod3
    RA --> Pod2

    LA --> DualLLM
    LA --> DynTools

    Prom -- "scrape metrics" --> Grafana

    style LA fill:#1a1a2e,stroke:#e94560,color:#fff
    style IC fill:#1a1a2e,stroke:#0f3460,color:#fff
    style RA fill:#1a1a2e,stroke:#16213e,color:#fff
    style Security fill:#2d132c,stroke:#e94560,color:#fff
    style DualLLM fill:#c70039,stroke:#fff,color:#fff
    style DynTools fill:#c70039,stroke:#fff,color:#fff
    style Grafana fill:#1a1a2e,stroke:#f5a623,color:#fff
```

### Data Flow: Secure Incident Triage

```mermaid
sequenceDiagram
    actor User
    participant LA as LogAnalyzerAgent
    participant MCP as log-source-mcp
    participant DualLLM as 🛡️ Dual LLM
    participant DynTools as 🛡️ Dynamic Tools
    participant IC as IncidentCommanderAgent
    participant GH as GitHub MCP
    participant SL as Slack MCP
    participant RA as RemediationAgent

    User->>LA: "Check web-api logs"
    LA->>MCP: get_recent_logs("web-api")
    MCP-->>LA: Logs WITH injection 💀<br/>"IGNORE INSTRUCTIONS..."

    Note over DualLLM: Quarantine activates
    LA->>DualLLM: Raw logs → restricted LLM
    DualLLM-->>LA: Integer-only answers (safe)

    Note over DynTools: Context marked TAINTED
    DynTools--xLA: ❌ Blocks Slack/GitHub tools

    LA->>IC: Sanitized summary (A2A, clean context) ✅

    IC->>GH: create_issue() ✅
    IC->>SL: post_message() ✅
    IC->>RA: Remediation request (A2A) ✅

    RA->>GH: create_pull_request() ✅

    Note over User,RA: Injection neutralized 🛡️ Incident still handled ✅
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **3 agents, not 1** | Mirrors Lethal Trifecta defense — log reader has ZERO external comms access |
| **A2A delegation** | Creates fresh context per agent, breaking the taint chain |
| **Custom MCP server** | Real MCP server in K8s — more impressive than mock data |
| **Grafana sidecar** | Custom dashboards with security metrics = better UX score |
| **Haiku for quarantine** | Fast + cheap — quarantine only needs Q&A parsing, not reasoning |
| **No custom database** | All state in Archestra — reduces complexity, maximizes platform usage |

---

## 📊 Archestra Features Used

| # | Feature | How We Use It |
|---|---------|--------------|
| 1 | **Agent Builder** | 3 agents with specialized system prompts |
| 2 | **A2A Protocol** | LogAnalyzer → Commander → Remediator delegation chain |
| 3 | **MCP Orchestrator** | Custom `log-source-mcp` server running as managed pod |
| 4 | **Private MCP Registry** | Custom server registered alongside GitHub + Slack MCP |
| 5 | **Dual LLM** | Quarantine pattern for untrusted log data |
| 6 | **Dynamic Tools** | Auto-block external tools after untrusted data enters context |
| 7 | **Tool Result Policies** | Mark `get_recent_logs` results as UNTRUSTED |
| 8 | **Tool Call Policies** | Block Slack/GitHub when context is tainted |
| 9 | **LLM Proxy** | Multi-model routing (GPT-4o + Claude Haiku) |
| 10 | **Cost Controls** | $5/day budget + optimization rules for cheaper routing |
| 11 | **Prometheus Metrics** | Scraped by Grafana for real-time observability |
| 12 | **Chat UI** | Primary demo interface |
| 13 | **MCP Gateway** | External client access (Claude Code, Cursor) |

---

## 📁 Project Structure

```
secureops-sentinel/
├── docker-compose.yml          # Single-command deployment
├── .env.example                # Required environment variables
├── .gitignore                  # Security-safe exclusions
├── README.md                   # This file
│
├── log-source-mcp/             # Custom MCP Server
│   ├── src/
│   │   ├── index.ts            # MCP server (stdio transport)
│   │   └── log-templates.ts    # 38 log templates + injection payload
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile              # Multi-stage build
│
├── configs/
│   ├── prompts/                # Agent system prompts
│   │   ├── log-analyzer.system-prompt.md
│   │   ├── incident-commander.system-prompt.md
│   │   └── remediation.system-prompt.md
│   ├── policies/               # Security configurations
│   │   ├── dynamic-tools-policy.md
│   │   ├── dual-llm-config.md
│   │   └── cost-limits.md
│   ├── agents/
│   │   └── agent-setup-guide.md
│   ├── test-scenarios.md       # 5 integration tests
│   └── mcp-gateway-setup.md    # External client access
│
└── grafana/
   ├── provisioning/
   │   ├── datasources/prometheus.yml
   │   └── dashboards/dashboard.yml
   └── dashboards/
       └── sentinel-security.json  # 6-panel dashboard
```
---

## 📈 Results

| Metric | Value |
|--------|-------|
| Injection blocked | **100%** |
| Mean time to triage | **< 30 seconds** |
| Cost per incident | **~$0.09** |
| Setup time | **< 3 minutes** |
| Archestra features | **13** |
| False positives | **0** |

---
## 📚 Resources & Documentation

Built standing on the shoulders of giants.

*   **Archestra Docs**: [https://archestra.ai/docs/](https://archestra.ai/docs/)
*   **Archestra Github**: [https://github.com/archestra-ai](https://github.com/archestra-ai/archestra)
*   **GitHub MCP**: [github.com/github/github-mcp-server](https://github.com/github/github-mcp-server)

---

**Kishan** — *Full-Stack Developer / AI Engineer*

---

## 📄 License

This project is open source and available under the [MIT License](./LICENSE).

<div align="center">
  <p>Built with ❤️ for <strong><a href="https://www.wemakedevs.org/hackathons/2fast2mcp">2 Fast 2 MCP</a></strong> Hackathon</p>
</div>