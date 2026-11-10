---
name: modern-design
description: Use when designing, building, redesigning, restyling or reviewing a dashboard, admin panel, SaaS app screen, app shell or any of its components that must look modern or premium - in any modern style (glass / glassmorphism, clean minimal, soft UI, dark neon, bento, tonal / Material You, data-dense) - a floating sidebar or top bar, a phone layout with a bottom tab bar, page-opening or chart animation, an AI chat panel, agent / profile cards, an OTP input - on desktop or phone, light and dark, LTR and RTL. Also before any redesign where the person has not yet chosen a visual style, when a first draft looks flat, generic or template-like, or when a design has to be judged against a reference image or video.
---

# Modern design

## Overview

A modern dashboard is not a style applied at the end. It is a **style the person chose from samples**, then five decisions made in order - **ground, surface, shell, data, motion** - and then a review against a reference, repeated until it holds.

**Core principle:** the first draft of every premium screen fails in the same places. This skill is the list of those places, the recipe that avoids each, and the gate that catches what slipped through.

"Modern" is seven different looks here (Aurora Glass, Clean Minimal, Soft Depth, Dark Neon, Bento Bold, Tonal, Dense Pro - `references/styles.md`), and every component is specified for all of them (`references/component-library.md`). The glass recipe is the most detailed because it is the easiest to get wrong.

Framework-neutral (plain CSS variables and markup). Works with React, Next.js, Vue, Tailwind or none. `assets/modern.css` is the working token set and recipes; copy it and rename the tokens to the project's own.

## When to use

- A dashboard / admin / client-portal screen is being built or restyled, desktop or phone.
- The person shows a reference (a screenshot, a reel, a video) and says "like this".
- Words like *glassy, premium, modern, alive, classy, neon, floating, animated* appear.
- A draft exists and reads as "cards with a blur on them".

Not for: marketing landing pages and editorial sites (different rules), or a project whose own design system forbids these looks - the project's system wins, this fills gaps.

## Step 0 - the person chooses the style, from a sample

**Before redesigning anything, show `assets/style-samples.html` and ask which style they want.** It draws the same small dashboard in all seven styles, light and dark, desktop and phone. Open it for them (a local file in their browser, or publish / serve it) - nobody can choose between words.

Then ask, as choices: the **style**, the **default theme**, **density** (comfortable / compact), the **accent**, how **lively** the motion is, and **which screens first**. Record the answers. Details and the "which style when" table: `references/styles.md`.

When only the style is known and the rest cannot be asked, use these defaults and offer each as a setting rather than a fixed decision: theme **follows the device**, density **comfortable**, accent **the brand's colour**, motion **standard**, phone tab bar **dark glass** (with the light option built into the tokens).

Run this step when:
- a redesign or a new product starts and no style has been chosen;
- the person says only "make it modern / premium / nicer".

Skip it when a style is already chosen and recorded, when the project has its own design system, or when the task is one component inside an existing look - then match what is there. If they bring their own reference, name its patterns and map it to the nearest style; the reference wins where they differ.

**The sample comes first, in the first reply, every time the step applies.** The reply is: where the sample is (path or link), your recommended style with one sentence of why, and the choices to confirm. Nothing is redesigned before they have seen it.

| The thought | What to do instead |
|-------------|--------------------|
| "They said 'you choose, I trust you'" | Recommend one style - and still show the sample and ask them to confirm or point at another. They trust you to advise, not to guess their taste |
| "There is no time, the demo is in an hour" | Showing the sample is one message. While waiting, you may make one small, reversible trial (one screen, a copy of the file) in the recommended style - and say it is a trial |
| "The current design is already style X" | Say so, show the sample anyway, and ask whether to keep X or change |
| "I cannot reach them right now" | Lead your message with the sample and the question; do not bury it under finished work or offer it "for later" |
| "It is obvious which style fits" | It is obvious to you. A wrong guess costs a full redesign; the question costs one message |

Do not start a redesign on a guess of the style.

## The order of work

1. **Read the reference first, and name what is in it.** Write the pattern names down (see `references/vocabulary.md`): the person rarely knows them, and a named pattern can be briefed, built and reviewed. For a video, pull frames (one per second, plus zooms) before judging. With no reference image - only a written brief - write the one-sentence pattern brief yourself and use the chosen style's sample as the reference.
2. **Tokens before pixels.** Colours, glass, inks, radii, shadows, durations and curves live as variables in ONE place. Every later "a bit stronger / faster" is then a one-line change.
3. **Ground, then glass.** Glass only reads over something with colour. Build the ground (a soft gradient mesh), then the surface recipe, then check text contrast on the worst point of the ground. `references/glass.md`.
4. **Shell.** Desktop: floating sidebar + glass top bar + a veil above the bar. Phone: glass top bar, floating tab bar, sheets. `references/shell-desktop.md`, `references/phone.md`.
5. **Pages and components.** Hero first, then tiles, charts, lists; designed empty states. `references/components.md`.
6. **Motion last, and on purpose.** Page opening, data waking up, one live moment. `references/motion.md`.
7. **Review like a creative director, in rounds.** `references/review.md` - side by side with the reference, both themes, both directions, phone and desktop, scrolled and at rest, zero-data and full-data. Numbered requests or "accepted". Expect two to three rounds.

