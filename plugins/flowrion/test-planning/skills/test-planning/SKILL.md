---
name: test-planning
description: "Decide how the change will be proven before writing it."
---

# Test planning

Decide how the change will be proven before writing it.

1. Make a ledger: each acceptance criterion against the test that will assert it, at the lowest layer that can prove it (unit first, then integration, then end to end). A criterion that needs a live third party is not testable here; say how it will be checked instead.
2. For each changed input or branch, go through these edge classes and mark each one covered, a gap (with the exact value that would show it) or not applicable:
   - boundaries: the limit minus one, the limit, the limit plus one; zero, null and empty
   - money and dates: rounding, time zones, the end of a month
   - input: unicode, very long values, values a spreadsheet would run as a formula
   - volume: none, one, many, and paging
   - authorization: signed out, another user's id, the wrong role
   - error paths: every caught error and rejected promise
   - repeats and races: a double submit, a replay, two writers at once
   - interface states: loading, empty, error, disabled; an accessible name and focus
3. Rank the gaps. High: a criterion with no test at any layer, or any gap in authorization, money, security or data loss. Medium: a partly covered branch, or a missing loading, empty or error state. Low: wording and logging.
4. Plan the high gaps as tests written first, red before the code exists. List the medium and low gaps you will not write, so the reviewer sees them.
5. Name the fixtures and data each test needs, and how they are cleaned up.
6. Say which existing tests must keep passing and which may need to change (and why).
7. Keep tests deterministic: no real network, no sleeps, no dependence on test order.
8. Give the exact command that runs the new tests, so a reviewer can run it again.

Inside Flowrion the result is the `tests` part of the `plan`.

Practices adapted from Super Board (github.com/EricTechPro/super-board, MIT licence).
