# Detailed production-readiness checklist

The full per-area audit. Read the sections relevant to the project's
[scope profile](./stack-profiles.md); skip what doesn't apply and say so. For each item,
**verify against the code** before claiming done/missing, and report with severity + the
fix. Quick `grep` commands live in [`grep-recipes.md`](./grep-recipes.md).

## Contents
1. [Day-1 project setup](#1-day-1-project-setup)
2. [Testing — the seams, not just the cores](#2-testing--the-seams)
3. [CI/CD](#3-cicd)
4. [Security & secrets](#4-security--secrets)
5. [External integrations & resilience](#5-external-integrations--resilience)
6. [Data integrity & concurrency](#6-data-integrity--concurrency)
7. [AI / LLM features](#7-ai--llm-features)
8. [Cost & budget controls](#8-cost--budget-controls)
9. [Frontend & UX](#9-frontend--ux)
10. [Observability & ops](#10-observability--ops)
11. [Admin / operator control](#11-admin--operator-control)
12. [Docs, guides & handoff](#12-docs-guides--handoff)
13. [Migrations & schema discipline](#13-migrations--schema-discipline)
14. [Data lifecycle, privacy & backups](#14-data-lifecycle-privacy--backups)

---

## 1. Day-1 project setup
Set these up **before** features — cheap now, painful to retrofit.

- **Version control + branch/PR flow.** Feature → branch → PR → review → merge; protect the
  default branch.
- **CI from commit #1** (§3). The #1 thing fast teams skip and regret. Tests that aren't run
  automatically enforce nothing.
- **Typecheck, lint, format** wired as scripts AND in CI.
- **Test runner** wired with ≥1 real test so CI has something to run from day 1.
- **Secrets via env + a committed `.env.example`** (names only, never values). A secrets
  manager for anything beyond local dev.
- **A "source of truth" doc** for cross-session/cross-machine state (status, next, TODOs).
  On multi-machine work this lives in git — local memory doesn't travel.
- **Decide the data-integrity model early:** source of truth, who may write what, where the
  security boundary is (row-level security vs. app-layer checks).
- **Validate required config at boot.** Fail fast with a clear message on a missing env
  var/secret — don't start half-configured and crash deep in a request.

## 2. Testing — the seams
> The classic failure: 800 unit tests on pure functions, **zero** integration tests on the
> orchestrator that ships value. The pure cores rarely break; the glue does.

**Usually well-covered (keep doing):** pure/deterministic functions (parsers, formatters,
calculators, mappers); component render/interaction tests with mocks.

**Reliably MISSED (the real gaps):**
- **Integration tests for orchestrators / "god functions"** — multi-step pipelines that
  fetch → transform → persist. Mock the external client + DB, feed realistic inputs
  (including edge shapes), assert the writes, cursors, idempotency. *Usually the single most
  valuable code and the least tested.*
- **Webhook / inbound-event handlers** — signature/secret validation, accept vs. reject,
  correct attribution, the enqueue/insert.
- **External-API auth & token-refresh chains** — fresh / near-expiry (clock skew) / refresh
  rotation re-persist / refresh-failure path. Mock the token endpoint.
- **Server actions / mutation endpoints** — especially behind an approval/confirm gate.
  Assert the gate re-validates server-side and that "propose" never "executes".
- **The data-scoping boundary** — a test proving user A cannot read/write user B's rows.
  Run against a real DB if possible.
- **Failure-path tests** — malformed payloads, partial failures, retries, empty results.
- **At least one E2E that performs a WRITE**, not only read smoke tests.

*Verify:* does the test dir import the orchestrator/webhook/token/server-action files, or
only the small pure helpers? If only the helpers, the seam is untested.

## 3. CI/CD
- **CI on push + PR**: install → typecheck → lint → test → build. A red check blocks merge.
- **Build is part of CI** (catches type/import errors tests miss).
- **Drift guard for generated artifacts.** If you codegen or hand-maintain anything the app
  trusts (DB types, API clients, GraphQL schemas), add a CI step that regenerates and
  `git diff --exit-code`. *Hand-maintained DB types are a latent correctness bomb.*
- **Heavy/credentialed suites** (live-DB, E2E, AI evals) as separate jobs — gated by label
  or budget, still runnable.
- **Don't rely on "I'll run it locally."** On multi-machine work, a forgotten local run = a
  silent regression on the default branch.

## 4. Security & secrets
- **Secrets encrypted at rest**, not in plaintext tables. Reached only via trusted server
  code / privileged RPCs — never exposed to the client.
- **Never log, echo, or return secrets** — not in errors, logs, or API responses.
- **Least privilege.** The service/privileged key is used only in trusted server paths;
  user-facing code runs scoped to the user.
- **A documented rotation path for every secret.** Especially any **encryption key**:
  rotating it must not silently orphan encrypted data — ship a re-encrypt routine or
  consciously document "rotation requires re-auth/reconnect". Flag keys that must never be
  removed.
- **Row/tenant scoping at the data layer** (RLS or equivalent), not just the UI. Assume the
  client is hostile.
- **Privileged DB functions** (`SECURITY DEFINER` etc.) are narrow, audited, minimum-role.
- **Input validation** on every external boundary (webhooks, uploads, AI output).
- **Approval gates for outbound/destructive actions** (email, payments, deletes): propose →
  human confirms → execute; re-validate server-side; never trust a client "already approved".
- **Audit log** for sensitive actions.
- **Rate-limit / abuse-protect your OWN endpoints** (auth, signup, AI, send). Consuming
  external APIs politely (§5) is not the same as protecting your surface from abuse + cost.
- **Supply-chain hygiene:** commit the lockfile, run `audit` (or Dependabot/Renovate) in CI,
  avoid unpinned/abandoned deps, don't pipe untrusted scripts into the build.
- **Don't share real secrets in chat/PRs.** If one leaks, rotate it.

## 5. External integrations & resilience
For every third-party API / webhook / sync:
- **Rate-limit + transient-error backoff.** Honor `Retry-After`; exponential backoff + jitter
  on 429 and 5xx; max-attempts cap. *A 429 mid-pagination must not silently fail the run.*
- **Idempotency.** Upsert by a stable natural key so retries don't duplicate. Avoid
  delete-then-insert windows (§6).
- **Cursor/delta recovery.** Handle a lost sync cursor/deltaLink with a bounded scan-back;
  dedupe via idempotent upserts.
- **Webhook validation + a polling safety net.** Validate the shared secret; also run a
  cron/poll fallback so a missed webhook doesn't mean lost data.
- **Subscription/renewal monitoring.** A failing renewal job must *alarm*, not silently stop
  delivery for hours.
- **No bare `catch {}`** around network calls that swallows the error with no backoff, no
  log, no retryable-vs-fatal classification.
- **Timeouts** on every outbound call.

## 6. Data integrity & concurrency
- **Transactional boundaries for multi-step writes.** Any delete-then-reinsert or
  multi-table update needs a transaction (or atomic RPC) so a mid-run crash can't orphan/
  half-write rows.
- **Concurrency locks for jobs that can overlap.** Cron + a manual "run now" can race — use
  an advisory lock keyed by the resource; the loser skips/no-ops.
- **Decompose god-functions once atomic** — named steps are testable; a 220-line block is
  not. (Atomicity first, decomposition second.)
- **Migrations immutable + mirrored.** Never edit a shipped migration; regenerate types after
  every schema change (§3 drift guard).

## 7. AI / LLM features
- **Tool-calling discipline:** the model requests data via tools; the server runs the real
  (scoped) query and returns it. The model never executes side effects directly.
- **Anti-invention gate:** the model must not fabricate identifiers, emails, people, times,
  numbers. Seed allowed values server-side; reject unknown refs. Test this.
- **Confirm gate for actions:** AI proposes; human confirms; server executes. Drafts never
  auto-send.
- **Cost ledger + caps + pause for *every* spend type** — completions AND embeddings AND
  voice/realtime. A metered-but-uncapped path drains the account. *(Real incident: a realtime
  session left open ~96 min → ~$11.)*
- **Idle watchdogs** on streaming/realtime sessions so an abandoned tab can't bill forever.
- **Nothing hardcoded:** provider, model, prices, caps come from config (env → admin → user
  overlay) so you can re-route models without a redeploy.
- **An eval bank / golden set** in CI behind a budget. Score expected tool *families* +
  anti-invention + confirm-gate, not just "did it answer?". A persona/prompt edit that
  degrades behavior must fail a check, not ship invisibly.
- **Use current model IDs.** Check the provider's current lineup when building; don't
  hardcode a model that'll be deprecated. *(If this repo uses Anthropic/Claude, consult the
  `claude-api` skill for live model IDs rather than guessing.)*
- **Handle malformed AI output** — clamp/coerce/default so bad JSON never breaks the UI.
- **Cap the agent loop** (max iterations) and emit telemetry when it truncates.

## 8. Cost & budget controls
- **Meter everything that costs money** with a per-call ledger (feature, unit, cost).
- **Cap everything you meter** — daily/monthly cap + pause switch, checked *before* spend.
  Don't discover the missing guard via the bill.
- **Alert on spend anomalies**, not just record them.
- **Watchdogs/timeouts** on anything open-ended (realtime audio, long polls, streaming).

## 9. Frontend & UX
- **Light AND dark mode on every screen** — auth, onboarding, dashboards, drawers, empty
  states, new pages. Use theme tokens, never hardcoded colors. Verify both before "done".
- **Theme/locale persists** across reload and logout, applied pre-paint (no flash).
- **Navigation feels instant:** prefetch real routes; every data route has a theme-aware
  loading skeleton. No frozen screen after a click.
- **Every async surface has loading / error / empty states**, not just the happy path.
- **Responsive** (desktop + phone) and **accessible** (labels, focus, contrast, keyboard).
- **Keep server work cheap:** validate the user once per request (cache it), pass fetched
  data down instead of re-fetching, parallelize independent queries.

## 10. Observability & ops
- **Job-run telemetry / health view** for background work (sync, cron, queues): last run,
  success/failure, duration.
- **Alarms on silent failures:** a stopped sync, a lapsed subscription, a truncated agent
  loop, a hit cap — surface them, don't let them vanish.
- **Structured logging** with enough context to debug, without leaking secrets/PII.
- **No silent `catch {}`.** Classify, log, and either retry or surface.
- **Error tracking / crash reporting** (Sentry-equivalent) wired with alerts.
- **A maintenance/suspend switch** enforced centrally (middleware), not per-page.

## 11. Admin / operator control
- **Anything an operator tunes at runtime lives in an admin panel, not code or env** —
  feature flags, thresholds, rates/prices, budgets/caps, quiet-hours/schedules, tunable
  defaults, new monitors. Code-only = redeploy-to-change = wrong.
- **The running app actually honors the setting** (control + persistence + read path), and
  it's in the operator guide.
- **Pattern: ask first, then build.** When you spot a knob, propose the control + where it
  lands + how it's stored (and migration SQL if needed) before wiring it.

## 12. Docs, guides & handoff
- **Every user-facing feature ships a plain-language user guide in the same task** — what to
  enter (copyable examples), where in the app (exact path), what it changes (visible effect).
  Not "done" without it; keep guides in sync with the app (app wins).
- **Keep public/marketing surfaces in sync with reality** — don't advertise a live feature as
  "coming soon" or promise a dropped one.
- **Keep advertised capabilities in sync with actual abilities** — update UI chips,
  capability lists, voice/chat copy when the tool catalog changes.
- **Update DB/schema/route/security docs in the same task** as the change.
- **Cross-machine handoff doc** at end of session (status, next, TODOs; absolute dates).
  Commit + push WIP on a branch — stashes are local-only.

## 13. Migrations & schema discipline
- **Confirm before any schema change.** Propose the migration SQL; apply after approval.
  (Writing data into existing tables is normal; creating/altering tables, columns, indexes,
  policies, functions is not.)
- **Migrations are immutable.** New change = new migration.
- **Regenerate types** after every schema change; verify via the CI drift guard.
- **Done plans stay in place, marked done** — keep the history/lifecycle.

## 14. Data lifecycle, privacy & backups
Easy to forget until the day you need it — when it's too late.
- **Backups ON and verified-restorable.** A backup you've never restored is a hope. Know your
  point-in-time-recovery window; do a test restore once.
- **Data export + deletion paths** for a user's data (data-subject rights / "delete my
  account"). Deletion must actually remove or anonymize, not orphan.
- **A retention policy** for logs, ledgers, PII — don't keep sensitive data forever.
- **Don't log PII/secrets** (restating §10 — the most common leak).
- **Minimize what you collect and what third parties (incl. AI providers) see** — send only
  what the feature needs.
