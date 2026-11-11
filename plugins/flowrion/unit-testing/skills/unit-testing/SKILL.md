---
name: unit-testing
description: "Write tests that fail for the right reason and pass for the right reason."
---

# Unit testing

Write tests that fail for the right reason and pass for the right reason.

- Test behaviour through the public interface, not private details.
- One reason to fail per test; name the test after the behaviour it proves.
- Arrange, act, assert, in that order and visibly separated.
- Cover the edges: empty input, limits, errors, and the case the bug report describes.
- Assert on the acceptance criterion itself. A test that runs the code without checking its result proves nothing.
- Do not assert on your own mock, and do not compute the expected value with the code under test.
- Prove each new test can fail: break the line it guards, see it red, restore the line, see it green. For risky logic, name a small change (such as `>` to `>=`) and check that a test catches it.
- Run the tests you wrote and the existing suite before you finish; report the exact command and the result, so a reviewer can run it again.
- Never weaken an assertion or skip a test to make a build pass. If a test is wrong, say so and why.

Practices adapted from Super Board (github.com/EricTechPro/super-board, MIT licence).
