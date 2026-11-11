---
name: task-decomposition
description: "Break the work into steps a builder can follow and a reviewer can check."
---

# Task decomposition

Break the work into steps a builder can follow and a reviewer can check.

1. Order the steps so that each leaves the code working (tests pass after every step).
2. For each step, name the files it touches and what changes in each.
3. Keep steps small: one concern each. A step that needs "and" twice is two steps.
4. Put risky or uncertain steps early, so a wrong assumption fails fast.
5. List every file the plan touches; the list is used to keep two Tasks from editing the same files at once.

Inside Flowrion the result is the `plan` with `steps` and `files`.
