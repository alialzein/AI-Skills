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
