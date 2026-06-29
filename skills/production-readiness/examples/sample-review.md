# Example output — Production-Readiness Review

> An illustration of what the skill produces. The target is a fictional repo, **"InboxPilot"**
> — a Next.js + Supabase + OpenAI SaaS that syncs a user's email and drafts replies. This
> shows the report shape, the severity ranking, and the "why + fix + evidence" style. (The
> file/line citations are illustrative.)

# Production-Readiness Review — InboxPilot

**Scope:** Multi-tenant web app / SaaS — Next.js (App Router), Supabase (Postgres + RLS),
OpenAI (completions + embeddings), Gmail API sync via webhooks + cron. All 14 areas in scope
except none excluded. AI areas (§7–8) are first-class here.
**Reviewed:** 2026-06-29 · **Verdict:** 🔴 Not launch-ready
Strong pure-logic test coverage and a clean RLS model, but the revenue-critical seams (sync,
token refresh, AI spend) are untested and uncapped — exactly where this will fail in prod.

## Top fixes (do these first)
| # | Sev | Effort | Finding | Why it bites | Fix | Evidence |
|---|-----|--------|---------|--------------|-----|----------|
| 1 | 🔴 | S | OpenAI embeddings metered but never capped | One bad import loop drains the account silently | Add a daily cap + pause check before every embed call | `lib/ai/embed.ts:21` |
| 2 | 🔴 | M | Gmail sync does delete-then-insert with no transaction | A crash mid-sync orphans half a mailbox | Wrap in a tx / atomic RPC; upsert by message-id | `lib/sync/gmail.ts:88` |
| 3 | 🟠 | M | No integration test on the sync orchestrator | A 429 mid-pagination fails the whole run unnoticed | Mock Gmail client + DB; assert cursor + idempotency + backoff | `lib/sync/gmail.ts` |
| 4 | 🟠 | S | Token refresh has no test for the refresh-failure path | Users silently stop syncing when refresh fails | Add a test that forces a 400 from the token endpoint | `lib/auth/google.ts:54` |
| 5 | 🟠 | S | No CI workflow | Nothing enforces the green-before-merge gate | Add `.github/workflows/ci.yml` (typecheck/lint/test/build) | — |

## Findings by area

### 2. Testing the seams
- 🟠 [M] **Sync orchestrator untested.** `__tests__/` imports `parseHeaders` and
  `dedupeThreads` (pure helpers) but never `syncMailbox()` — the function that actually
  fetches → transforms → persists. Mock the Gmail client + Supabase, feed a paginated
  response that returns a 429 on page 2, and assert: backoff happens, the cursor advances
  correctly, and re-running is idempotent. *This is the most valuable code in the repo and
  the least tested.* Evidence: `lib/sync/gmail.ts`, `__tests__/`.
- 🟠 [S] **Webhook handler** (`app/api/gmail/webhook/route.ts`) has no test for secret
  validation or the reject path.
- ✅ Pure helpers (parsers, thread dedupe, draft formatter) are well covered — keep it.

### 4. Security & secrets
- 🟡 [S] Gmail refresh token stored encrypted (good), but the encryption key has **no
  documented rotation path** — rotating it today would orphan every connected mailbox.
  Decide and document: re-encrypt routine, or "rotation requires reconnect". `lib/crypto.ts`.
- ✅ RLS policies scope every table by `user_id`; service key only used in server routes.

### 5. External integrations & resilience
- 🔴 see Top fix #2 (non-atomic writes).
- 🟠 [S] No `Retry-After`/backoff on Gmail calls; a 429 throws straight up. `lib/sync/gmail.ts:60`.
- 🟡 [S] Webhook present but **no polling safety net** — a missed push = silently lost mail.

### 7. AI / LLM
- 🔴 see Top fix #1 (uncapped embeddings).
- 🟠 [M] **No anti-invention/confirm gate test.** Draft replies can include fabricated
  meeting times; nothing asserts the model only uses server-seeded values, and drafts are one
  click from auto-send. Add an eval + a server-side confirm gate. `lib/ai/draft.ts:33`.
- 🟡 [S] Model ID `gpt-4` hardcoded — move to config so it's swappable without redeploy.

### 8. Cost & budget
- 🔴 Completions capped; **embeddings and (future) voice are not** — every spend type needs
  its own cap + pause, checked before spend.

### 3 / 10. CI & observability
- 🟠 [S] No CI at all (Top fix #5).
- 🟠 [M] No error tracking (Sentry-equivalent); unhandled exceptions die in Vercel logs.
- 🟡 [M] Background sync has no health view — last-run/success/duration is invisible.

### 9. Frontend & UX
- 🟡 [M] Dark mode missing on the onboarding + settings drawers (hardcoded `#fff` in
  `components/Drawer.tsx:12`). Loading skeletons missing on `/inbox`.

## Strengths (keep doing)
- Excellent pure-function test coverage; clean, enforced RLS; secrets encrypted at rest.

## Out of scope / not applicable
- None — full SaaS surface in scope.

## Suggested next steps
1. Land Top fixes #1 and #2 today — they're the data-loss / runaway-cost blockers.
2. Add the sync + token-refresh integration tests, then turn on CI so they enforce.
3. Drop `PRODUCTION-READINESS.md` into the repo and assign owners to the remaining items.
