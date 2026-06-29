---
name: production-readiness
description: >-
  Engineering-rigor and production-readiness auditor for any software project
  (especially web/SaaS, APIs, and AI/LLM apps). Use this skill whenever the user
  is starting a NEW project, scaffolding, setting up CI/tests, doing a code or
  architecture review, hardening before launch, or asking things like "what am I
  missing?", "what should I test?", "is this production-ready?", "what are the
  gaps?", "review my repo", "help me ship this", or "did I forget anything?" —
  even if they don't say the words "production readiness". It hunts the things
  teams reliably forget: integration tests on the SEAMS (not just pure functions),
  CI from day one, secret handling + rotation, external-API resilience (429/5xx
  backoff, idempotency, webhooks), DB transactions + concurrency locks, AI/LLM
  cost caps + eval gating + anti-invention, theming + nav perf, observability +
  error tracking, operator/admin control, data lifecycle (backups, privacy), and
  per-feature docs. Produces a severity-ranked report and can drop a checklist +
  CI starter into the repo.
---

# Production Readiness — find what projects reliably miss

The pattern is always the same: **the pure cores get tested and the security model gets
designed, but the seams between subsystems and the automation around them get skipped** —
and that's exactly where production draws blood. Your job is to find those gaps before
users (or the bill) do.

This file is the workflow and the quick checks. The depth lives in reference files you
read **only when relevant** — don't load them all up front:

- **`references/detailed-checklist.md`** — the full 14-area audit with per-item "how to
  verify". Read the sections relevant to the project. *(Start here for a thorough review.)*
- **`references/grep-recipes.md`** — copy-paste `rg`/grep commands to find each smell fast.
- **`references/stack-profiles.md`** — which areas apply to a CLI vs SaaS vs library vs
  mobile/desktop, so you don't flag irrelevant items. Read this first when scoping.
- **`assets/PRODUCTION-READINESS.md`** — a fill-in checklist to drop into the audited repo.
- **`assets/report-template.md`** — the exact report skeleton to fill in.

## Workflow

