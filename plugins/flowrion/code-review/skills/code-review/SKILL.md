---
name: code-review
description: "Review the change as the person who will maintain it."
---

# Code review

Review the change as the person who will maintain it.

Before you read the author's summary:

1. Fix the scope: the base, the head commit and the changed files. Review the diff, not the whole codebase.
2. If there was an earlier review, start from it. Mark each earlier finding fixed (cite the file and line), not fixed, or no longer applies. A reply or a resolved thread is not evidence of a fix.
3. From the acceptance criteria and the raw diff, write two to four hypotheses of what could be wrong. Only then read the author's description, and treat its claims as leads to check, not as evidence.

Then review, in this order:

4. Acceptance criteria: each one met, with a test that asserts it. A test that only runs the code does not count.
5. Correctness: wrong conditions, missing error handling, races, off-by-one, broken edge cases. For background work such as an upload or an import, a success response is not enough: the job reaches its end state and the records are saved.
6. Safety: input validation, authorization, secrets, injection, data exposure.
7. Maintainability: naming, duplication, consistency with the surrounding code.
8. Verification: run the exact test command the tester recorded, then broader suites when the change crosses module boundaries. If you could not verify, say the change is unverified and do not call it ready.

Write each finding with the file and line (or the acceptance criterion), what is wrong, why it matters and a concrete fix, and give it a severity:

| Severity | Use it for |
|---|---|
| blocker | Wrong results, data loss, a security hole, money, a required test failing |
| major | Anything else that must be fixed before merge |
| minor | Should be fixed. Over-engineering is at most minor and never blocks on its own |
| info | A note or a later refactoring opportunity; never blocks |

A simplification that removes validation, security, data-loss protection or accessibility is not over-engineering: report the removal instead.

Give a verdict: approve only when the review is clean and verification passed; otherwise request changes with the findings that block. Push no fixes yourself unless you are asked to.

Judge the diff and the tests, not the author's description of them. Inside Flowrion the result is the `review_report` with `verdict` and `findings`.

Practices adapted from Super Board (github.com/EricTechPro/super-board, MIT licence).
