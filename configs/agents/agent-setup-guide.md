# Agent Setup Guide — SecureOps Sentinel

> Step-by-step instructions to create all 3 agents in Archestra Agent Builder.
> Follow this guide after MCP servers are registered and security policies are configured.

---

## Prerequisites

Before creating agents, ensure:

- [ ] Archestra running at `http://localhost:3000`
- [ ] LLM API keys added (Settings → LLM API Keys):
  - OpenAI (GPT-4o) — Primary for LogAnalyzer + Commander
  - Anthropic (Claude Haiku) — For Remediator + Dual LLM quarantine
- [ ] MCP servers registered in Private MCP Registry:
  - `log-source-mcp` (custom, local via Orchestrator)
  - `github-mcp` (from registry, authenticated with GitHub PAT)
  - `slack-mcp` (from registry, authenticated with Slack bot token)
- [ ] Dynamic Tools policies applied (see `configs/policies/dynamic-tools-policy.md`)
- [ ] Dual LLM configured (see `configs/policies/dual-llm-config.md`)

---

## Agent 1: LogAnalyzerAgent

### Create in UI

1. Navigate to `http://localhost:3000` → Agents → **Create Agent**
2. Configure:

| Field | Value |
|-------|-------|
| **Name** | `LogAnalyzerAgent` |
| **Description** | Analyzes production logs and produces structured incident summaries |
| **LLM Model** | GPT-4o (via Archestra LLM Proxy) |
| **System Prompt** | Copy from `configs/prompts/log-analyzer.system-prompt.md` |

3. **Assign Tools:**
   - ✅ `log-source-mcp:get_recent_logs`
   - ✅ `log-source-mcp:get_service_list`
   - ❌ All other tools (GitHub, Slack, etc.) — MUST NOT be assigned

4. **Sub-Agents:**
   - Add `IncidentCommanderAgent` as a sub-agent (create Commander first, then link)
   - Or configure A2A delegation after all agents are created

5. **Security Modes:**
   - Agent Security Mode: **Internal** (accessible by other agents in the org)

6. **Save**

### Test

- Open Chat → Select LogAnalyzerAgent
- Type: "What services can you monitor?"
- Expected: Returns list of services (web-api, db-primary, auth-service)
- Type: "Check recent logs for web-api"
- Expected: Structured incident summary (NOT raw logs)

---

## Agent 2: IncidentCommanderAgent

### Create in UI

1. Navigate to Agents → **Create Agent**
2. Configure:

| Field | Value |
|-------|-------|
| **Name** | `IncidentCommanderAgent` |
| **Description** | Receives incident summaries, creates GitHub issues, posts Slack alerts |
| **LLM Model** | GPT-4o (via Archestra LLM Proxy) |
| **System Prompt** | Copy from `configs/prompts/incident-commander.system-prompt.md` |

3. **Assign Tools:**
   - ✅ `github-mcp:create_issue`
   - ✅ `slack-mcp:post_message`
   - ❌ All log-reading tools — MUST NOT be assigned

4. **Sub-Agents:**
   - Add `RemediationAgent` as a sub-agent

5. **Security Modes:**
   - Agent Security Mode: **Internal**

6. **Save**

### Test

- Open Chat → Select IncidentCommanderAgent
- Type: "Create an incident for web-api: Critical severity, OOM kills detected, 3 pods restarted in last 5 minutes. Recommend rollback."
- Expected: GitHub issue created + Slack alert posted + remediation delegated

---

## Agent 3: RemediationAgent

### Create in UI

1. Navigate to Agents → **Create Agent**
2. Configure:

| Field | Value |
|-------|-------|
| **Name** | `RemediationAgent` |
| **Description** | Executes pre-approved remediation playbooks via GitHub PRs |
| **LLM Model** | Claude Haiku (cheapest — remediation is formulaic) |
| **System Prompt** | Copy from `configs/prompts/remediation.system-prompt.md` |

3. **Assign Tools:**
   - ✅ `github-mcp:create_pull_request`
   - ❌ All other tools — MUST NOT be assigned

4. **Sub-Agents:**
   - None

5. **Security Modes:**
   - Agent Security Mode: **Private** (only invoked by Commander, never directly)

6. **Save**

### Test

- Open Chat → Select RemediationAgent
- Type: "Execute rollback playbook for web-api. Incident: OOM kills, 3 pod restarts."
- Expected: PR created with title `[ROLLBACK] Revert web-api to previous version`

---

## A2A Delegation Wiring

After all 3 agents are created:

1. Go to **LogAnalyzerAgent** → Edit → Sub-Agents
   - Add: `IncidentCommanderAgent`
2. Go to **IncidentCommanderAgent** → Edit → Sub-Agents
   - Add: `RemediationAgent`

### Delegation Flow

```
User → LogAnalyzerAgent
         ↓ (A2A: sanitized incident summary)
       IncidentCommanderAgent
         ↓ (A2A: remediation request, Critical only)
       RemediationAgent
```

### Test Full Chain

- Open Chat → Select LogAnalyzerAgent
- Type: "Check recent logs for web-api and handle any issues found"
- Expected full chain:
  1. LogAnalyzer calls `get_recent_logs` → produces summary
  2. LogAnalyzer delegates to Commander (A2A)
  3. Commander creates GitHub issue + Slack alert
  4. If Critical: Commander delegates to Remediator
  5. Remediator creates rollback PR

---

## Exporting Agent Configs

After agents are working:

1. For each agent, go to Edit → Export (or use API)
2. Save JSON to `configs/agents/`:
   - `configs/agents/log-analyzer-agent.json`
   - `configs/agents/incident-commander-agent.json`
   - `configs/agents/remediation-agent.json`

This enables reproducible setup on another Archestra instance.

---

## MCP Server Registration

### Register log-source-mcp (Custom)

1. Navigate to `http://localhost:3000` → MCP Registry → **Add MCP Server**
2. Configure:

| Field | Value |
|-------|-------|
| **Name** | `log-source-mcp` |
| **Type** | Local (runs as container, managed by Orchestrator) |
| **Image** | `log-source-mcp:latest` (or build from `./log-source-mcp/Dockerfile`) |
| **Transport** | `stdio` |
| **Credentials** | None (no external auth needed) |

3. Save → Verify tools appear: `get_recent_logs`, `get_service_list`

### Install GitHub MCP (From Registry)

1. MCP Registry → **Browse** → Search "GitHub"
2. Install `github-mcp`
3. Configure credential: GitHub Personal Access Token from `.env`
4. Verify tools: `create_issue`, `create_pull_request`, etc.

### Install Slack MCP (From Registry)

1. MCP Registry → **Browse** → Search "Slack"
2. Install `slack-mcp`
3. Configure credential: Slack Bot Token from `.env`
4. Verify tools: `post_message`, etc.
