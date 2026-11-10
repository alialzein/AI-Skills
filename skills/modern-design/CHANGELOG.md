# Changelog

One dated line per lesson. Newest first. The lesson goes into the reference file; this is the index of when it arrived.

## 2026-11-10 - after the first test builds

Tested by building the same glass-dashboard brief with and without the skill, and a vague "make it modern, you choose" request twice.

- Step 0 tightened: the sample and the question lead the first reply even when the person says "you choose" or is in a hurry; one small labelled trial is allowed meanwhile. Defaults stated for when only the style is known.
- The veil shows only once the page has scrolled (at rest it washed out the ground); fixed over the column, one height.
- Bell geometry: baseline = bar height - 1, and the bar's border becomes an inset hairline, or the line floats above the edge.
- Law 7 clarified: short colour transitions on hover / focus are state feedback and allowed.
- Count-up: release the reserved width at the end; keep previous values in a store keyed by id.
- Reduced motion keeps functional animation (spinners, progress).
- RTL traps: invisible absolute elements widen the page; check `scrollWidth` in RTL; decide chart direction and digits once.
- The step-back trap: a transform on an ancestor re-anchors `position: fixed` children.
- Breakpoints stated once (768 / 1100). A small app needs no More. Tab labels under 360 px: tighten, shorten, then 11 px.
- One empty message when a chart lives inside the hero. The save bar owes the page room too.
- No reference image: the style sample plus a one-sentence pattern brief stand in.
- Headless browsers throttle frames: finish animations before stills.
- `scripts/contrast.mjs` added: worst-case ink contrast on glass over the ground and its glows.
- Assistant mark: the pick can split by place (orb for launcher and chat, sparkle in the tab bar, an animated line icon in the top bar).
- Owner taste recorded: a strong glow on the light-grey tab bar was kept over the reviewer's calmer value.
- Glint on a responsive line: not a pixel dash - a container-query reveal window (`100cqw`) with the line counter-slid inside it, transform only.

## 2026-11-10 - first edition

Written from one day of building and reviewing a glass redesign of two dashboards (admin + client), desktop and phone, EN + AR, against the owner's reference screenshots and videos.

- Step 0: the person picks a style from `assets/style-samples.html` (seven styles, light / dark, desktop + phone) before any redesign; `references/styles.md` and `references/component-library.md` cover every style and component.
- Glass: colour must sit behind the first screen; the ground scrolls with the page; secondary inks step stronger inside glass; nested glass gets no second blur.
- Shell: floating sidebar and top bar; the veil above a floating bar; bar and content share edges; 24 px of air set once; active nav row scrolled into view; rail tooltips with badges.
- Phone tab bar: the sliding bell with no measuring (`--n`, `--i`); the line is the edge; fade into corners; mask relative to the pill; layered neon; breathing must be visible; one icon family in the bar.
- Owner taste, recorded as options: dark glass in both themes vs. light-grey glass in light mode for the tab bar; animated corner art on stat tiles kept (never chart-shaped); a monochrome line glyph for the assistant inside icon rows.
- Home: a section with nothing to show does not render; greeting with name and a count only when non-zero; designed empty chart; one rule for zeros; tiles readable alone; no ellipsis in a number chip.
- Portrait cards: rows aligned by fixed slots; on a phone the whole figure beside the name, never a sliced face.
- Profile: identity header; two columns; read-only looks read-only; copy checked per audience.
- OTP: six boxes, LTR group, paste and auto-verify; enable requires passing a code.
- Motion: the where-table (fade-and-rise default, open-from-origin for cards, shared-axis slide, sheet, cascade once); one entrance per navigation; compositor-only; tokens in one place.
- Data in motion: bars grow, lines and rings draw, numbers count up and end exact; once per open and per real change.
- AI chat: header with a truthful state line, rich cards in bubbles, the work timeline, the context panel; never an invented score.
- Assistant mark: three candidates on one page, new at rest, readable at 20 px, two forms (standalone / in a row).
- Review: the hand-off contents, the eight checks, numbered requests, the owner outranks the reviewer; a cropped phone preview hides bottom bars - test before changing.
- Method: frames from a reference video without ffmpeg (serve the folder locally, seek a `<video>`, draw to a canvas, screenshot).
