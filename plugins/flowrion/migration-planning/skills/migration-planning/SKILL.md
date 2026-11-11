---
name: migration-planning
description: "Change a schema without stopping the service or losing data."
---

# Migration planning

Change a schema without stopping the service or losing data.

1. Prefer additive steps: add a column or table, backfill, switch readers, then remove the old one later.
2. Make each migration safe to run on a live database: avoid long locks and full-table rewrites on large tables.
3. Say how existing rows get their values, and whether the backfill runs in the migration or separately.
4. Plan the rollback for each step, or state why a step is one-way.
5. Keep migrations ordered and immutable once applied; a fix is a new migration.
