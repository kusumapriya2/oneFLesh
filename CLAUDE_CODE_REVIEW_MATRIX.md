# Claude Model × Effort — Code Review & Security Audit Matrix
### Reference Guide for Engineers & Architects · May 2026

> **How to read this:** Each row is a specific Model + Effort combination.  
> Ratings are relative to each other, not absolute. "Cost" is relative token spend per review session.  
> Use this to choose the right setting *before* starting a review — wrong settings = real missed vulnerabilities.

---

## The Full Matrix

| # | Model | Effort | Relative Cost | Speed | Code Review Quality | Security Audit Quality | Best For | Misses |
|---|-------|--------|--------------|-------|--------------------|-----------------------|----------|--------|
| 1 | Haiku | low | 💰 Minimal | ⚡⚡⚡⚡⚡ | ⭐ 15% | ⭐ 10% | Spell-check, formatting, CI lint gate | Almost everything meaningful |
| 2 | Haiku | medium | 💰 Very Low | ⚡⚡⚡⚡ | ⭐⭐ 25% | ⭐ 15% | Obvious syntax errors, unused variables | Logic, security, architecture |
| 3 | Haiku | high | 💰💰 Low | ⚡⚡⚡ | ⭐⭐ 35% | ⭐⭐ 25% | Simple single-file review | Cross-file issues, all security |
| 4 | **Sonnet** | **low** | 💰💰 Low | ⚡⚡⚡⚡ | ⭐⭐ 40% | ⭐⭐ 30% | Quick PR scan, style issues | Race conditions, auth chains, data flow |
| 5 | **Sonnet** | **medium** | 💰💰💰 Moderate | ⚡⚡⚡ | ⭐⭐⭐ 60% | ⭐⭐⭐ 50% | PR reviews, module-level bugs | Subtle security, cross-module interactions |
| 6 | **Sonnet** | **high** | 💰💰💰 Moderate | ⚡⚡ | ⭐⭐⭐⭐ 75% | ⭐⭐⭐ 65% | Feature-level review, API design | Deep auth chains, business logic gaps |
| 7 | **Sonnet** | **max** | 💰💰💰💰 High | ⚡⚡ | ⭐⭐⭐⭐ 80% | ⭐⭐⭐⭐ 75% | Full module security, mid-size codebase | Complex cascade vulnerabilities in large codebases |
| 8 | **Opus** | **low** | 💰💰💰 Moderate | ⚡⚡⚡ | ⭐⭐⭐ 65% | ⭐⭐⭐ 60% | Quick Opus pass on critical files | Depth — Opus reasoning not engaged |
| 9 | **Opus** | **medium** | 💰💰💰💰 High | ⚡⚡ | ⭐⭐⭐⭐ 80% | ⭐⭐⭐⭐ 78% | Security-sensitive module review | Full codebase cross-file tracing |
| 10 | **Opus** | **high** | 💰💰💰💰💰 Very High | ⚡ | ⭐⭐⭐⭐⭐ 90% | ⭐⭐⭐⭐⭐ 88% | Full security audit, production readiness | Only the most exotic edge cases |
| 11 | **Opus** | **max** | 💰💰💰💰💰💰 Max | 🐢 | ⭐⭐⭐⭐⭐ 97% | ⭐⭐⭐⭐⭐ 95% | **Critical system security audit, financial/medical/auth** | Near-nothing at this level |

---

## Detailed Breakdown by Use Case

### 🟢 Use Case 1: Daily PR Review (1–5 files changed)

```
Recommended:  Sonnet + medium
Alternative:  Sonnet + high (for auth/security-touching PRs)
Avoid:        Opus + max (overkill, wastes budget)
```

| Model + Effort | Will catch | Will miss |
|----------------|-----------|-----------|
| Sonnet + low | Syntax errors, unused imports, obvious null refs | Logic bugs, missing validations |
| **Sonnet + medium** ✅ | Logic bugs, missing error handling, type mismatches, basic security | Cross-file interactions |
| Sonnet + high | Cross-file impacts of the change, edge cases | Deep auth chains |

