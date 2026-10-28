---
name: requirements-analysis
description: "Turn a request into a problem statement that someone else could build from."
---

# Requirements analysis

Turn a request into a problem statement that someone else could build from.

1. Restate the problem in one or two sentences, in the requester's terms. If you cannot, ask before going on.
2. Name the users: who has the problem, how often, and what they do today instead.
3. List what is in scope and, just as clearly, what is out of scope.
4. Write the open questions. A question that changes what gets built is blocking; mark it so and stop until it is answered.
5. Note constraints you found in the code or the request: deadlines, compatibility, data that must not change.

Inside Flowrion the result is the `discovery_brief`: `problem` and `users` are required, and blocking questions hold the Task until a person answers.
