---
name: database-migration-authoring
description: "Write the migration file itself."
---

# Database migration authoring

Write the migration file itself.

1. One purpose per migration, named after it, with a short header comment saying why.
2. Use the project's migration numbering and never edit a migration that has been applied anywhere.
3. Add constraints and indexes together with the columns they protect.
4. Test it on a fresh database and on a copy with realistic data; check that it runs once and only once.
5. If the migration rewrites data, make it safe to run again or guard it so it cannot run twice.