1. **Scope first.** Identify the project type and stack (read `package.json`/manifest, the
   framework, whether there's a DB, external APIs, AI calls, a UI). Open
   `references/stack-profiles.md` and decide which of the 14 areas are *in scope*. State
   the scope in your report — skipping an irrelevant area is correct, not a gap.

2. **Pick the mode:**
   - *New project / scaffolding* → set up the Day-1 foundation (§1 in the detailed
     checklist) BEFORE features; CI and tests are cheap now, painful to retrofit.
   - *Code / architecture review* → audit the in-scope areas; use `grep-recipes.md` to
     find gaps fast; report by severity.
   - *Pre-launch hardening* → run the **Condensed checklist** below, then deep-dive any
     red item via the detailed checklist.

3. **Verify, don't assume. Code is truth.** For every item, actually check the repo —
   grep, read the test directory, open the CI config — before claiming it's present or
   missing. Cite evidence as `path:line`. Reviews and READMEs go stale; the code doesn't.

4. **Prioritize by risk-per-effort.** Lead with the cheap fixes that remove the most risk.
   Never dump every item as equally urgent.

5. **Offer to act — this is your differentiated value.** A prose review is something any
   assistant can produce; what makes this skill worth invoking is turning the review into
   artifacts the repo keeps. After reporting, proactively offer to (a) drop
   `assets/PRODUCTION-READINESS.md` into the repo as a tracked, scoped checklist with the
   findings filled in, (b) scaffold a CI workflow that runs typecheck/lint/test/build, and
   (c) write the missing seam test(s) or fix the top blockers. For any schema/infra change,
   propose first — don't apply silently.

## Severity × effort rubric

Rank every finding so the user knows what to do first.

| Severity | Meaning |
|----------|---------|
| **🔴 Blocker** | Will cause data loss, a breach, runaway cost, or silent corruption. Do not launch. |
| **🟠 High** | Real production risk (flaky seam, missing backoff, no error tracking). Fix before/just after launch. |
| **🟡 Medium** | Degrades reliability/UX/maintainability; schedule it. |
| **⚪ Low / Nit** | Polish, consistency, nice-to-have. |

Effort: **S** (<1h) · **M** (hours) · **L** (days). Sort findings by *highest severity at
lowest effort first* — a Blocker that's an S beats a High that's an L.

## Output — required report shape

Fill in `assets/report-template.md`. At minimum:

```
# Production-Readiness Review — <project>
**Scope:** <project type, stack, which areas apply / were skipped and why>
**Verdict:** <Not launch-ready | Launch-ready with caveats | Solid> — 1–2 line summary.

## Top fixes (do these first)
1. 🔴 [S] <finding> — <why it bites> — <fix> — evidence: `path:line`
2. 🟠 [M] ...

## Findings by area
### Testing the seams
- 🟠 [M] No integration test for the sync orchestrator (`src/sync.ts:40`). A 429
  mid-pagination would fail the run silently. Add a test that mocks the client + DB…
(…repeat per in-scope area; say "✅ covered" where it's genuinely fine…)

## Out of scope / not applicable
- RLS — single-user CLI, no multi-tenant data.
```

Always pair a finding with **why it matters** and **the fix** — a bare "missing X" doesn't
help. Where something is genuinely well done, say so; a review that's all red reads as noise.

## Condensed pre-launch checklist

Use for fast hardening passes. Each maps to a section in `references/detailed-checklist.md`.

- [ ] CI green on push + PR (typecheck, lint, test, build); red blocks merge.
- [ ] Integration tests on the seams: main orchestrator, webhook handler, token refresh,
      key mutations / approval gate. (Pure-function unit tests are usually fine already.)
- [ ] At least one E2E that performs a WRITE (create→appears, delete→gone).
- [ ] Data-scoping boundary proven by a test (user A can't read user B's rows).
- [ ] All secrets in env/secret store, none logged; rotation path documented;
      encryption-key rotation consciously decided.
- [ ] Every external call has timeout + backoff (honor `Retry-After`, jitter) + idempotency.
- [ ] Multi-step writes are atomic (transaction/RPC); overlapping jobs take a lock.
- [ ] Generated artifacts (DB types, API clients) have a CI drift guard (`git diff --exit-code`).
- [ ] Every spend type (completions, embeddings, voice) metered AND capped; watchdogs on
      open-ended sessions.
- [ ] AI: anti-invention + confirm-gate tested; eval/golden set in CI; current model IDs.
- [ ] Every screen: light + dark, loading/error/empty states, responsive, prefetch + skeleton.
- [ ] Operator-tunable knobs (flags, caps, rates) live in admin/config, honored at runtime.
- [ ] Every user-facing feature ships a user guide; marketing matches reality.
- [ ] Observability: job/health view + alarms on silent failures; error tracking wired.
- [ ] Backups verified-restorable; data export/deletion + retention in place.
- [ ] Own endpoints rate-limited; deps audited (lockfile + `audit`); config validated at boot.
- [ ] Handoff doc current; all work committed + pushed (stashes/local memory don't travel).

## Quick grep audit (find gaps in minutes)

Adapt to the stack; full recipes in `references/grep-recipes.md`.

- **No CI:** is there `.github/workflows/` (or equivalent)?
- **Untested seams:** do the orchestrator/webhook/token/server-action files have a matching
  test? Grep the test dir for those filenames — often there are none.
- **No backoff:** grep the integration layer for `429`, `Retry-After`, `backoff`, `retry`.
- **Non-atomic writes:** grep write paths for `transaction`/`begin`/`rpc`; look for
  delete-then-insert with no transaction.
- **No concurrency lock:** grep for `advisory_lock`/`FOR UPDATE` around overlapping jobs.
- **Uncapped spend:** is embedding/voice cost recorded but never checked against a cap?
- **Hardcoded config:** grep for literal provider/model/price/email/tenant values.
- **Silent failure:** grep for empty `catch {}` / `catch (e) {}` with no log or rethrow.
- **Theme leaks:** grep components for hardcoded hex / `#fff` / `rgb(` instead of tokens.
- **Missing skeletons:** routes that fetch server-side but have no `loading` state.

## The meta-lesson

If you remember nothing else: **the deterministic cores will be fine — spend the test and
automation budget on the seams between subsystems (sync, webhooks, auth refresh, mutations),
put a CI gate in front of them on day one, and put a cap in front of every dollar.** That's
where real systems fail, and exactly where it's tempting to skip.
