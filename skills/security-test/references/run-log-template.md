# Run log — TEMPLATE

Copy to your PRIVATE folder as `runs/LOG.md` (default
`~/.claude/security-test/runs/LOG.md`). Never commit it to a public repo.

Newest first. One block per run:

```markdown
## <date> — <product> — <what this run was: full check / fix round / pre-release>
- Test IDs covered: <e.g. A1 A2 A3 A6 B5 F1 F2>
- Repo tests run: <e.g. access-control suite 1062/1062 on a LOCAL db reset; security unit tests 133/133>
- Findings: <count by severity, or "none">
  - <id/title> → <real? fixed in PR #? / false positive / accepted, with the reason>
- Notes: <coverage caveats, what was NOT tested, what to do next>
```

An ID with no coverage in a run is "not tested", not "passed".
