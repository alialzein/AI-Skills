# Product profile — TEMPLATE

Copy to `products/<name>.md` in your PRIVATE folder (default
`~/.claude/security-test/products/`) and fill in. Never commit a filled profile
to a public repo — it lists your hosts, test logins and attack surface. The profile is what makes a run
repeatable and safe for this product.

```markdown
# Product: <name>

- **Repo / path:** <where it lives>
- **Stack:** <framework, DB, auth, AI, etc.>
- **Test IDs in scope:** <e.g. A1–A9, B1–B6, F1–F4, G1–G4, H1–H4> and why any are out.

## Hosts the agent must use
<how the app routes requests, and the exact hosts/Host headers for a local run,
e.g. the admin host, the client host, a couple of tenant hosts.>

## Test logins
<seed or throwaway accounts — at least TWO non-admin accounts on different
tenants/orgs (needed to prove cross-account access) plus one admin. Local seed
passwords only; never real credentials.>

## Set up (declawed local/staging copy)
1. <throwaway checkout / worktree>
2. <local DB reset to seed>
3. <copy env, then EMPTY every money/message key — list them>
4. <empty any DB table that overrides env with a real key>
5. <start the app bound so the sandbox can reach it>

## Confirm declaw (RULE ZERO gate — all must be true before scanning)
- [ ] Target host is local/staging, not production
- [ ] <money/message keys empty in the env copy AND the DB>
- [ ] <using a throwaway DB, not the production project>

## Review commands
<the exact commands for THIS product: bring up the local DB, export the local
keys, run the repo's own security tests (e.g. the RLS suite), and run its unit
security tests. See references/local-review.md for the general method.>

## Dynamic probe focus (optional)
<if probing a running local copy by hand: test logins, in-scope hosts/paths,
out-of-scope paths, and the catalog IDs that matter most for this product.>

## Known-safe / expected
<things a scan may flag that are intentional, so we don't chase them — e.g. a
public endpoint that's public by design.>
```
