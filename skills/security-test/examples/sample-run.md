# Sample run (fictional product)

What one run looks like, start to finish. The product, findings and numbers are
invented to show the shape; a real run's log stays in your private folder.

**Product:** "Shopkeep", a multi-tenant store builder (Next.js + Supabase).
**Ask:** "Security test Shopkeep before the release."

## 1. Safety gate

- Local stack: `npx supabase start`, then `npx supabase db reset` (no `--linked`).
- Shell exports the local URL + anon + service-role keys from `supabase status`,
  so the test scripts never read the production `.env.local`.
- No dynamic probes this round, so no app is started and nothing needs declawing.

## 2. Repo tests, pointed local

- `npm run test:rls` → 812 / 812 (two users on two tenants; covers A1, A2, B1, B2, B5).
- Security unit tests (`tests/unit/*security*`, `*-webhook*`, `rate-limit*`) → 96 / 96
  (covers D3, F3, H1, H2).

## 3. Code review against the catalog

| ID | Result |
|---|---|
| A6 | `updateProduct` checks membership before the write ✅ · `archiveCategory` writes with no membership check ❌ (RLS still blocks it — defence in depth missing) |
| F1 | Checkout recomputes prices from the DB ✅ |
| F4 | Coupon use counter is incremented after the order, not claimed before it ❌ — two parallel orders both get a single-use coupon |
| G3 | AI calls go through one metered wrapper that fails closed ✅ |
| H5 | Framework on a patched release ✅ |

## 4. Verify before reporting

- F4: a local script fires 10 parallel checkouts with a `max_uses = 1` coupon → 3 succeed.
  CONFIRMED.
- A6: RLS refuses the cross-tenant archive in the local DB, so the risk is a future policy
  change. CONFIRMED in code, LOW.

## 5. Report (most severe first)

1. **MEDIUM · F4** — coupon cap overshoots under concurrency. Fix: claim the use before the
   order with `update … set used = used + 1 where used < max_uses returning …`; give it back
   if the order fails. Test: 10 parallel claims at a cap of 1 → exactly 1 wins.
2. **LOW · A6** — `archiveCategory` relies on RLS alone. Fix: add the membership check.

Not tested this run: A3, A4, A9, C3, D1, D4, E1–E4 (no running app). Next run: dynamic probes.

## 6. Record

One block in the private `runs/LOG.md`; F4 and A6 added to the private
`runs/OPEN-ISSUES.md`. The general lesson ("claim before the write, give back on
failure") is already in the catalog's refinements, so the skill does not change.
