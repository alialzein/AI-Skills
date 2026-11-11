---
name: security-test
description: Run a repeatable, SAFE, fully-local security check on a product you own. Use whenever the user asks to "security test", "pentest", "security audit", "check for vulnerabilities", or harden a product before a release. Needs NO external tool and NO internet — it uses the repo's own tests and a code review against a fixed A–H checklist (access control, database rules, injection, client-side, auth, business logic, AI/LLM, platform), run against a local throwaway database only. Holds the safety contract, the coverage checklist with stable test IDs, the per-product profile template, and how to keep a private run log and fix-list. Load it FIRST for any security-testing work.
license: Apache-2.0
metadata:
  author: alialzein
---

# Security test (your own products)

A standing, repeatable way to security-check a product you own — built on two
promises:

1. **Safe** — it can never touch production or a real database. See the Safety
   Contract below; it is the first thing to satisfy, every time.
2. **Self-contained** — it runs with your own tools only: **no internet, no paid
   scanning, no third-party service**. It is the repo's own security tests plus a
   code review against a fixed checklist, run against a **local throwaway
   database**. You can run it anytime, for free, on any project.

This is authorized testing of **your own** products only.

The examples use a Postgres + row-level-security stack (Supabase) and a
Next.js-style app, because that is where the checklist was earned. The checklist
itself (A–H) is stack-neutral; the product profile maps it to your stack.

## ⛔ SAFETY CONTRACT (non-negotiable — satisfy before anything runs)

1. **Never run against production.** Every check runs against a **local throwaway
   database** (e.g. local Supabase on `127.0.0.1:54321`/`54322`) and, for any
   dynamic check, a locally-running copy of the app. No real customer host, no
   deployed URL, no hosted database URL — ever.
2. **Never run a command that reaches the linked/production project.** For
   Supabase: forbidden are `supabase db reset --linked`, `supabase db push`, any
   `--db-url` pointing remote, and any type generation that uses `--linked`.
   Allowed (local only): `supabase start`, `supabase stop`, `supabase db reset`
   (no flag), `supabase status`. Write the equivalent list for your stack into
   the product profile.
3. **Neutralize the production env before any repo test.** Test scripts often read
   an env file (`.env.local`) that may point at **production**. Process env vars
   usually take precedence over that file, so export the local DB url + keys in
   the shell first (see `references/local-review.md`), or run from a copy that
   has no env file. Never run the access-control suite in a checkout with its
   real env file and no overrides.
4. **For any dynamic (running-app) check, declaw money and messaging.** Blank
   every key that spends money or sends a message (AI, email, SMS/WhatsApp,
   payments, domains, push) in the env copy **and** empty any DB table that
   overrides env with a real key. The product profile lists exactly which.
5. **Read before you delete or overwrite** — especially env files and temporary
   checkouts. If a worktree links shared folders (`node_modules`, caches) through
   junctions or symlinks, unlink them before deleting the tree.
6. **If you cannot confirm the above, stop and ask.** A clean run is worthless if
   it might have run against real data.

The core of this check (code review + repo tests against the local DB) is
inherently safe — it only reads source and talks to the throwaway DB.

## 🔒 Keep the results private

Product profiles, run logs and the fix-list describe **your product's weak
spots**. They never go in a public repo — including this one.

- Keep them in a private place: by default `~/.claude/security-test/products/`
  and `~/.claude/security-test/runs/` (outside any repo, and not inside a
  plugin folder, which an update replaces). A private product repo is fine too.
- Templates: `references/product-profile-template.md`,
  `references/run-log-template.md`, `references/open-issues-template.md`.
- What *does* belong in this skill: a general lesson a run taught (append it to
  "Refinements learned from runs" in `references/test-catalog.md`) — written
  without product names, file paths or anything that points at an open issue.

## The loop

1. **Pick the product** → read its profile (`products/<name>.md` in your private
   folder) for hosts, test logins, keys to blank, and the catalog IDs in scope.
   No profile yet? Create one from `references/product-profile-template.md`.
2. **Bring up the local throwaway DB** — e.g. `supabase start` then
   `supabase db reset` (local only; never `--linked`).
3. **Run the review** — `references/local-review.md`: the product's own security
   tests pointed at the local DB, plus a code review against the A–H catalog,
   plus optional local `curl` probes for the dynamic items.
4. **Verify every candidate yourself** before reporting — re-run the proof / read
   the code path. A clean result covers only what was actually exercised.
5. **Record the run** in the private `runs/LOG.md`: date, product, catalog IDs
   covered, findings. Add any real finding to the private `runs/OPEN-ISSUES.md`.
6. **Fix and re-test.** Fixes land through the product's normal PR flow
   (migrations for DB rules, server-side guards, etc.). Re-run the same checks to
   prove the issue is gone — the only reliable confirmation a fix landed; then
   move it to the Fixed section of the fix-list.
7. **Keep the skill living.** A new test, area or pitfall gets written back here
   (a catalog refinement). Never delete a catalog ID; retire it with a note.

## Files

- `references/local-review.md` — the review procedure. Start here.
- `references/test-catalog.md` — every area to check, with stable IDs (A1, B2 …),
  how each is covered, and "Refinements learned from runs".
- `references/product-profile-template.md` — onboarding a new product.
- `references/run-log-template.md`, `references/open-issues-template.md` — the
  private run log and fix-list, to copy into your private folder.
- `examples/sample-run.md` — what one run looks like, start to finish (fictional
  product).

## Model note

This skill is tool-free — it uses the repo's own tests and code review. If a
product's own tests need a local AI key or similar, the profile says so; nothing
here calls a paid external service.
