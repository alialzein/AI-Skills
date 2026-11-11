---
name: architecture-planning
description: "Record the decision before the code, so that reviewers judge the approach and not only the diff."
---

# Architecture planning

Record the decision before the code, so that reviewers judge the approach and not only the diff.

1. State the decision in one sentence.
2. Give the context: the forces and constraints that make it a decision at all.
3. List the alternatives you considered, each with why it was not chosen.
4. Name the consequences: what becomes easier, what becomes harder, what you must now maintain.
5. Name what the change touches (modules, data, interfaces) and the evidence for each, with file paths.
6. Say how the decision could be reversed and what that would cost.

Inside Flowrion the result is the `decision_record` with `decision` and `alternatives` filled in.
