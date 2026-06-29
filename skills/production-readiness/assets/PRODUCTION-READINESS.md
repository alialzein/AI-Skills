<!--
  Drop this file into the root of the audited repo and track it in git.
  It's the team's living launch checklist. Check items off as they're truly done
  (verified in code, not just intended). Delete rows that don't apply to this project
  and note why in "Scope" so the omission is a decision, not an oversight.
-->
# Production Readiness

**Scope:** <project type — CLI / library / web app / API / AI app / mobile. Note which areas
below are N/A and why, e.g. "no RLS — single-tenant.">
**Last reviewed:** <YYYY-MM-DD> by <name>

## Blockers (must be true to launch)
- [ ] CI is green on push + PR (typecheck, lint, test, build); red blocks merge.
- [ ] Integration tests cover the seams: orchestrator, webhook handler, token refresh, key mutations / approval gate.
- [ ] Data-scoping boundary proven by a test (user A can't read user B's data). *(if multi-tenant)*
- [ ] All secrets in env/secret store; none logged or returned; encryption-key rotation decided.
- [ ] Every external call has timeout + backoff + idempotency.
- [ ] Multi-step writes are atomic; overlapping jobs take a lock.
- [ ] Every spend type metered AND capped; watchdogs on open-ended sessions. *(if it costs money)*
- [ ] Backups verified-restorable. *(if it has a datastore)*

## High
- [ ] At least one E2E that performs a write.
- [ ] Generated artifacts (DB types, clients) have a CI drift guard.
- [ ] AI: anti-invention + confirm-gate tested; eval/golden set in CI; current model IDs. *(if AI)*
- [ ] Error tracking / crash reporting wired with alerts.
- [ ] Health view + alarms on silent failures (stopped sync, lapsed subscription, hit cap).
- [ ] Own endpoints rate-limited; dependencies audited (lockfile + `audit`); config validated at boot.

## Medium
- [ ] Every screen: light + dark, loading/error/empty states, responsive, prefetch + skeleton. *(if UI)*
- [ ] Operator-tunable knobs (flags, caps, rates) live in admin/config and are honored at runtime.
- [ ] Every user-facing feature ships a user guide; marketing/advertised capabilities match reality.
- [ ] Migrations immutable; schema docs updated in the same change.
- [ ] Data export/deletion paths + retention policy in place. *(if it stores user data)*

## Sign-off
- [ ] Reviewer walked the in-scope areas against the code (not just this list).
- [ ] Top blockers have owners + dates.
- [ ] Handoff doc current; all work committed + pushed.
