---
name: acceptance-criteria
description: "Write criteria a reviewer can check without asking you what you meant."
---

# Acceptance criteria

Write criteria a reviewer can check without asking you what you meant.

- One behaviour per criterion, in the form "Given ..., when ..., then ...".
- Cover the main path, the edge cases the request implies, and at least one failure case.
- Use observable results: a response code, a value on screen, a row in a table. Avoid "works", "fast", "user-friendly".
- Say what must not change (existing behaviour other users rely on).
- Number the criteria so tests and reviews can refer to them.

Inside Flowrion the result is the `spec` with `acceptance_criteria` filled in; the review checks the change against them.
