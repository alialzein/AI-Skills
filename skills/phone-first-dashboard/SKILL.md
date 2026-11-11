---
name: phone-first-dashboard
description: Use when building, changing or reviewing ANY dashboard, admin panel, back office or SaaS app screen that must work on a phone (390 × 844, touch) - lists, forms, settings, overviews, filters, sheets, tables, bottom bars - including a "desktop-only" change, because every desktop page also renders on a phone. Also for a phone audit of an existing app, for making a dashboard work in Arabic or Hebrew (RTL, bidi isolation, Arabic-Indic digits, plural forms, dates), and for building or reading a phone "gate" (an automated Playwright check of sideways overflow, tap targets, text size, field height, duplicate ids, screens-to-content and the primary action, in both languages). Covers the engineering - the rules, the component roles, the pitfalls a real phone program paid for, acceptance and a per-PR checklist; pairs with modern-design for the visual style.
license: Apache-2.0
metadata:
  author: alialzein
---

# Phone-first dashboard

## Overview

A dashboard that "works on a phone" is not a desktop page that shrinks. It is a **designed phone
variant of each list, form and overview, rendered beside the desktop markup**, built from a small
**kit** of phone pieces, and held by a **gate** that measures every page at 390 × 844 in both
languages on every change.

**Core principle:** a dashboard fails on a phone in the same few ways, over and over - a page wider
than the screen, a 30 px target, a hidden duplicate of a stateful component, a Save three screens
down, Arabic that reads backwards. This skill is the list of those failures, the rule that avoids
each, and the gate that catches what slipped through.

It was extracted from a production multi-tenant dashboard (a client dashboard and an admin panel,
English + Arabic) whose phone program took it from "4 / 10 on a phone" to a strict gate passing on
every page. Every pitfall in `references/` was paid for once.

Example stack: React + Next.js App Router + Tailwind + shadcn/ui (Radix). The rules are
stack-neutral; the "In Next.js:" notes are where that stack bites.

**Look vs engineering.** Visual style, glass, motion, the look of the tab bar and sheets:
`modern-design`. This skill: what renders, where, how big, how it behaves, and how it is measured.

## When to use

- Any new or changed screen in a dashboard / admin / back office - even one called "desktop only".
- A phone audit: "how bad is our app on a phone, and what do we fix first?"
- An Arabic or Hebrew UI: mirroring, mixed-direction text, localized digits, plurals, dates.
- Setting up, running or reading a phone gate in CI.

Not for: public marketing sites and storefronts (other budgets), native apps.

## 1. The phone rules

Phone = below the `md` breakpoint (768 px). CSS (`max-md:` / `md:hidden`) and the JS hook use the
same query.

1. **One job per screen; the primary action is pinned.** The page's main action is a pill in a
   sticky action bar above the bottom nav. Inside a sheet, Save sits in the sheet's header. No Save
   is ever more than one thumb away - and it must LOOK pressable (a filled pill, not bold text).
2. **Lists are rows, not cards.** 64-80 px: picture · title · one line of meta · a status chip ·
   a chevron. The WHOLE row is the target and opens the full detail; other columns live in the
   detail. Page at ~20 rows with the total.
3. **Filters are one scrolling chip row + a filter sheet.** Search is a 44-48 px bar. Nothing
   stacks one control per row.
4. **Edit forms are full-screen sheets** (✕ · title · Save), never a centred pop-up on a phone.
   Long forms are grouped sections, collapsed after the first.
5. **Sizes:** targets ≥ 44 px; fields ≥ 44 px; switches 44 × 26 (and mirrored in RTL); chips 32 px
   drawn; buttons may be drawn at 40 px if an invisible hit layer grows them to 44. Destructive
   verbs never sit beside the primary - they go behind ⋯, last, red, confirmed.
6. **The overview answers "how is today?" first:** a 2 × 2 number grid, then "needs you" rows, then
   the setup checklist as one collapsed row with its progress bar.
