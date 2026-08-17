# Contributing to bpal-premises-support

This skill is a shared case library. Premises clients run identical stacks in isolation, so
every fault one of us solves will reappear on another client — a well-written case turns the
next occurrence into a 10-minute fix. These rules exist to keep the library accurate as it
grows. PRs go to `alialzein/AI-Skills`; review is auto-requested via CODEOWNERS.

## The golden rule — SKILL.md is an index, not a document

`SKILL.md` is loaded into the AI's context every time the skill triggers. Every line in it
costs attention on *every* task. The reference files load only on demand.

- **A new case = exactly one row** in SKILL.md's "Known recurring faults" table
  (symptom → cause, ending with "— Case N") **+ a full entry** in `reference/case-library.md`.
- Method detail, queries, and scripts go in `reference/` — never prose in SKILL.md.
- If SKILL.md approaches ~250 lines, trim before adding. Tighten, don't append.

## Case template (copy into `reference/case-library.md`)

```markdown
## Case N — <short name in symptom language>

**Presents as:** <exactly what the operator sees — error text verbatim, UI behavior,
timing ("started the moment the client was cut over"). Write it the way someone would
search for it, not as a diagnosis.>

**Method:** <how the cause was narrowed, step by step, with the evidence at each step.
Include the discriminating observation — e.g. "same sender: 5 attachments before the
cutover, 0 after" — that separated this cause from the plausible alternatives.>

**Root cause:** <the mechanism, not the category. "Working folder C:\TempEmails missing"
— not "a configuration issue".>

**Fix:** <exact commands / SQL / paths. State what to verify afterward and what
"fixed" looks like in the data.>

**Corrections / dead ends:** <theories held and later disproved, and what disproved
them. Keep these — they stop the next person from following the same wrong trail.
Omit the section only if there genuinely were none.>

**Verified:** <date, client placeholder (Contoso/Acme), product version if known>
```

Three rules that keep entries useful:

1. **"Presents as" is symptom language.** The future reader has a symptom, not a diagnosis.
2. **Evidence over narrative.** Numbers, verbatim (sanitized) error text, before/after
   comparisons. "Slow" is not evidence; "PLE 60s, 47M-row unindexed COUNT" is.
3. **Keep the dead ends.** The corrections section is often the most valuable part of a
   case (see Case 7). Teams that delete their wrong turns repeat them.

## Sanitization — public repo, non-negotiable

- Client names → `Contoso` / `Acme`. No real server IPs, client domains, email addresses,
  credentials, or connection strings — ever, including in "before" examples.
- Sanitize **before the first commit**, not before the PR — your fork's history is public too.
- Product-generic names (`MontyHolding.Billing.*`, `BillingWeb`, table names) are fine.

## The loop — skill-first, contribute-back

1. **Incident starts** → let Claude load this skill and check the known-faults table
   *before* theorising.
2. **Incident ends** → ask one question: *was this in the library?*
   - **No** → PR a new case using the template above.
   - **Yes, but the entry was wrong or incomplete** → PR the correction. Corrections
     count as much as new cases.
3. Branch → PR → review → merge → everyone pulls.

## Keeping your local skill in sync

Make your local skill *be* the repo instead of a copy of it — then `git pull` updates the
skill and any local edit shows up in `git status` as a PR candidate instead of being lost:

```powershell
git clone https://github.com/<you>/AI-Skills.git C:\src\AI-Skills
Remove-Item "$env:USERPROFILE\.claude\skills\bpal-premises-support" -Recurse -Force  # if a copy exists
cmd /c mklink /J "%USERPROFILE%\.claude\skills\bpal-premises-support" "C:\src\AI-Skills\skills\bpal-premises-support"
```
