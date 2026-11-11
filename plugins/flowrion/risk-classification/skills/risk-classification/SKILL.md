---
name: risk-classification
description: "Judge how much harm the change could do if it is wrong, so the right people review it."
---

# Risk classification

Judge how much harm the change could do if it is wrong, so the right people review it.

1. Read what the change touches: authentication, payments, data deletion, migrations, infrastructure, public interfaces.
2. Consider the blast radius: one screen, one service, all users, all data.
3. Consider reversibility: a revert fixes it, or the damage stays (lost data, sent emails, published releases).
4. Propose a tier (low, medium, high, critical) with the reasons.

Inside Flowrion this is an input to the Risk Engine and can only raise the tier, never lower it.