7. **A status is one tap:** the row's status chip opens a status sheet (the next step first; a
   backwards move asks first). The same sheet is the detail's pinned footer.
8. **The bottom bar always knows where you are** ("More" lights for any page not on the bar). An
   admin panel gets its own bar.
9. **Stacked-table CSS is the fallback, not the design.** Pages that matter get explicit rows; the
   stack stays for rare desk tables (logs, health) with paging.
10. **Type:** 14 px body, 12 px minimum anywhere; Arabic body ≥ 14 px; page title ~20 px, KPI
    numbers ~22 px, row titles ~15 px on a phone.

**The desktop stays as it is.** Every phone change is additive below `md`, rendered BESIDE the
desktop markup (`<div class="md:hidden">…phone…</div><div class="max-md:hidden">…desk…</div>`),
or a kit piece that is responsive by itself (one mount). Any desktop change is said out loud in the
PR and checked at 1440. Read section 3's first group before writing a `md:hidden` twin.

## 2. The kit - component roles

Build these once, early. Every page then starts at the target instead of at the audit.

| Role | Use it for | Contract highlights |
|---|---|---|
| **Responsive dialog** | every edit form / record dialog | Dialog from `md`; below, a full-height (100svh) bottom sheet with a pinned ✕ · title · primary header and its own scroller. The primary can submit a `<form id>` from the header. Chooses its surface on open and **latches** it (a resize never remounts the form). Takes `returnFocusTo`. Keeps the desk width it had. |
| **Verb dialog** | a short verb that asks first (a reason, an amount, a confirm) | Centred from `md` (Cancel · primary in the footer), a bottom sheet below (≤ 85svh, 48 px pills). No dismiss while the primary is pending. `destructive` flag. An edit FORM stays a responsive dialog. |
| **Sticky action bar + pill** | the page's primary on a phone | `md:hidden`, fixed above the bottom nav, drops to the edge when the nav hides. Renders an in-flow **spacer, so it goes LAST on the page**. Marks its pill for the gate. |
| **Phone list + row** | lists that matter | `href` → link, `onClick` → button, neither → div. Leading · title · meta · trailing · chevron. A select checkbox is its own 44 px target that never opens the row; an interactive trailing (chip, ⋯) is lifted above the row's stretched link. |
| **Chip row** | statuses / filters / views | One scrolling strip with edge fades; the active chip is scrolled into view by moving the STRIP (never `scrollIntoView`, which scrolls the page). `min-w-0`; takes a digit formatter. |
| **Tab strip** | a section's pages as tabs | One sideways row on a phone, wrapping from `md`; `aria-current="page"`; intent prefetch + a pending spinner; an unsaved-changes guard. |
| **Filter sheet** | the page's selects and dates | Trigger shows the active count. **Apply** commits a draft and closes; **Reset** clears and stays open. Keep the draft in the page. |
| **Status sheet** | one-tap status change | Statuses in pipeline order, the next one first; a backwards move asks; cancel is a red row; extra actions slot. |
| **Row-actions sheet + ⋯ trigger** | a row's or header's verbs | Regular verbs in order, a separator, destructive verbs last in red; a verb with `confirm` runs only from the question. The ⋯ is 44 px. One ⋯ per header. |
| **Number grid (KPI)** | overview figures | 2 columns, 3 from ~480 px, the caller's layout from `md`. Short labels on the phone tiles. |
| **Settings group / row** | grouped settings (iOS Settings look) | A row opens a `?section=` sub-screen with its own pinned Save and a 44 px back link. |
| **Page title** | the large title | ~20 px on a phone; collapses into the top bar on scroll. |
| **Clamp** | a long explanation | One line on a phone until tapped; the full text stays in the DOM. |
| **Disclosure** | anything a page can fold | A native closed `<details>` with a 44-48 px summary that carries the headline figures. The main tool for staying inside a screens budget. |
| **Meter** | any limit | < 80 % calm, ≥ 80 % warning, ≥ 100 % danger; a limit of 0 = paused; a failed read draws "could not read", never 0. |
| **Return-focus hook** | any controlled dialog / sheet without its own trigger | Returns the close handler that sends focus back to the opener (or `returnFocusTo`), never `<body>`. |
| **Phone hook** | JS-only decisions | `false` on the server and before mount - never branch the first paint on it; use CSS for what the server renders. |
| **Hit layer** | a small control that must stay small | A positioned `::before`/`::after` that grows the hit area to 44 px without changing the drawn size; an allow-attribute for a deliberate small target. |
| **Digits, plurals, dates** | every number and date in the UI | One count formatter (localized digits), one plural helper (all CLDR forms), one date formatter with a default time zone. See `references/rtl.md`. |

