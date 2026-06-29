# Eval results — production-readiness (iteration 1)

Run with the methodology in Anthropic's `skill-creator`: realistic test prompts run **with**
the skill vs a **baseline** (no skill), graded objectively, plus a trigger-accuracy eval.
Model: the session model (Claude Opus). Subagents reviewed two planted-gap sample repos.

## Trigger accuracy — `trigger-eval.json` (18 queries)
3 independent judges saw only the skill's name + description (not the answer key) and decided
trigger / no-trigger. Majority vote vs. the labels:

| Metric | Result |
|--------|--------|
| Accuracy | **100%** (18/18) |
| Precision | 100% (no false fires on near-misses) |
| Recall | 100% (caught all should-trigger) |
| Judge agreement | Unanimous on all 18 |

The tricky near-misses it correctly did **not** trigger on: a live outage (firefighting, not an
audit), "write one GitHub Actions workflow" and "set up prettier/eslint" (single-step tasks),
a definition question, a code-style PR review, a pure-function unit-test how-to, a specific
rate-limiter bug, and "postgres or mysql?". **Conclusion: the description triggers well; no
change warranted** (changing it now would risk overfitting to 18 cases).

## Quality — `evals.json` (3 prompts, with-skill vs baseline)
Objective checks for the planted gaps / expected coverage:

| Eval | With skill | Baseline | Notes |
|------|-----------|----------|-------|
| 0 · SaaS launch review (planted gaps) | 9/9 | 9/9 | Both caught all planted gaps (no CI, non-atomic write, no backoff, uncapped AI spend, untested seam, logged secret, silent catch). |
| 1 · New-project foundation | 7/7 | 7/7 | Both gave a solid prioritized Day-1 list incl. AI cost caps + data-scoping. |
| 2 · CLI scope discipline | 8/8* | 8/8 | *Grader false-alarmed on an AI mention that was actually a correct "out of scope" note. With-skill enumerated in/out-of-scope per the stack profile — more rigorous than baseline. |

### Honest takeaway
On a **frontier model, the baseline already catches the *obvious* planted gaps** — so the
skill's measured finding-delta on easy cases is ~0. That's expected (skill-creator notes
strong models handle clear cases directly). The skill's observable, repeatable value is:
1. **Consistent structure** — every review opens with a scope statement and uses the
   severity×effort table with `path:line` evidence, instead of free-form prose.
2. **Scope discipline** — it explicitly enumerates in/out-of-scope areas via the stack
   profiles (the CLI run did this; the baseline just silently omitted areas).
3. **Actionable artifacts** — it can drop `PRODUCTION-READINESS.md` + a CI starter into the
   repo, which a plain review does not.

### What I changed from these results
- **Description: unchanged** (100% trigger accuracy — no overfitting).
- **SKILL.md: strengthened "offer to act"** so the unique, baseline-beating value (writing the
  checklist + CI into the repo) reliably lands, not just a prose report.

### Recommended next iteration (to stress the long tail)
Add harder, *non-obvious* test cases where a baseline is more likely to miss — e.g. a subtle
cron-vs-manual concurrency race, a webhook with no polling fallback, an encryption-key
rotation that would orphan data, or a missing CI drift-guard on hand-maintained DB types.
That's where the skill should out-perform an unaided model.

---

# Iteration 2 — harder cases + model-tier comparison

Built one realistic billing service (`ledgerd`) that *looks* well-built (CI ✅, tests ✅,
secrets in env ✅) but hides **5 subtle structural gaps** — non-atomic/non-idempotent charge,
cron-vs-manual concurrency race, encryption-key rotation that orphans card tokens, webhook
with no polling fallback, and hand-maintained DB types already drifted from a migration — plus
**2 red herrings** (a parameterized query and a log-and-rethrow catch) to test precision. The
prompt even primed the reviewer with "I think it's in good shape."

## On a frontier model (Opus) — 2× with-skill vs 2× baseline
| Metric | With skill | Baseline |
|--------|-----------|----------|
| Recall on the 5 subtle gaps | **5.0 / 5** | **5.0 / 5** |
| Precision (red herrings not mis-flagged) | 2/2 | 2/2 |

**Tied at ceiling.** Unaided Opus catches the subtle structural gaps too. (My keyword grader
first *looked* like with-skill had better precision; on inspection that was an artifact — every
"injection"/"swallow" match was the report *clearing* the red herring as a strength, not
flagging it. Corrected: no false flags by anyone.)

## On a weaker/faster model (Haiku) — 2× with-skill vs 2× baseline
| Metric | With skill | Baseline |
|--------|-----------|----------|
| Avg recall on the 5 subtle gaps | **5.0 / 5** | **4.5 / 5** |
| Report thoroughness (chars) | ~18–24k | ~12–15k |

Here the skill earns its keep: a baseline Haiku run **missed the encryption-key-rotation gap**
(the most operational, least code-visible one) — the with-skill runs caught all five and
produced more thorough, structured reports. Small sample, but directionally what you'd expect.

## Bottom line
- **Triggering:** 100% — ship the description as-is.
- **Detection on a frontier model:** the skill ≈ matches an already-strong baseline; its value
  is **consistency, scope discipline, and turning a review into repo artifacts** (checklist +
  CI), not extra finds.
- **Detection on a weaker model:** the skill gives a **small real recall gain** on the most
  operational gaps and makes the output more complete — which is exactly where a checklist
  should help.

No skill/description changes were warranted by iteration 2 — the content that caught the gap a
baseline missed (§4 encryption-key rotation) is already in the detailed checklist. Doing
fiddly edits here would be overfitting.
