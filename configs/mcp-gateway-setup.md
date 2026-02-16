# MCP Gateway Setup — SecureOps Sentinel

> Configure an Archestra MCP Gateway to expose the agent swarm to external MCP clients
> (Claude Code, Cursor, VS Code, or any MCP-compatible tool).

---

## What Is an MCP Gateway?

An MCP Gateway wraps your Archestra agents behind a standard MCP interface, so external
tools can invoke them as if they were regular MCP tools. This lets judges (or your team)
test the system from their preferred IDE.

---

## Setup Instructions

### Step 1: Create the Gateway

1. Navigate to `http://localhost:3000/mcp-gateways`
2. Click **Create New Gateway**
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `SecureOps Sentinel Gateway` |
| **Description** | `Secure AI incident response via multi-agent swarm` |

4. Click **Create**

### Step 2: Assign Sub-Agents

In the gateway configuration:

1. Click **Add Sub-Agent**
2. Add: `LogAnalyzerAgent` (primary entry point)
3. Add: `IncidentCommanderAgent` (for direct incident creation)
4. **Do NOT add** `RemediationAgent` (it should only be invoked via Commander)

### Step 3: Copy Configuration

After saving, Archestra generates a configuration JSON. Copy it:

```json
{
  "mcpServers": {
    "secureops-sentinel": {
      "url": "http://localhost:9000/v1/mcp/<gateway-id>",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer archestra_<your-token>"
      }
    }
  }
}
```

### Step 4: Get Auth Token

1. Go to `http://localhost:3000/settings/api-keys`
2. Create a new API key with **MCP Gateway** scope
3. Copy the token (starts with `archestra_`)

---

## Connect from External Clients

### Claude Code

```bash
claude mcp add secureops \
  "http://localhost:9000/v1/mcp/<gateway-id>" \
  --transport http \
  --header "Authorization: Bearer archestra_<token>"
```

Then in Claude Code:
```
Ask secureops to check web-api logs
```

### Cursor / VS Code (MCP Extension)

Add to your MCP configuration file (`.cursor/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "secureops-sentinel": {
      "url": "http://localhost:9000/v1/mcp/<gateway-id>",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer archestra_<your-token>"
      }
    }
  }
}
```

### curl (Quick Test)

```bash
# List available tools
curl -X POST http://localhost:9000/v1/mcp/<gateway-id> \
  -H "Authorization: Bearer archestra_<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Call the triage tool
curl -X POST http://localhost:9000/v1/mcp/<gateway-id> \
  -H "Authorization: Bearer archestra_<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "check_logs",
      "arguments": {
        "service": "web-api"
      }
    },
    "id": 2
  }'
```

---

## Verification

1. **From Archestra UI:** Gateway appears in `/mcp-gateways` with status "Active"
2. **From Claude Code:** `claude mcp list` shows `secureops-sentinel` with its tools
3. **Functional test:** "Ask secureops to check web-api logs" → same triage flow works
4. **Security test:** Even through the gateway, Dynamic Tools + Dual LLM still protect

---

## Important Notes

- The MCP Gateway respects ALL security policies (Dual LLM, Dynamic Tools, Tool Policies)
- External clients see the agent swarm as regular MCP tools — the multi-agent complexity is hidden
- Gateway tokens are scoped — they can only invoke the assigned sub-agents
- Rate limiting applies per-token to prevent abuse
