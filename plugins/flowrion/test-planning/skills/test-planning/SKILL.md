---
name: test-planning
description: "Decide how the change will be proven before writing it."
---

# Test planning

Decide how the change will be proven before writing it.

1. Map each acceptance criterion to at least one test, and say which kind: unit, integration or end to end.
2. Add tests for the failure cases and the edges, not only the main path.
3. Name the fixtures and data each test needs, and how they are cleaned up.
4. Say which existing tests must keep passing and which may need to change (and why).
5. Keep tests deterministic: no real network, no sleeps, no dependence on test order.

Inside Flowrion the result is the `tests` part of the `plan`.
