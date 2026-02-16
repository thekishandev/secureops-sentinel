# Dynamic Tools Policy — SecureOps Sentinel

> Step-by-step configuration for Archestra's Dynamic Tools and Tool Policies.
> Apply these settings in the Archestra UI BEFORE running any end-to-end tests.

---

## Tool Result Policies

Configure at: **Archestra UI → Tools → Tool Result Policies**

| Tool | Trust Level | Rationale |
|------|-------------|-----------|
| `log-source-mcp:get_recent_logs` | **UNTRUSTED** | Log data is external, uncontrolled input — may contain prompt injection |
| `log-source-mcp:get_service_list` | **TRUSTED** | Returns a static list of service names — no user-controlled content |

### How to Set

1. Navigate to `http://localhost:3000/tools`
2. Find `log-source-mcp` in the MCP server list
3. Click on `get_recent_logs` → Edit Tool Result Policy
4. Set **Result Trust Level** to `Untrusted`
5. Click on `get_service_list` → Edit Tool Result Policy
6. Set **Result Trust Level** to `Trusted`
7. Save changes

---

## Dynamic Tools Behavior

When `get_recent_logs` returns data:

1. Archestra **marks the chat context as tainted** (untrusted data present)
2. Any subsequent tool call in the **same agent context** is checked against policies
3. If the tool has **external communication capability** (Slack, GitHub, email, HTTP), it is **BLOCKED**
4. The agent receives a message: `"Tool blocked: Dynamic Tools prevented external communication after untrusted data entered the context."`

This is the key mechanism that **breaks the Lethal Trifecta** — the LogAnalyzerAgent has access to private data (logs) and is exposed to untrusted content (injection), but its ability to externally communicate is automatically revoked.

---

## Tool Call Policies

Configure at: **Archestra UI → Tools → Tool Call Policies**

| Policy Rule | Tool | Condition | Action |
|-------------|------|-----------|--------|
| 1 | `slack-mcp:*` | Context is tainted (untrusted data present) | **BLOCK** |
| 2 | `github-mcp:*` | Context is tainted (untrusted data present) | **BLOCK** |
| 3 | `log-source-mcp:get_recent_logs` | Always | **ALLOW** |
| 4 | `log-source-mcp:get_service_list` | Always | **ALLOW** |

### Why IncidentCommanderAgent Still Works

The IncidentCommanderAgent receives data via **A2A delegation**, which creates a **new, clean context**. The taint from `get_recent_logs` does NOT propagate across agent boundaries. This is by design in Archestra's A2A protocol.

```
LogAnalyzerAgent context:
  ├── get_recent_logs result → TAINTED
  ├── Slack/GitHub tools → BLOCKED ✅
  └── A2A delegation to Commander → sends sanitized summary only

IncidentCommanderAgent context:
  ├── Receives clean A2A message → NOT TAINTED
  ├── Slack tools → ALLOWED ✅
  └── GitHub tools → ALLOWED ✅
```

---

## Verification Checklist

After applying these policies, verify with this test:

1. Open Chat UI → select LogAnalyzerAgent
2. Type: "Check recent logs for web-api"
3. Expected: Agent calls `get_recent_logs` → receives logs with injection
4. Expected: If agent tries to call Slack/GitHub → sees "Tool blocked" message
5. Expected: Agent produces a sanitized summary instead
6. Switch to IncidentCommanderAgent (or trigger via A2A)
7. Expected: Commander CAN call GitHub and Slack (clean context)