---

### 🟡 Use Case 2: Feature-Level Review (1 module, 5–15 files)

```
Recommended:  Sonnet + high
Alternative:  Opus + medium (for sensitive modules like auth, payments)
Avoid:        Sonnet + low, Haiku any effort
```

| Model + Effort | Will catch | Will miss |
|----------------|-----------|-----------|
| Sonnet + medium | Most bugs, API design issues | Subtle race conditions |
| **Sonnet + high** ✅ | Race conditions, unscoped queries, incomplete features | Complex cross-module data leaks |
| Opus + medium | All of the above + inter-module issues | Full cascade vulnerability chains |

---

### 🔴 Use Case 3: Security Audit (auth, payments, PII, encryption)

```
Recommended:  Opus + high
For critical: Opus + max
Avoid:        Any Sonnet for security-critical paths
```

| Model + Effort | Will catch | Will miss |
|----------------|-----------|-----------|
| Sonnet + high | Common vulnerabilities (injection, auth missing) | Subtle auth bypass, logic flaws |
| Sonnet + max | Most security issues | Complex multi-step exploit chains |
| **Opus + high** ✅ | Deep auth chains, race conditions, data isolation gaps, half-implemented security features | Very exotic edge cases |
| **Opus + max** 🏆 | Everything above + cascade vulnerabilities, cross-service data leaks, timing attacks | Near-nothing |

---

### 🔴🔴 Use Case 4: Full Codebase Audit (production readiness, 40+ files)

```
Recommended:  Opus + max
No substitute exists for this quality level
```

| Model + Effort | Coverage | What happens with OneFlesh (45 API + 38 web files) |
|----------------|----------|---------------------------------------------------|
| Sonnet + low | 40% | Found: unused imports, type errors. Missed: race conditions, ghost features, unscoped data |
| Sonnet + high | 75% | Finds most issues but misses subtle auth chains |
| Opus + high | 90% | Finds auth chains, traces data flow across modules |
| **Opus + max** ✅ | 97% | Traces: `hardDeleteAt` written but never consumed → ghost feature. `MAX_CONCURRENT_SESSIONS` declared but never enforced. MFA backup codes never invalidated. Notification `relatedEntityId` cross-church leak. AI prompt injection path. |

---

## What Each Effort Level Actually Does Internally

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EFFORT = REASONING BUDGET                         │
│                                                                       │
│  low    ──►  ~1-2K  reasoning tokens                                 │
│              Reads code. Matches against known patterns.              │
│              "I see a raw string concatenation — possible injection"  │
│                                                                       │
│  medium ──►  ~8-16K reasoning tokens                                 │
│              Reads code. Traces single function call stack.           │
│              "This function calls that one — the input from user      │
│               reaches the DB without validation"                      │
│                                                                       │
│  high   ──►  ~32K  reasoning tokens                                  │
│              Reads code. Traces across multiple files.                │
│              "The middleware injects churchId BUT this route          │
│               bypasses it via the query param override on line 47"   │
│                                                                       │
│  max    ──►  ~64K+ reasoning tokens                                  │
│              Holds entire architecture in working memory.             │
│              "The session model exists. The env var is declared.      │
│               But zero service files read that env var.               │
│               The feature is a stub. Also: when this fails, that     │
│               notification fires, and that notification's entityId    │
│               is never church-scoped, so data from church B           │
│               leaks to church A's notification feed."                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The OneFlesh Code Review — What Each Setting Would Have Found

This is what actually happened vs what should have happened:

```
Setting Used:    Sonnet + low
Issues Found:    44 (mostly surface: unused React, type cast errors,
                 missing .env.example, wrong field names)
Issues Missed:   8+ deep issues (race conditions, ghost features,
                 unscoped data, prompt injection)
```

