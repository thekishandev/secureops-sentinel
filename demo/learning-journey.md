# Learning Journey — SecureOps Sentinel

> This document addresses the **"Learning & Growth"** judging criterion.

---

## What We Learned

### 1. The Lethal Trifecta Is Real — And Solvable

Before this hackathon, we knew prompt injection was a risk, but we hadn't internalized how dangerous it becomes when AI agents have access to *both* untrusted data *and* external tools. Building SecureOps Sentinel made us deeply understand the three-way interaction (private data + untrusted content + external actions) and how Archestra's architecture breaks it.

**Key insight:** Security isn't about adding more prompts — it's about architectural constraints. Dual LLM makes injection *physically impossible* to reach the reasoning model. Dynamic Tools enforces it at the platform layer, not the application layer.

### 2. MCP Is a Game-Changer for Tool Integration

Building our custom `log-source-mcp` server taught us how MCP standardizes the interface between AI agents and tools. Instead of ad-hoc API integrations, MCP provides a clean protocol that Archestra can orchestrate, secure, and observe.

**First-time experience:** None of us had built a custom MCP server before. The SDK made it straightforward — define tools with JSON schemas, implement handlers, connect via stdio. The biggest learning curve was understanding how Archestra's Orchestrator manages the server lifecycle as pods.

### 3. A2A Protocol Enables Context Isolation

The most surprising discovery was how Archestra's Agent-to-Agent (A2A) protocol creates clean context boundaries. When LogAnalyzerAgent delegates to IncidentCommanderAgent, the taint from untrusted log data does NOT propagate. This is the architectural insight that makes the whole system work — and it's not something we could have built ourselves in a hackathon.

### 4. Observability Changes How You Think About AI Systems

Adding the Grafana dashboard forced us to think about what metrics *matter* for AI security. The `llm_blocked_tools_total` counter isn't just a number — it's proof that the security layer is active and working. We learned that observability for AI systems needs different metrics than traditional software: token usage, cost per model, tool call latency, and security event counts.

### 5. Cost Optimization Is a Design Concern, Not an Afterthought

Using Archestra's cost controls, we learned to think about which tasks need frontier models (GPT-4o) vs. which can use cheaper models (Claude Haiku). The remediation agent, which follows fixed playbooks, works perfectly on Haiku at a fraction of the cost. This is a mindset shift — model selection should be part of the agent architecture, not a global setting.

---

## Challenges We Faced

| Challenge | How We Solved It |
|-----------|-----------------|
| Understanding MCP SDK types | Read the SDK source, used strict TypeScript for safety |
| Grafana dashboard JSON format | Started with a minimal panel and iterated |
| Designing the injection payload | Studied real-world prompt injection examples |
| Balancing security vs. usability | A2A context isolation — best of both worlds |

---

## Skills Gained

- **MCP server development** (TypeScript, stdio transport, JSON schemas)
- **Archestra platform administration** (Agent Builder, policies, registries)
- **AI security engineering** (Dual LLM quarantine, Dynamic Tools, trust levels)
- **Observability for AI** (Prometheus metrics, Grafana dashboards)
- **Docker multi-stage builds** for production-grade MCP containers
