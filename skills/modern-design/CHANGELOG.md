# Changelog

One dated line per lesson. Newest first. The lesson goes into the reference file; this is the index of when it arrived.

## 2026-11-11 - the owner's first day on the released redesign

Each from something he saw on his own screen that day.

- Content first: measure content top, navigation levels and wrapping rows; the cures as rules (one chip row for statuses + views + filters, intros behind the "i", a queue that opens where the work is, one-sentence empty card, verbs on the record) - `references/components.md`.
- Chips that navigate are links, and still answer a tap at once.
- Advice is not content: numbers first, all tips in one quiet row with hide-for-a-period; urgent things stay on the page.
- A table header has its own opaque token fill.
- The loading state above the shell has the shell's shape, held by a parity test - `references/shell-desktop.md`.
- A sidebar usage card leads with the one figure that matters most; a limit of one is not a warning.
- A chat page under the keyboard is a column with one scroller, no scroll script; prove it with a real panning viewport, then at rest and with content inserted above - `references/phone.md`.
- A personal background needs per-background band colours and tinted dark surfaces.

## 2026-11-11 - a Home hero (Wibby S-74 W3)

- Motion: a stretched-viewBox line drawn by a pathLength dash wraps under a non-scaling stroke — reveal it with a two-layer transform wipe (`references/motion.md` "Data in motion").

## 2026-11-11 - the first phone complaints after a release

From the owner's own phone the night a glass redesign went live: two splash screens, a strip of the wrong colour under the page, a bar that showed content around it, cut labels, and "not smooth".

- The spotlight tab bar: the cheap, always-there default on phones (opaque, one transform mover, strip as light source, a flaring cone, a ground scrim instead of blur, the badge in one place).
- Tap-first lighting: a pending index on pointer-down so the bar answers before the route arrives.
- Installed Android apps: the system splash IS the launch - skip the custom overlay there; the manifest's one colour is the page ground; the strip under the page comes from the manifest, not the page; installed apps refresh late.
- The first painted frame must already be the right theme (the server writes the class).
- No hydration hold on figures on phones or cold opens: the server's numbers stand.
- An edge fade on a gradient ground is a mask on the row, never a colour block.
- Review: a movement strip must come from a real interaction; keep credentials out of dev-server logs.

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
- Sheets: tabs take the tap through an open sheet; a sheet covers a floating top bar or clears it, never half; the More grid has no lonely tiles; footer icons carry labels.
- Published screenshots mask the personal datum, never the control the picture is about.
- A new page's door is a labelled row where people already look, never a bare circle or a look-alike pill.
- Review: check your own probe reads the visible layer before sending a finding back; page weight is measured against the previous build.
- Count-up, from a real build: never leave a start value standing; reserve the widest string; key the "last value" memory by router path + account; counting is opt-in per row; tiny numbers do not count; test in WebKit.
- Shell widgets: a per-account cache with a short life, invalidated only by the events that change it; one icon family, one meaning.
- Launch exits: one exit animation scheduled by a delay variable; a splash only hides loading where the shell streams early; the pace is the owner's call once the numbers are shown.
- Review: measure before dropping an effect for performance; tap targets checked by `elementFromPoint` on the label.
- "Inside" at icon size: back layer, content, front plate with a window that overlaps and clips the content.
- A "real" icon: one light, three layers, a contact shadow, static shading; pick the finish at shipping size.
- Launch screen: length set from measured time-to-content with a hard cap; decided before first paint by an attribute; once per launch; skipped under automation; native splash colour and iOS startup images; never stacked with page motion.
- Toolbar marks are judged in the toolbar at real size; a combined icon keeps its main shape at 55 % of the box or more; a badge belongs to the whole icon.
- Assistant mark: decide both forms before drawing candidates; at 16 px a thinking animation needs an accent-coloured moving part.
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
