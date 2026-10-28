---
name: code-review
description: "Review the change as the person who will maintain it."
---

# Code review

Review the change as the person who will maintain it.

1. Check it against the acceptance criteria: each one met, with a test that proves it.
2. Look for correctness first: wrong conditions, missing error handling, races, off-by-one, broken edge cases.
3. Then safety: input validation, authorization, secrets, injection, data exposure.
4. Then maintainability: naming, duplication, consistency with the surrounding code.
5. Write each finding with the file and line, what is wrong, why it matters, and a concrete fix.
6. Give a verdict: approve, or request changes with the findings that block.

Judge the diff and the tests, not the author's description of them. Inside Flowrion the result is the `review_report` with `verdict` and `findings`.
