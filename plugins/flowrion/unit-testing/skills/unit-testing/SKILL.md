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
- Run the tests you wrote and the existing suite before you finish; report the command and the result.
- Never weaken an assertion or skip a test to make a build pass. If a test is wrong, say so and why.
