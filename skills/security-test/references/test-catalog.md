# Test catalog

Every area we verify, with a stable ID. Each line is an **assertion the product
must satisfy** — a run confirms it holds (code review shows the control is in
place, a dynamic probe finds no working attack, or our own test asserts it). A product profile says which IDs apply and
where; a run log records which IDs each run covered and the result.

**Never delete an ID.** Retire it with a note so old run logs still read.

Coverage column: **S** = a dynamic check confirms it (a local `curl` probe
against a running copy, or a live access-control suite like `test:rls`) · **C** = code review ·
**T** = an automated test in the product repo · **M** = a manual step or a
script we keep.

## A. Access control between accounts and roles

The highest-impact class in a multi-tenant app. "Must not" = we verify it is
not possible.

| ID | Assertion | Cover |
|---|---|---|
| A1 | One tenant must not read another tenant's data, through any id it can supply (URL, query, body, server-action payload) | S, T |
| A2 | One tenant must not create, change or delete another tenant's data | S, T |
| A3 | A logged-out visitor must not reach a logged-in page, route handler or server action | S |
| A4 | A client user must not reach admin pages or admin actions | S |
| A5 | A staff member must not exceed their role (owner-only actions, billing) | S, C |
| A6 | A server action must enforce authorization server-side, not trust that the UI hid it | S, C |
| A7 | Authorization must not live only in middleware/proxy; the destination enforces it too | S, C |
| A8 | A request must not be able to set fields it shouldn't own (tenant, role, price, status, admin flag) | S, C |
| A9 | Token links (order tracking, review, invite, magic link) must be unguessable, single-purpose, expiring, and scoped to their own tenant | S, C |

## B. Database rules (Supabase / Postgres RLS)

| ID | Assertion | Cover |
|---|---|---|
| B1 | Every table has row-level security on; nothing an anonymous caller shouldn't read is readable | C, T |
| B2 | Policies cover reads **and** writes — the write path is the one most often forgotten | C, T |
| B3 | Policies derive identity from the verified session, never from a value the client sent | C |
| B4 | Privileged DB functions check the caller and pin their schema search path | C |
| B5 | A caller holding only the public key, talking straight to the data API, stays confined by RLS | S |
| B6 | The service-role / secret key never appears in a client bundle, a response, or a log | C, M |

## C. Injection & server-side execution

| ID | Assertion | Cover |
|---|---|---|
| C1 | User input reaching the database cannot alter query structure (SQL/NoSQL) | S, C |
| C2 | User input reaching a shell, template, or deserializer cannot run code | S, C |
| C3 | Server-side fetchers (image optimizer, link preview, webhooks) cannot be steered to internal addresses (SSRF) | S, C |
| C4 | File / XML parsers reject external-entity and path-traversal input | S |

## D. Client-side

| ID | Assertion | Cover |
|---|---|---|
| D1 | User content rendered in a page cannot execute script (stored / reflected / DOM XSS) | S, C |
| D2 | State-changing requests require proof of intent from the origin (CSRF / same-origin) | S, C |
| D3 | Redirect targets and "next" parameters are validated against an allowlist (open redirect) | S, C, T |
| D4 | Uploaded files cannot be served back as active content (HTML/SVG) in a way that runs | S, C |

## E. Authentication & session

| ID | Assertion | Cover |
|---|---|---|
| E1 | Sessions/JWTs are validated for issuer/audience/expiry on every protected route | S, C |
| E2 | Login, password reset and sign-out behave safely (no fixation, no reuse, proper invalidation) | S |
| E3 | Auth callbacks and OAuth flows carry the expected state/nonce and reject tampering | S, C |
| E4 | **A pending session = anon.** With a second step (a sign-in code, MFA), a session that has the password but has not passed the second step reads and writes exactly what an anonymous visitor can — on the app's pages, in every server action and route, AND straight on the data API with its own token (RLS); `aal2` from the auth server alone is not "passed" | S, C, T |

