# `security-test` — skill guide

A repeatable, **safe, fully-local** security check for a product you own. No scanner, no
internet, no paid service: the repo's own security tests plus a code review against a fixed
**A–H checklist**, run against a **local throwaway database**.

- **Invoke:** model-invoked. It triggers when you ask to *"security test"*, *"pentest"*,
  *"security audit"*, *"check for vulnerabilities"* or harden a product before a release. You
  can also force it with `/security-test`.
- **Best for:** multi-tenant web apps and SaaS, especially Postgres + row-level security
  (Supabase) with a Next.js-style server. The checklist is stack-neutral; the per-product
  profile maps it to your stack.

## What it checks

| Area | Examples |
|---|---|
| **A** Access control | one tenant reading/writing another's data, logged-out access, staff exceeding their role, token links |
| **B** Database rules | RLS on every table, write policies, privileged functions, service key never in a client bundle |
| **C** Injection | SQL/shell/template injection, SSRF in server-side fetchers, path traversal |
| **D** Client-side | XSS, CSRF, open redirects, uploads served as active content |
| **E** Auth & session | token validation, reset/sign-out, OAuth state, half-finished MFA sessions |
| **F** Business logic | server-side prices, stock races, rate limits, coupon/credit caps under concurrency |
| **G** AI / LLM | prompt-injection to tools, caller identity, spend caps that fail closed, cross-tenant context |
| **H** Platform | webhook signatures, cron secrets, error leaks, cache headers, vulnerable dependencies |

Every check has a stable ID (A1, F4 …) so runs can be compared over time. The catalog ends with
**"Refinements learned from runs"** — concrete checks that real audits surfaced (atomic
claim-before-write counters, encoded path traversal, memory limiters that are not a shared cap,
pending sign-ups that can be hijacked, and more).

## The safety contract

Before anything runs, the skill confirms: local database only, no command that reaches the
linked/production project, the production env file neutralised by exported local keys, and every
money/message key blanked for any running-app check. If it cannot confirm, it stops and asks.

## Your results stay private

Product profiles, the run log and the fix-list describe your product's weak spots. The skill
keeps them **outside** this repo — by default in `~/.claude/security-test/` — and only general,
product-free lessons are written back into the catalog. Templates for all three are in
`references/`.

## What's in here

| Path | Role |
|---|---|
| `SKILL.md` | Safety contract, privacy rule, the seven-step loop. |
| `references/local-review.md` | The review procedure: local DB up, repo tests, code review per area, optional local probes, report. |
| `references/test-catalog.md` | The A–H checklist with stable IDs + refinements learned from runs. |
| `references/product-profile-template.md` | Onboarding a new product (hosts, test logins, keys to blank, commands). |
| `references/run-log-template.md` · `open-issues-template.md` | The private run log and fix-list. |
| `examples/sample-run.md` | One run, start to finish, on a fictional product. |

## Deploy it

> Repo-wide options are in the [root README](../../README.md#install). Quick paths:

**Plugin (recommended, all machines):**
```
/plugin marketplace add alialzein/AI-Skills
/plugin install ai-skills@ai-skills
```

**Single skill, by hand** — copy the whole folder keeping the name `security-test` into
`~/.claude/skills/`.

## Use it

```
Security test this project before the release.
Run the security check again on the access-control areas only (A and B).
We fixed the coupon race — re-test F4 and move it to Fixed if it holds.
Onboard this repo for security testing.
```

The first run on a project creates its private profile from the template and asks you for
anything it cannot find (test logins, which keys spend money).
