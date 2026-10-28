---
name: api-design
description: "Design an interface that callers can use correctly without reading its code."
---

# API design

Design an interface that callers can use correctly without reading its code.

1. Start from the caller: list the operations they need, not the tables you have.
2. Name resources and fields the way the rest of the API does; match its casing, pagination and error shape.
3. Define every input: type, required or optional, limits, and what happens to unknown fields.
4. Define every response, including errors, with status codes and a machine-readable error code.
5. Decide authorization per operation, and what a caller without access sees (prefer "not found" to leaking existence).
6. Plan compatibility: additive changes only for existing clients, or a new version.

Write the result as a short contract (an OpenAPI fragment or a table) before you write the handler.
