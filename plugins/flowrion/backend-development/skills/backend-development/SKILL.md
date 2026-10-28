---
name: backend-development
description: "Change server code so that it stays correct, observable and safe."
---

# Backend development

Change server code so that it stays correct, observable and safe.

1. Validate every input at the boundary; refuse unknown or malformed data with a clear error.
2. Check authorization on every route, and decide what an unauthorized caller sees.
3. Keep a state change and its record (audit event, outbox message) in one transaction.
4. Make writes idempotent where a client or a retry may send them twice.
5. Log with structure and context, never with secrets; return errors without internals.
6. Add or update tests for each route you change, including the refused cases.
