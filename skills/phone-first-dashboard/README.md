# `phone-first-dashboard` — skill guide

An engineering playbook for dashboards, admin panels and SaaS back offices that have to **work on a
phone** — 390 × 844, touch, English and Arabic (right-to-left). It gives Claude the phone rules, a
small kit of component roles to build every screen from, the pitfalls a real phone program already
paid for, and a **phone gate**: a Playwright check that measures every page in both languages and
fails the merge when one breaks a budget.

It was extracted from a production multi-tenant dashboard (a client dashboard and an admin panel,
English + Arabic) whose phone program took it from "4 / 10 on a phone" to a strict gate passing on
every page. Every pitfall in it broke something once.

- **Invoke:** model-invoked. It triggers when you build, change or review a dashboard / admin / SaaS
  screen (even a "desktop-only" one — every desktop page also renders on a phone), audit an app on a
  phone, work on an Arabic or Hebrew UI, or set up a phone gate. You can also force it with
  `/phone-first-dashboard`.
- **Best for:** web dashboards in any framework. The examples use React + Next.js App Router +
  Tailwind + shadcn/ui, and the stack-specific traps are marked "In Next.js:".
- **Pairs with:** [`modern-design`](../modern-design/README.md) for the visual style (glass, motion,
  the look of the tab bar). This skill is the engineering underneath: what renders where, how big,
  how it behaves, and how it is measured.
- **Not for:** marketing sites, storefronts, native apps.

## Use it

Just ask, in any project:

```
Make the orders page work properly on a phone.
```

What happens:

1. **It builds the phone variant beside the desktop**, not a shrunk desktop: rows instead of cards,
   one scrolling chip row and a filter sheet instead of stacked controls, edit forms as full-screen
   sheets with Save in the header, the page's main action pinned above the bottom bar.
2. **It avoids the known traps** — a hidden duplicate of a stateful component, a grid column that
   widens the page, a link that is 20 px tall, focus lost after a sheet closes, Arabic numbers and
   plurals done wrong.
3. **It measures**: 0 sideways overflow, 0 targets under 44 px, 0 text under 12 px, 0 duplicate ids,
   the list inside four screens, the primary action on the first screen and not covered — in English
   and Arabic.

More things to ask:

```
Audit our admin panel on a phone. What do we fix first?
Set up a phone gate in CI with Playwright for every dashboard page, English and Arabic.
This settings page is 9 screens long on a phone — fix it without losing anything.
Our Arabic dashboard shows numbers and dates wrong, and some sentences read backwards. Fix it.
Add a bottom sheet for editing a product that works on desktop as a dialog.
Why does this page scroll sideways on my iPhone?
```

## What's in here

| Path | Role |
|------|------|
| `SKILL.md` | The phone rules, the kit (component roles and their contracts), the top pitfalls in one line each, the gate's metrics and rules, acceptance, and the per-PR checklist. |
| `references/pitfalls.md` | The full list, grouped: hidden twins, layout and overflow, touch targets, fixed bottom layers and the keyboard, sheets and focus, forms, lists and tables, navigation and prefetch, streaming, honest numbers, state, the screens budget, bundle weight, plan-aware words, accessibility, testing traps. |
| `references/patterns.md` | Recipes: settings as rows and server tabs, a section of pages, a stepped wizard, a filter bar over the URL, a search that finds everything, one sheet with many doors, a floating button, a chat composer, propose-then-confirm, bulk jobs, safe writes, print. |
| `references/rtl.md` | Arabic and mixed-direction text: mirroring, digits, dates and time zones, plural forms, bidi isolation, words, charts and CSV / Excel exports. |
| `references/gate.md` | How to build the phone gate with Playwright: the metrics, a copyable `measurePage`, a runner sketch, the report, the honesty rules, sessions, verifying without a login. |
| `references/desk.md` | From `md` up: one scale, status tones, the filter panel, tables, the shell at 768, the desk gate. |
| `CHANGELOG.md` | What was learned, and when. |

Only `SKILL.md` loads when the skill triggers; the references load when the work needs them.

## Deploy it

> Repo-wide options are in the [root README](../../README.md#install). Quick paths:

**Plugin (recommended, all machines):**
```
/plugin marketplace add alialzein/AI-Skills
/plugin install ai-skills@ai-skills
```

**Single skill, by hand** — copy the whole folder, keeping the name `phone-first-dashboard`:
```bash
cp -r skills/phone-first-dashboard ~/.claude/skills/phone-first-dashboard   # macOS/Linux
# Windows: C:\Users\<you>\.claude\skills\phone-first-dashboard\
```
Or from the repo root run `./install.sh` to symlink every skill into `~/.claude/skills/`.

## A living skill

This skill is meant to grow. A dashboard round is not done until what it taught — a new kit piece, a
new pitfall, a new gate rule — is written into the right reference file with the failure it prevents,
plus one dated line in `CHANGELOG.md`. Fork it and keep your own lessons in it; pull requests with
general lessons are welcome.
