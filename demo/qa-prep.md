# Judge Q&A Prep — SecureOps Sentinel

> Top 8 anticipated questions with concise answers (< 30 words each).

---

## Q1: "How does this differ from just adding guardrails to a single agent?"

**A:** We don't rely on prompt-level guardrails alone. Archestra enforces security structurally — Dual LLM prevents injection from reaching the reasoning model, and Dynamic Tools blocks external actions at the platform level, not the prompt level.

---

## Q2: "What if the prompt injection evolves to bypass your quarantine?"

**A:** The quarantined LLM can ONLY output integer indices — no matter how sophisticated the injection, it physically cannot produce an exfiltration command. Even if it somehow influences the integer choice, the worst outcome is an incorrect severity classification, not data exfiltration.

---

## Q3: "Why three agents instead of one?"

**A:** Separation of concerns enables defense-in-depth. The log reader has NO access to Slack/GitHub. The commander has NO access to logs. Each agent has minimal permissions — compromising one doesn't compromise the chain.

---

## Q4: "Can this scale to real production workloads?"

**A:** Yes. The MCP server is stateless and containerized — Archestra's Orchestrator can scale pods horizontally. Log templates can be replaced with real Loki/CloudWatch integrations. The architecture doesn't change.

---

## Q5: "What's the false positive rate for blocked tool calls?"

**A:** Zero false positives in our testing. Trusted tools (like `get_service_list`) are explicitly marked as TRUSTED and never trigger blocking. Only tools returning untrusted data activate the defense — and the A2A context isolation means legitimate downstream actions still work.

---

## Q6: "How much does this cost to run?"

**A:** ~$0.09 per incident triage. We optimize with Archestra's cost controls — short prompts and remediation use Claude Haiku ($0.25/1M tokens), only the core analysis uses GPT-4o. $5/day budget supports ~55 demo runs.

---

## Q7: "Which Archestra features did you use?"

**A:** 10+ features:
1. Agent Builder (3 agents)
2. A2A Protocol (delegation chain)
3. MCP Orchestrator (custom server pod)
4. Private MCP Registry (log-source-mcp)
5. Dual LLM (quarantine pattern)
6. Dynamic Tools (context-aware blocking)
7. Tool Result Policies (trust levels)
8. Tool Call Policies (conditional blocking)
9. LLM Proxy (multi-model routing)
10. Cost Controls (budget + optimization rules)
11. Prometheus Metrics (observability)
12. Chat UI (demo interface)
13. MCP Gateway (external client access)

---

## Q8: "What did you learn building this?"

**A:** The biggest insight was that security doesn't have to sacrifice functionality. A2A context isolation is the key — it lets you quarantine untrusted data processing while still allowing the incident response workflow to complete. Archestra makes this architectural pattern accessible without building custom infrastructure.
