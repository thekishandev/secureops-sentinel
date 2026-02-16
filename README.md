# SecureOps Sentinel

> **AI-powered incident response that proves security and productivity can coexist.**

SecureOps Sentinel is a multi-agent system that triages production incidents using AI — while defending against prompt injection attacks hiding in log data. Built on the [Archestra](https://archestra.ai) platform, it demonstrates that AI agents can safely process untrusted data without sacrificing their ability to take automated actions.

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

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> && cd secureops-sentinel

# 2. Add your API keys
cp .env.example .env
# Edit .env with your OpenAI, GitHub, and Slack credentials

# 3. Launch everything
docker-compose up

# 4. Open Archestra
# Chat UI: http://localhost:3000
# Grafana:  http://localhost:3001 (admin/admin)
```

### Prerequisites
- Docker & Docker Compose
- OpenAI API key (GPT-4o)
- GitHub Personal Access Token
- Slack Bot Token

---

## 🏗️ Architecture

```
┌────────────────────── Docker Compose ──────────────────────┐
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ARCHESTRA PLATFORM (:3000)              │  │
│  │                                                      │  │
│  │  LogAnalyzerAgent ──A2A──▶ IncidentCommanderAgent   │  │
│  │       │                          │          │        │  │
│  │  [log-source-mcp]          [github-mcp] [slack-mcp] │  │
│  │       │                          │          │        │  │
│  │  🛡️ Dual LLM               creates issues  alerts    │  │
│  │  🛡️ Dynamic Tools                   │               │  │
│  │                               RemediationAgent       │  │
│  │                                     │                │  │
│  │                               [github-mcp]           │  │
│  │                              creates rollback PR     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────┐                                │
│  │  Grafana (:3001)       │  6-panel security dashboard   │
│  │  Prometheus (:9050)    │  blocked tools, cost, latency │
│  └────────────────────────┘                                │
└────────────────────────────────────────────────────────────┘
```

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
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml
│   │   └── dashboards/dashboard.yml
│   └── dashboards/
│       └── sentinel-security.json  # 6-panel dashboard
│
└── demo/
    ├── demo-script.md          # 3-minute narration
    ├── slides.md               # 7-slide pitch deck
    └── qa-prep.md              # Judge Q&A (8 pairs)
```

---

## 🎬 Demo

[Demo video link — to be added after recording]

**Key moments to watch:**
1. 🔴 Prompt injection hidden in production logs
2. 🛡️ Dual LLM quarantine showing integer-only Q&A
3. ✅ GitHub issue + Slack alert still created via A2A

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

## 👥 Team

- **Kishan** — *Full-Stack Developer / AI Engineer*

---