## F. Business logic & abuse

| ID | Assertion | Cover |
|---|---|---|
| F1 | Price, quantity, totals and discounts are recomputed server-side; a client cannot dictate them | S, C |
| F2 | Stock and orders are consistent under concurrent requests (no oversell via races) | S, C |
| F3 | Anonymous write endpoints are rate-limited and honeypotted (checkout, contact, reviews, tracking) | S, C, T |
| F4 | Coupons, loyalty, gifts and credits cannot be redeemed beyond their rules | S, C, T |

## G. AI / LLM features

| ID | Assertion | Cover |
|---|---|---|
| G1 | Untrusted input (user text, retrieved content, tool results) cannot make the model take actions outside policy | S, C |
| G2 | AI features run with the caller's identity and scope, not a broader shared one | C |
| G3 | AI usage is metered and budget-capped per user/tenant; a caller cannot run up unbounded spend | S, C, T |
| G4 | One user's or tenant's content/context does not leak into another's AI response | S, C |

## H. Platform & exposure

| ID | Assertion | Cover |
|---|---|---|
| H1 | Webhooks verify their signature and fail closed when the secret is unset | C, T |
| H2 | Cron / internal endpoints require their shared secret | C, T |
| H3 | Responses and error pages don't leak internal ids, stack traces, or admin-only fields | S, C |
| H4 | Security headers and cache rules keep user-specific responses out of any shared cache | S, C |
| H5 | Dependencies and the framework are on a release without a known relevant advisory | C, M |

---

### How a run uses this

A run picks the IDs in scope from the product profile, works through the review
in `local-review.md` (repo tests + code review + optional local probes), and
records in `runs/LOG.md` which IDs it actually exercised and whether each held.
An ID with no coverage in a run is "not tested", not "passed".

---

## Refinements learned from runs

Specific checks that real runs surfaced — fold these into the review for ANY
project. Append here; never renumber the IDs above.

- **B / C1 — a path column the service role later SIGNS must be fenced in the database, not only
  in the action** (learned from a real audit): RLS let a member PATCH their own row's vault path
  to another tenant's object, and the public page signed it with the service role. Check every
  `*_path` / `*_url` column a privileged reader resolves: a CHECK tying it to the row's own tenant
  folder, AND a signer that takes the tenant and refuses other folders. Add it as a cleaning
  migration (quarantine then validate), never `NOT VALID` (later updates of a bad row would fail).
- **E — a pending sign-up must not be replaceable by a new anonymous request carrying its own
  password**: the inbox's owner would confirm an account whose password the requester knows.
  Re-send instead — and NEVER delete or re-create the auth user on an
  anonymous request: a check-then-delete races the owner's confirmation (a confirmed account gets
  deleted) and a delete-before-create leaves no working link when a later step fails. Keep the
  identity: set an unknown password (on Supabase, the admin password update also kills the old
  confirmation token), then generate a fresh link for the same user. Failure-inject every step
  (link, row write, e-mail, a confirm in between); probe "second request for a pending e-mail" in
  every sign-up flow.
- **B / C1 — a storage path guard must refuse ENCODED traversal too**: `%2e%2e`, `%2f`,
  backslashes, `//`, `/.`, `?`, `#`, control characters — the signer's URL is not encoded and a
  decoding / normalising proxy could walk out of the folder. Same rule in TS and SQL (one
  immutable function the CHECK calls). A cleaning migration locks its tables (SHARE ROW EXCLUSIVE)
  before the quarantine copy, so a concurrent write cannot be cleared unquarantined.
- **G — a DB-backed limiter that falls back to memory on a DB error is NOT a shared cap**: for an optional platform-paid call, deny unless the shared count answered (`source: "db"`).
- **G — every platform-paid AI call a member can trigger by repeating a request needs both an
  idempotency check (skip when the result exists) and a DB-backed per-tenant rate limit**:
  in-memory limits do not hold on serverless.
