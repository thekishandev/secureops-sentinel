# Cost Control Configuration — SecureOps Sentinel

> Configure Archestra's Cost Control features to keep LLM spending predictable.
> Apply these settings at **Settings → Usage Limits** in the Archestra UI.

---

## Organization-Level Budget

1. Navigate to `http://localhost:3000/settings/usage`
2. Create a new budget:

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Daily Budget** | `$5.00` | Sufficient for demo + testing; prevents runaway costs |
| **Action When Reached** | Alert + fallback to cheaper model | Keeps agents functional but cheaper |
| **Alert Channel** | Slack `#ops-costs` | Immediate visibility |

---

## Optimization Rules

Configure at: **Settings → Usage Limits → Optimization Rules**

### Rule 1: Short Prompts Use Haiku

| Setting | Value |
|---------|-------|
| **Name** | `Short prompts → Haiku` |
| **Condition** | Content length < 500 tokens |
| **Target Model** | Claude Haiku |
| **Priority** | 1 (highest) |

**Rationale:** Short metadata queries (e.g., "list services") don't need GPT-4o reasoning power.

### Rule 2: No-Tools Requests Use Haiku

| Setting | Value |
|---------|-------|
| **Name** | `No-tools → Haiku` |
| **Condition** | No tools in request |
| **Target Model** | Claude Haiku |
| **Priority** | 2 |

**Rationale:** Pure text responses (summaries, explanations) can use cheaper models.

### Rule 3: Remediation Uses Haiku

| Setting | Value |
|---------|-------|
| **Name** | `Remediation → Haiku` |
| **Condition** | Agent = RemediationAgent |
| **Target Model** | Claude Haiku |
| **Priority** | 3 |

**Rationale:** Remediation follows fixed playbooks — formulaic, doesn't need frontier reasoning.

---

## Expected Cost Breakdown (Per Demo Run)

| Agent | Model | Avg Tokens | Est. Cost |
|-------|-------|-----------|-----------|
| LogAnalyzerAgent | GPT-4o | ~2,000 | ~$0.06 |
| Dual LLM Quarantine | Claude Haiku | ~500 | ~$0.001 |
| IncidentCommanderAgent | GPT-4o | ~1,000 | ~$0.03 |
| RemediationAgent | Claude Haiku | ~500 | ~$0.001 |
| **Total per run** | | | **~$0.09** |

At ~$0.09/run, a $5/day budget allows ~55 demo runs — more than sufficient.

---

## Verification

After applying:

1. Go to Settings → Usage Limits → verify budget shows `$5.00/day`
2. Run a full triage flow → check usage dashboard
3. Verify RemediationAgent used Haiku (check LLM Cost panel in Grafana)
4. Verify short queries (`get_service_list`) route to Haiku