**Kit rules.** Every word is a prop (no dictionary inside the kit). Logical properties only
(`ms-`, `pe-`, `start-`, `inset-inline-*`) so RTL mirrors by itself. The pure halves (reducers, href
builders, view models) live in plain modules with unit tests. The kit and the shell are in EVERY
route's bundle: build a page-specific twist from the kit's slots, not a new kit prop. Keep a harness
page that renders every piece at 390 in both directions.

## 3. Pitfalls - the top ones

One line each; the failure, the rule and the stack notes are in `references/pitfalls.md`.

**Hidden twins**
- A `md:hidden` copy is still MOUNTED at every width: never mount a second copy of anything stateful,
  polling, fetching or effectful - hoist it once and pass the result to both branches.
- Two copies of markup repeat their `id`s: suffix per copy, or one wrapper id around both.
- No eager / priority image in a phone list - it loads, hidden, on every desktop visit.
- Phone-only server reads stream in their own Suspense; they never join the page's blocking reads.

**Layout and overflow**
- A grid with only breakpoint columns has an `auto` track below them that grows to its widest word:
  write `grid-cols-1` (= `minmax(0,1fr)`). Selects, chip rows, truncating text, dialogs - all of them.
- User text in a bubble, chip or cell gets `overflow-wrap: anywhere`; measure with the LONGEST real value.
- A row's target is the row's height, not its two text lines.

**Fixed bottom layers**
- The action bar's spacer is the page's LAST element; anything added after it slides under the pill.
- Every fixed bottom element adds its height to `scroll-padding-bottom` (WCAG 2.4.11) and tells the
  other fixed pieces (a floating button) through one hook.
- iOS keeps `position: fixed` on the layout viewport: the keyboard covers a fixed composer.

**Sheets and focus**
- Every controlled dialog returns focus to its opener; one opened from a ⋯ sheet returns to the ⋯.
- A sheet's confirm is a sibling of the sheet, not a child. A toast must not sit on a sheet's header.
- A sheet opened by an action must outlive the re-render that action causes - keep one tree.

**Forms**
- A refused primary scrolls to the problem and focuses it; a pinned pill's error at the page end is invisible.
- Send only what changed; an absent field keeps its stored value.
- `setBusy(true); await x(); setBusy(false)` freezes forever on a throw.
- 16 px text in phone inputs (iOS zooms below that).

**Navigation and data**
- Always-rendered nav lists prefetch on intent, never on sight.
- In Next.js: a same-route `?tab=` change never shows `loading.tsx` - wrap the body in a keyed Suspense.
- In Next.js: an action that revalidated already returns the new render - no `router.refresh()` after it.
- A count that failed is no number (`null`), never 0; a badge and the list it opens count the same things.

**Bundle**
- A client module never imports a value from a dictionary hub; pass words as props.

**RTL** (`references/rtl.md`)
- Logical properties; flip directional icons (not media controls); isolate Latin numbers and codes in
  Arabic sentences; one digit system per screen; plurals through CLDR forms; dates through one helper.

**Red flags - a first phone draft almost always has some of these**
- The page scrolls sideways a little at 390, or only in Arabic.
- Cards where rows belong; five selects stacked one per line; a desk table squeezed into stacked cells.
- A centred modal on a phone; Save at the end of a long form; two ⋯ menus in one header.
- A floating button or toast sitting on a row's actions or a sheet's Save.
- "0" where a count failed; Latin digits beside Arabic words; "3 order" style plurals.
- The page is fine on the demo account and breaks with a long real name or a live badge.