- **H — HSTS `includeSubDomains` on a multi-tenant host must be scoped to the platform's own
  domain** (a custom tenant domain would force https on the client's unrelated subdomains for the
  max-age); prove headers by importing the framework config in a unit test under both NODE_ENVs.

- **F4 — a usage/redemption counter must be incremented atomically with its cap
  re-checked in the SAME statement**, e.g. `update … set used_count = used_count+1
  where … and (max_uses is null or used_count < max_uses) returning …`, and the
  caller voids the benefit when no row updates. A validate-then-unconditionally-
  increment pattern lets concurrent requests overshoot the cap (TOCTOU). Also ask
  whether a *per-customer* cap is needed, not just a global one.
- **G3 — a budget / credit / quota cap must fail CLOSED.** If the atomic
  check-and-hold path (RPC, lock) is unavailable, refuse or alert — never silently
  proceed without the hold, or the overspend race it prevents reopens on any blip.
- **D3 / E3 — a post-auth redirect must use the STRICTEST same-origin helper for
  its destination surface** (e.g. constrain dashboard flows to `/dashboard/*`), not
  just a generic same-origin check. Recovery/invite `next` params are a common gap.
- **E2 — OTP / verification endpoints should allow-list the expected `type`
  values** rather than passing a query param straight into the verify call.
- **C3 — prefer ONE canonical SSRF guard** (a single `safeFetch`) for every
  server-side fetch of an externally-influenced URL; a second bespoke allow-list is
  a maintenance/drift risk even when currently correct.
- **D4 / H — confirm the object-storage bucket sets `X-Content-Type-Options:
  nosniff` and `Content-Disposition: attachment`** on served user uploads, as
  defense-in-depth even when active-content (SVG/HTML) uploads are blocked at write.
- **B — verify RLS enablement by table NAME across ALL migrations**, allowing for
  whitespace/formatting variants in the `enable row level security` statement; a
  table's RLS may be enabled in a later migration than its `create table`. A
  *missing* write policy is fail-closed (default-deny); the real risk is an
  *over-permissive* policy (`using(true)` / `with check(true)`) or RLS left off.
- **Definitive RLS check is a live DB:** the static migration sweep can miss a
  policy an author forgot to enumerate in a guard loop. Run the access-control suite against a
  built local DB (or `select * from pg_policies`) to confirm.
- **F4 (fix pattern) — when the counter sits AFTER the write it guards,
  move it BEFORE: claim → write → give back on refusal/throw.** Counting after the
  order means a lost race still got the discount. The claim must re-check every
  condition the validate step checked (active, not expired, under the cap), not
  only the cap. Test it live: N parallel claims at a cap of 1 → exactly 1 wins
  (a unit mock cannot prove a race).
- **G3 (fix check)** — when a fallback is removed to fail closed, grep the tests:
  some will have passed only BECAUSE of the fallback (no mock for the hold). Give
  them a hold that replays the real pure rules rather than deleting the case.
- **C3 (nuance)** — a fetch whose URL comes from a FIXED vendor API (e.g. Meta's
  media URL) may keep a strict host allow-list (https, vendor suffixes, redirect
  re-checked) instead of the generic SSRF guard: for that call it is stricter.
  Flag only an allow-list that is looser than the canonical guard.
- **D4 / H (managed storage)** — Supabase Storage does not send `nosniff` /
  `Content-Disposition` and they cannot be configured. Acceptable when uploads are
  served from the storage provider's own origin AND bytes are type-checked at
  write; a finding only if user uploads are ever served from the app's origin.
  Check with ONE ranged GET (`curl -r 0-0 -D -`) — HEAD hides headers there.
- **Local DB gotcha** — `supabase start` after a `stop` RESTORES the old local
  database from its backup: new migrations and seed changes do NOT run. Always
  `supabase db reset --local` before a test run on a branch with migrations.
