# Risk Matrix & Mitigation — SecureOps Sentinel

> 3 major risks identified during development, with probability, impact, and mitigation strategies.

---

## Risk 1: Archestra Platform Unavailability During Demo

| Property | Value |
|----------|-------|
| **Probability** | Medium |
| **Impact** | Critical |
| **Category** | Infrastructure |

**Description:** The Archestra Docker container may fail to start, run out of memory, or exhibit unexpected behavior during the live demo.

**Mitigation:**
- **Primary:** Test `docker-compose up` from clean state before demo
- **Fallback A:** Pre-recorded demo video (3 min) as backup
- **Fallback B:** Slides with annotated screenshots showing each step
- **Prevention:** Use `restart: unless-stopped` in docker-compose, set health checks with retries

---

## Risk 2: LLM API Rate Limits or Outage

| Property | Value |
|----------|-------|
| **Probability** | Low–Medium |
| **Impact** | High |
| **Category** | External Dependency |

**Description:** OpenAI or Anthropic APIs may be rate-limited, throttled, or temporarily unavailable during testing or demo.

**Mitigation:**
- **Primary:** Have both OpenAI and Anthropic keys configured (Archestra supports multi-LLM)
- **Fallback:** Cost limits + model fallback rules auto-switch to cheaper/different model
- **Prevention:** Test all API keys before demo, keep usage low with Haiku for non-critical paths
- **Demo safety:** Pre-run the demo scenario once to warm up caches

---

## Risk 3: Prompt Injection Bypass (False Negative)

| Property | Value |
|----------|-------|
| **Probability** | Low |
| **Impact** | High |
| **Category** | Security |

**Description:** A more sophisticated injection technique could theoretically bypass the Dual LLM quarantine (e.g., encoding the payload in a way that influences integer choice meaningfully).

**Mitigation:**
- **Primary:** Dual LLM restricts quarantine output to integers ONLY — there is no text channel for injection to escape through
- **Defense-in-depth:** Dynamic Tools blocks external actions regardless of whether quarantine catches the injection
- **A2A isolation:** Even if an injection influenced the severity classification, the worst outcome is a wrong severity label — not data exfiltration
- **Monitoring:** `llm_blocked_tools_total` in Grafana immediately shows if any external tool call was attempted after untrusted data

---

## Summary Matrix

| Risk | Prob. | Impact | Mitigation Status |
|------|-------|--------|-------------------|
| Platform unavailability | Medium | Critical | ✅ 3 fallback layers |
| API rate limits | Low–Med | High | ✅ Multi-provider + fallback model |
| Injection bypass | Low | High | ✅ 4-layer defense-in-depth |
