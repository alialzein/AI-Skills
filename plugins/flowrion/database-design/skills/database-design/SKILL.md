---
name: database-design
description: "Shape data so that it stays correct under concurrency and change."
---

# Database design

Shape data so that it stays correct under concurrency and change.

1. Model the entities and their relationships first; name the keys and who owns each row.
2. Put invariants in the database: not null, check constraints, foreign keys, unique indexes.
3. Index for the queries you will run, and only for those; note each index's reason.
4. Decide how rows change: mutable with a version column, or append-only with new rows for corrections.
5. Consider tenancy and access: every row knows its owner, and queries filter by it.
6. Note retention: how long the data lives and how it is removed.
