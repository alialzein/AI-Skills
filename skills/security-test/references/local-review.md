# The review procedure (local, offline)

The security check. Runs with **no external tool, no internet, no paid scanning**
— only source code, the product's own test suite, and local `curl` against a
locally-running copy. Fully safe by construction: it reads code and talks to the
**local throwaway database** only.

Satisfy the Safety Contract in `SKILL.md` first. The concrete commands for a
product live in its private profile; this file is the general method. Examples
below use Supabase — swap in your stack's equivalents.

## 0. Local DB up, production neutralized

```bash
npx supabase start          # local containers only — never touches production
npx supabase db reset       # NO --linked flag — resets the LOCAL db to seed
npx supabase status         # note the local URL (127.0.0.1:54321) + keys
```

Export the **local** DB url + keys in the shell so the test scripts can't fall
through to a production `.env.local` (process env wins over the file):

```bash
export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="<local anon key from supabase status>"
export SUPABASE_SERVICE_ROLE_KEY="<local service_role key from supabase status>"
```

## 1. Run the product's own security tests (pointed local)

These are the strongest, cheapest signal — real assertions, already written.

- **RLS / access control** — the repo's cross-tenant test suite (e.g.
  `npm run test:rls`). It creates two separate users on two tenants and asserts
  one cannot read/write the other. With the local env exported above it runs
  against the throwaway DB. This is the authoritative oracle for catalog **A1,
  A2** and the **B** series.
- **Security unit tests** — the repo's security-focused unit tests (e.g.
  the `security`, `auth-surface`, `*-anon-*`, `rate-limit`, `token`, `*-webhook*`
  tests under `tests/unit/`). These cover **D3, F3, F4, H1, A9, B**.

Record which catalog IDs these covered and whether they passed.

## 2. Code review against the catalog

For every catalog ID marked **C**, read the code path and confirm the assertion
holds. This is a read-only audit — no execution, no risk. Work the list:

- **Access control (A):** for each server action / route handler / page, trace
  that it (a) checks the session, (b) checks membership/role for the specific
  tenant or resource, not just "logged in", and (c) derives identity from the
  session, never from a field in the request body. Flag any mutating export that
  reaches a write without an authorize call in its own body or a helper it
  delegates to. Confirm admin paths check the super-admin flag.
- **DB rules (B):** read the migrations / policies. Every table has RLS on;
  policies cover INSERT/UPDATE/DELETE as well as SELECT; they use the verified
  identity, not a client-sent column; `SECURITY DEFINER` functions check the
  caller and pin `search_path`. Confirm the service-role key is only imported in
  server-only modules, never in anything bundled to the client.
- **Injection / SSRF (C):** find every place user input reaches a query, a
  shell, a template, a deserializer, or an outbound fetch (image optimizer, link
  preview, webhook sender). Confirm parameterization / allowlisting.
- **Client-side (D):** confirm user content is escaped where rendered; redirect
  / "next" params are allowlisted (there's usually a `safeNext`-style helper —
  read it); uploads can't be served as active content.
- **Business logic (F):** confirm price/qty/totals are recomputed server-side;
  stock mutations go through an atomic path (a transactional RPC) so concurrent
  orders can't oversell; coupon/loyalty/gift redemption is enforced server-side.
- **AI (G):** confirm AI features run with the caller's identity and are metered
  / budget-capped; untrusted text can't be fed to a tool that acts without the
  caller's authority; no cross-tenant context bleed.
- **Platform (H):** webhooks verify a signature and fail closed when the secret
  is unset; cron/internal routes require their shared secret; error responses
  don't leak internal ids or stack traces; check the framework + key deps against
  known advisories for the pinned versions.

Use the repo's structure (routes, `lib/actions/**`, `supabase/migrations/**`) and
grep for the authorize/guard helper names. The product profile lists them.

## 3. Local dynamic probes (optional)

For dynamic items you want to *see* rather than read, run the app locally
(declawed per the Safety Contract — see the profile) and probe with `curl`
against `localhost`, sending the Host header the app routes on. Examples of what
to check by hand (adapt per product; keep probes read-only or against seed data
only):

- A protected route handler with no session cookie → expect 401/403/redirect
  (A3, A4).
- The public data API with only the anon key, asking for another tenant's rows →
  expect RLS to return nothing (B5).
- A token link with a tweaked/again-used token → expect rejection (A9).
- A webhook endpoint with no/forged signature → expect 401 and no side effect (H1).

Never fire destructive or money/message actions; the declaw removes the keys, but
keep probes to reads and seed data regardless.

## 4. Report & record

Write the run into your private `runs/LOG.md`: the catalog IDs covered in steps 1–3, pass/fail,
and any finding (with the file:line or the failing test). An ID not exercised is
"not tested", not "passed". Hand the user the findings, most-severe first, each
with where it is and the smallest root-cause fix.

## Teardown (safe)

`npx supabase stop` leaves the local containers; `supabase stop --no-backup` or a
later `db reset` clears state. If you made a throwaway checkout that links shared
folders (`node_modules`, build caches) by junction or symlink, unlink them
**before** deleting it, or the delete follows the link.
Unset the exported env vars (close the shell) so nothing lingers.
