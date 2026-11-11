# Open issues — TEMPLATE

Copy to your PRIVATE folder as `runs/OPEN-ISSUES.md` (default
`~/.claude/security-test/runs/OPEN-ISSUES.md`). **This file is a map of your
product's unfixed weaknesses — never commit it to a public repo.**

Issues found by security-test runs, fixed later through the product's normal PR
flow. Move an item to **Fixed** once a PR lands AND a re-run confirms the control
holds. Severity: HIGH / MEDIUM / LOW; mark each CONFIRMED (exercised) or
SUSPECTED (read in code, not exercised).

```markdown
## Open

### <product>

- [ ] **<id> · <one-line title>** — <where (file:line / table / route)>, <how it
  is reached>, <the smallest root-cause fix>. <SEVERITY>, <CONFIRMED|SUSPECTED>.

## Fixed

- [x] **<id> (<date>, PR #<n>)** <what changed> — <the proof: test name or re-run>.

### Reviewed — no change (accepted, with the reason)

- **<id>** <why it is intentional / out of scope>.
```
