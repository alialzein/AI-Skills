<!-- Fill this in for a production-readiness review. Keep findings concrete: each one
     pairs WHY it matters with the FIX, and cites evidence as `path:line`. Sort by
     risk-per-effort (highest severity at lowest effort first). -->
# Production-Readiness Review — <project>

**Scope:** <project type, stack; which of the 14 areas apply vs. were skipped and why>
**Reviewed:** <YYYY-MM-DD> · **Verdict:** <🔴 Not launch-ready | 🟠 Launch-ready with caveats | 🟢 Solid>
<one- or two-line summary of the overall state>

## Top fixes (do these first)
| # | Sev | Effort | Finding | Why it bites | Fix | Evidence |
|---|-----|--------|---------|--------------|-----|----------|
| 1 | 🔴 | S | … | … | … | `path:line` |
| 2 | 🟠 | M | … | … | … | `path:line` |

## Findings by area
<Only include in-scope areas. Mark "✅ covered" where genuinely fine — don't pad.>

### 1. Day-1 setup
- …

### 2. Testing the seams
- 🟠 [M] …

### 4. Security & secrets
- …

### 5. External integrations & resilience
- …

### 6. Data integrity & concurrency
- …

### 7. AI / LLM
- …

<…continue for each in-scope area…>

## Strengths (keep doing)
- <what's genuinely well done — pure-core test coverage, clean security model, etc.>

## Out of scope / not applicable
- <area> — <reason, e.g. "single-user CLI, no multi-tenant data">

## Suggested next steps
1. <highest-leverage fix>
2. Drop `PRODUCTION-READINESS.md` into the repo to track the rest.
3. <scaffold CI / add the missing seam tests / etc.>
