---
name: performance-evaluation
description: "Check that the change does not make the system slower or costlier than it must be."
---

# Performance evaluation

Check that the change does not make the system slower or costlier than it must be.

1. Name the hot paths the change touches and how often they run.
2. Look for work that grows with data: queries without indexes, N+1 queries, loops over unbounded lists.
3. Check memory and payload sizes; stream or paginate where the data can be large.
4. Measure when it matters: a before-and-after number on realistic data beats an opinion.
5. Report the finding, the evidence and the fix; mark it blocking only when users would feel it.