| Issue | Sonnet+low | Sonnet+high | Opus+high | Opus+max |
|-------|:----------:|:-----------:|:---------:|:--------:|
| Unused imports / React | ✅ | ✅ | ✅ | ✅ |
| Type cast errors | ✅ | ✅ | ✅ | ✅ |
| Missing .env.example | ✅ | ✅ | ✅ | ✅ |
| Endorsement field mismatch | ✅ | ✅ | ✅ | ✅ |
| fullName missing from search | ✅ | ✅ | ✅ | ✅ |
| PaginatedResponse wrong shape | ✅ | ✅ | ✅ | ✅ |
| No Error Boundary | ❌ | ✅ | ✅ | ✅ |
| Alliance creation race condition | ❌ | ❌ | ✅ | ✅ |
| Counselling sessions unscoped | ❌ | ❌ | ✅ | ✅ |
| Notification entityId not validated | ❌ | ❌ | ✅ | ✅ |
| `hardDeleteAt` never consumed (ghost feature) | ❌ | ❌ | ⚠️ | ✅ |
| MFA backup codes never invalidated | ❌ | ❌ | ⚠️ | ✅ |
| `MAX_CONCURRENT_SESSIONS` never enforced | ❌ | ❌ | ❌ | ✅ |
| Alliance notes not church-scoped | ❌ | ❌ | ❌ | ✅ |
| AI prompt injection unguarded | ❌ | ❌ | ⚠️ | ✅ |
| UserSession cascade on delete unchecked | ❌ | ❌ | ❌ | ✅ |

✅ = Would catch &nbsp; ⚠️ = Might catch &nbsp; ❌ = Would miss

---

## Cost vs Quality — The Decision Framework

```
                    HIGH
                     │                              ● Opus+max
  Security           │                         ● Opus+high
  Audit              │                    ● Opus+medium ● Sonnet+max
  Quality            │              ● Sonnet+high
                     │         ● Sonnet+medium
                     │    ● Opus+low ● Sonnet+low
                     │ ● Haiku+any
                    LOW──────────────────────────────────────────►
                         LOW                                   HIGH
                                    Cost / Token Spend
```

**The sweet spot for most teams:**

```
80% of reviews  →  Sonnet + medium   (fast, cheap, catches real bugs)
15% of reviews  →  Opus + high       (auth changes, security-touching PRs)
 5% of reviews  →  Opus + max        (quarterly full audit, pre-launch review)
```

---

## Quick Reference Card (Print / Bookmark This)

```
┌─────────────────────────────────────────────────────────────────┐
│              WHAT TO USE FOR WHAT                                │
├─────────────────────────────────────────────────────────────────┤
│  Fixing typos / formatting          →  Haiku   + low            │
│  Daily PR review                    →  Sonnet  + medium         │
│  PR touching auth / payments        →  Sonnet  + high           │
│  New feature full review            →  Sonnet  + high           │
│  Auth module deep dive              →  Opus    + medium         │
│  Security audit (module)            →  Opus    + high           │
│  Full codebase production audit     →  Opus    + max            │
│  Financial / medical / govt system  →  Opus    + max  (always)  │
│  Pre-launch security sign-off       →  Opus    + max  (always)  │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️  NEVER use Sonnet+low for:                                   │
│     • Authentication code           • Encryption logic           │
│     • Payment processing            • PII handling               │
│     • Multi-tenant data isolation   • Session management         │
└─────────────────────────────────────────────────────────────────┘
```

---

## For the Interview — How to Explain This

> *"Model choice and effort level are independent dials that multiply each other's effect. The model sets the ceiling — how capable the reasoning engine is. Effort sets how much of that capability is actually used. A high-capability model at low effort pattern-matches against known mistakes. The same model at max effort traces full execution paths across the entire codebase, holds the architecture in working memory, and reasons about what happens when multiple systems interact — which is where the real vulnerabilities live.*
>
> *For a system handling PII, encrypted fields, and multi-tenant church data like OneFlesh, the correct choice is Opus + max for the pre-launch audit, Opus + high for all auth and security PRs, and Sonnet + medium for routine feature reviews. Using Sonnet + low for a security audit is like asking a junior developer to review authentication code during a five-minute coffee break."*

---

*Reference document · OneFlesh Architecture Series · May 2026*