Three or more: go back to the kit and the rules before polishing anything.

## 4. The phone gate

A script opens every page as a phone (390 × 844, touch, reduced motion) in both languages and holds
each to a budget. Full build guide, a `measurePage` you can copy, and how to read the report:
`references/gate.md`.

| Metric | Strict budget |
|---|---|
| Sideways overflow | 0 px |
| Targets < 44 px | 0 (inline links inside a sentence are exempt) |
| Visible text < 12 px | 0 |
| Fields < 44 px | 0 |
| Duplicate ids | 0 |
| Screens (page height / viewport) | ≤ 4 for a list before paging; desk and chart pages carry their own |
| Primary | the ONE marked control is on the first screen and not covered (or the empty state shows) |

- **Budgets ratchet.** Never loosen one to pass - fix the page (usually: fold it), or say in the PR
  why the number moved.
- **Skip is not pass.** No build, a stale build, no session: report SKIPPED with the reason.
- **Which pages:** every page group the diff touched; a change to the shell, the kit or the global
  stylesheet means every group.
- **What it cannot see:** controls that only draw with live data, closed sheets and folds, long real
  values, states the test account does not have. Name each as unverified in the PR, or give the page
  its own gate entry with an account that has the state.

## 5. Acceptance - what "done" means for a phone round

- The gate, strict, on every page and every account type, both languages: 0 overflow · 0 targets
  < 44 · 0 text < 12 · 0 fields < 44 · 0 duplicate ids · lists ≤ 4 screens before paging · the
  primary on the first screen, uncovered (or the empty state showing).
- Taps-to-task: the core jobs (for example: change an order's status, edit a product with a photo,
  record a sale, approve a request) ≤ 3 taps from the home screen.
- A fresh reviewer grading with a fixed rubric: user-facing areas ≥ 8 / 10, admin ≥ 7, RTL ≥ 8.
- Desktop parity at 1440: 0 px of unintended change on the fixture pages.
- A real phone, both languages, installed as a PWA if you ship one: run the core jobs by hand.

## 6. Every dashboard PR

1. A phone variant beside the desktop (or a responsive kit piece); no hidden double mount.
2. Behaviour in pure functions with unit tests; wiring held by tests anchored to the right block.
3. Tests, typecheck, lint and the phone gate (strict, the touched groups) before the merge.
4. A click list for the reviewer at 390 × 844 in both languages (and 1440 when the desktop moved).
5. What the gate could not see, named.
6. This skill (or your fork of it) updated with what the round taught.

## 7. The desk

From `md` up the dashboard follows one desk design system; the phone rules above still hold below
`md`. Its floors (28 px targets, 11 px text, 0 overflow at 1440 / 1280 / 768), tables, filter
panel, status tones, the shell between `md` and `lg`, and how to measure it: `references/desk.md`.

## Reference map

| File | Read when |
|---|---|
| `references/pitfalls.md` | Before writing a phone twin, a sheet, a form, a fixed bar, a list or a count - the full list with the failure each prevents |
| `references/patterns.md` | Building a known shape: settings split into tabs, a stepped wizard, a filter bar over the URL, a long-running bulk job, one sheet many doors, a floating button, a chat composer, print |
| `references/rtl.md` | Any Arabic / Hebrew screen, any number, date, plural or mixed-direction string |
| `references/gate.md` | Building, running or reading the phone gate; local verification tricks |
| `references/desk.md` | A change from `md` up: scale, tables, filters, the shell at 768, the desk floors |
| `CHANGELOG.md` | What was learned when |

## A living skill

A dashboard round is not done until what it taught is written down: a new kit piece, a new
pitfall, a new gate rule - into the right reference file, with the failure it prevents (not the
story of the day), and one dated line in `CHANGELOG.md`. A lesson that is not written here is paid
for again.