## The laws

| # | Law | Why |
|---|-----|-----|
| 1 | Glass needs a ground; no ground, no glass | A translucent card over a flat page is a white card with a shadow |
| 2 | Text never sits on raw colour; inks are checked at 4.5:1 on the darkest and lightest point behind them | Glass makes contrast vary across one card |
| 3 | One blur per surface, few surfaces per screen, none animated | Blur is the most expensive thing on a cheap phone |
| 4 | A floating bar must hide what scrolls behind and above it - once the page has scrolled, not at rest | Otherwise rows show in the gap and slide out past its corners |
| 5 | One edge: bars, content and cards share left and right lines | A 20 px step on every page reads as a mistake |
| 6 | Motion never makes a page slower: it starts on the tap and runs beside the load | A dashboard is opened hundreds of times a day |
| 7 | Anything that moves, enters or loops animates only `transform` and `opacity` (plus SVG `stroke-dashoffset`); short colour changes on hover / focus / selected are fine | Everything else repaints or reflows |
| 8 | One entrance per navigation; a skeleton resolving does not play it again | The double rise is the classic way it goes wrong |
| 9 | Reduced motion means the final state, instantly | Some people, and some PCs, have animation switched off |
| 10 | Numbers are honest: an animation ends on the exact value, and no figure is invented to fill a design | A "chance of closing 88 %" with no data behind it is a lie with a progress bar |
| 11 | Empty and zero states are designed, not left over | The owner's real data is often zero on day one |
| 12 | Phone is its own layout, checked at 320 / 390 / 440, with safe areas and 44 px targets | A shrunk desktop is not a phone app |
| 13 | RTL mirrors by logical properties; digit groups and codes stay LTR | Arabic and Hebrew users are not an afterthought |
| 14 | Light and dark are both designed; neon and glow need a dark surface | A glow on white is a coloured smear |
| 15 | Decoration never looks like data | A corner flourish shaped like a bar chart gets read as one |

## Red flags - the first draft almost always has these

- White or flat cards called "glass"; the ground only shows low on the page.
- Content visible in the strip above a floating bar while scrolling.
- An active indicator clipped at the first or last item.
- A glowing line floating a few pixels above the real border (two edges).
- An empty chart with an invented axis and no message.
- Zero values styled three different ways.
- A portrait cropped at the mouth, or text laid over a face.
- A save button floating over text with no bar behind it.
- Half the desktop empty beside one narrow column.
- "Alive" motion so small nobody can see it - or so large it gets tiring.
- A label cut to "Overvi..." at 320 px.

Each has its fix in the reference files. If a draft shows three or more, go back to step 3, not forward.

## Reference map

| File | Read when |
|------|-----------|
| `assets/style-samples.html` | Step 0: show it to the person so they can pick a style |
| `references/styles.md` | The seven styles, which fits when, the choosing questions, mixing rules |
| `references/component-library.md` | Every component (buttons, inputs, tables, overlays, navigation...) with states and per-style notes |
| `references/vocabulary.md` | Naming what a reference shows; briefing someone |
| `references/glass.md` | Ground, surface recipe, contrast, performance, dark glass |
| `references/shell-desktop.md` | Floating sidebar, glass top bar, veil, search, rail |
| `references/phone.md` | Tab bar with the sliding neon bell, top bar, sheets, More, hero |
| `references/components.md` | Tiles, charts, empty states, portrait cards, profile, OTP, AI chat, AI mark |
| `references/motion.md` | Page opening, data in motion, live moments, tokens, code |
| `references/review.md` | Reviewing a draft; the checklist and how to write requests |
| `assets/modern.css` | Tokens and recipes to copy |
| `scripts/contrast.mjs` | Checking inks on glass: `node scripts/contrast.mjs spec.json` (worst-case contrast over the ground and its glows) |
| `CHANGELOG.md` | What was learned when |

## A living skill

This skill is updated every time design work teaches something. A round is not finished until:

1. the new rule, recipe or pitfall is written into the right reference file (with the failure it prevents - not the story of the day);
2. the red-flag list gains the symptom if a draft showed a new one;
3. `CHANGELOG.md` gets one dated line;
4. a decision the person made against the skill's advice is recorded as an *option*, not deleted - their taste is data.

Refresh it from current work now and then (platform design guidelines, WCAG, Core Web Vitals, award sites) - styles date quickly; the laws above do not.

To share: send the whole `modern-design` folder; it goes in `~/.claude/skills/` (or a project's `.claude/skills/`).
