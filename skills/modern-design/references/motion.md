# Motion - on purpose, never in the way

A dashboard is opened hundreds of times a day. Motion earns its place when it (a) shows where something came from, (b) shows that data is alive, or (c) confirms an action. Everything else is noise.

## Tokens (one place)

```css
:root {
  --md-dur-fast: 120ms;    /* exits, colour changes */
  --md-dur-base: 220ms;    /* page fade-and-rise */
  --md-dur-slide: 260ms;   /* shared-axis slide */
  --md-dur-open: 360ms;    /* open-from-origin, sheets */
  --md-dur-data: 520ms;    /* bars, rings, count-up */
  --md-ease-out: cubic-bezier(.2,.8,.2,1);
  --md-ease-spring: cubic-bezier(.16,1,.3,1);
}
```

Nothing a person waits on runs longer than about a third of a second. Data may take half a second because nobody is waiting on it.

## Page opening - which motion where

| Where | Motion | Numbers |
|-------|--------|---------|
| Every menu / tab click | **Fade and rise** | in: opacity 0->1, translateY 10 px->0, 220 ms ease-out. out (optional): the old content fades in 90 ms **while** the new one enters - it never runs first; skip it if the framework cannot overlap the two |
| Opening a card (a person, a product, an order, an agent) | **Open from origin** | 360-380 ms spring; destination grows from the pressed item's rectangle; the page behind eases to scale .97 |
| List -> detail, and Back | **Shared-axis slide** | 36 px on the inline axis + fade; 260 in / 200 out; Back reverses; multiply by a direction variable for RTL |
| Phone forms and quick actions | **Sheet from below** | 340 ms spring; page behind to scale .94 and dimmed |
| The home screen, first load of a session | **Cascade** | greeting, then tiles, then lower cards; 45 ms apart; each 240 ms fade + 14 px rise; once per session |
| Dialogs only, if free | Blur-to-sharp | Never as a page default - blur is the heaviest effect |

Default to fade-and-rise. The others are accents: if every click zooms or cascades, it is tiring by lunchtime.

## Rules

1. **Never delay navigation.** The transition starts on the tap and runs beside the fetch. Nothing waits for an animation to end.
2. **One entrance per navigation.** If a skeleton enters with the rise, the real content replacing it only cross-fades. Streamed sections inside a page fade; they do not rise.
3. **Compositor only:** `transform`, `opacity`, and SVG `stroke-dashoffset` for anything that moves, enters or loops. Never height, top, margin, `filter`, `backdrop-filter`, `box-shadow`. `will-change` only while animating. *Allowed and not a finding:* short `color` / `background-color` / `border-color` transitions (<= 150 ms) on hover, focus and selected states - that is state feedback, not movement.
4. **The shell stays still.** Sidebar, top bar and tab bar do not move; only the content area does.
5. **Interruptible.** A second click mid-transition starts the new one from the current state - no queue, no flash of the old page.
6. **Scroll.** A new page starts at the top before it enters; Back restores scroll without a visible jump.
7. **Reduced motion:** the final state at once (an opacity cross-fade under 100 ms is acceptable). Remove decorative motion only - a loading spinner or a progress bar keeps running, because it carries information; never a blanket `* { animation: none }`. Tell the person how to see the motion if their own machine has animations off - otherwise they will report "it does not move".
8. **Scope.** Dashboard chrome only; public pages have their own performance rules.
9. **Cost.** CSS first. The View Transitions API for open-from-origin and slides where supported, falling back to fade-and-rise. A motion library only where neither can do it, and never in the shared chunk.

## Data in motion

Charts and numbers appearing already-drawn is the biggest gap between an ordinary dashboard and a striking one.

- **Bars** grow from the baseline: `transform: scaleY()` with `transform-origin: bottom`, 450-550 ms, 30-40 ms stagger. The current period's bar is brighter (a static glow is fine; an animated one is not).
- **Lines and rings** draw on: `stroke-dasharray` = path length, animate `stroke-dashoffset` to its end value.
  - A line on a **stretched viewBox** (`preserveAspectRatio="none"`) keeps an even stroke only with `vector-effect: non-scaling-stroke` — and then a unit `pathLength` dash is measured in the wrong space and WRAPS (a piece of the line shows at the far end before the draw starts; seen in Chromium). Uncover it instead with a **two-layer wipe**: an `overflow: hidden` box slides in from the start edge (`translateX(-100%) → 0`) while its child slides the other way by the same amount (`translateX(100%) → 0`), so the line stands still while it is revealed; mirror the sign for RTL. Transform only, works on any stroke.
- **Numbers** count up, 500-700 ms, eased, **ending exactly** on the value, formatted by the same formatter as the static number.
- On a **period switch** (Today / Week / Month) values count from the old number to the new and bars re-grow.
- **Once per open and once per real change.** Not on re-render, not when a tab regains focus.

Count-up that is honest and accessible:

```js
// The final value is in the HTML from the server; JS only animates the visible text.
const lastValue = new Map();                         // keyed by a stable id: survives a full re-render
function countUp(el, id, to, format, ms = 600) {
  const from = lastValue.get(id) ?? 0;
  lastValue.set(id, to);
  if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = format(to); return; }
  const t0 = performance.now();
  el.setAttribute('aria-hidden', 'true');            // a sibling visually-hidden span holds the real value
  el.style.minWidth = el.offsetWidth + 'px';         // reserve the final width: no layout shift
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
    el.textContent = format(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(tick);
    else { el.textContent = format(to); el.style.minWidth = ''; }   // end exact; release the reserved width
  };
  requestAnimationFrame(tick);
}
```

Three traps found building this for real:
- **A frozen start value.** If something heavy blocks the page just as a count begins, a painted "0" (or any start value) can sit there for a second and read as the real figure. A count from zero stays blank until the number actually moves; if nothing has moved within ~250 ms, show the final at once. Never paint a value the data never had and leave it standing.
- **A count can pass through a wider string than its end** ("$99,999" on the way to "$250K" when the formatter shortens large numbers). Reserve the widest string the count will show, or count in the final's unit.
- **Sweep and draw order must match.** A ring that sweeps clockwise from 12 o'clock needs its slices laid clockwise from 12 too, or the first slice shows in two pieces mid-sweep.

- **"Continue from the last value" must be keyed by the right identity.** A memory keyed by the browser address read during render can hand one account's figure to another's tile during an in-app navigation (the address updates at commit, later than the render). Key it by the router's own path plus the account, and prove A -> B -> A frame by frame.
- **Counting is opt-in per row, never a default of a shared tile.** If only the money tiles of a row count, half the row moves and it looks broken: a row counts as a whole or not at all.
- **Tiny whole numbers do not count.** 0 -> 2 shows "1" for most of the animation; when a whole number moves by less than about 5, just show it.
- **Test in WebKit,** not only Chromium - SVG masks and dash animations are where they differ, and many owners are on iPhones.
- Values hidden until hydration get a short deadline (well under a second) after which the static figure shows; a throw, a failed lazy load or a print mid-count always ends on the final.
- **On a phone, and on any cold open, a hard load never hides the server's figures.** A "hold the number hidden so it can count" window (even 700 ms) means every fresh load of a dashboard shows empty tiles and an empty ring first, and on a slow phone hydration usually misses the window anyway. Below the tablet breakpoint, or when the document is marked as a cold open, the final figures and the finished chart simply stand; counts and sweeps play on in-app navigations and on a period switch, where the code is already running. Measure "tile painted -> first figure visible" on a production build at CPU x4 before believing an entrance count is free.

Load the counting code only when a count runs: on a dashboard every route pays for whatever the shared tiles import.

Keep the previous values in a store keyed by id, not on the element: a re-render (a language or period switch) replaces the element and would lose where to count from. Use `font-variant-numeric: tabular-nums` so digits do not jitter.

## Live moments

One per product is enough: a new order arrives -> a small glass banner drops in under the top bar, the affected numbers count from old to new, the new row slides into the list.

- Reuse the signal the app already has (its notification read, push) before adding a connection or a faster poll - that is a cost decision, not a design one.
- Only while the tab is visible. No sound without a setting.

## The launch screen (splash)

A branded cold-open animation is worth having once per launch - and it is the easiest motion to get wrong, because it sits between the person and the app.

- **Set its length from the measured time-to-content, not from how long the animation looks good.** The overlay leaves as soon as both its draw has finished and the content is ready, with a hard cap (about 1.2 s). An overlay improves "first paint" while delaying the moment the app is usable: measure **content painted** against **overlay gone**, with and without it, on a throttled profile. A difference over half a second is too much.
- The length is the owner's call once they have seen the numbers: show "app usable, with vs without" for each pace and let them choose. One owner kept a ~0.8 s draw (about +0.75-1.3 s on a throttled device) over a faster one because the brand moment mattered more to him - a legitimate choice, made knowingly.
- **The draw's own length is the floor of the cost** - budget it before choreographing (a draw that takes 0.8 s costs at least 0.8 s however clever the hand-over). Aim for a draw of about half a second.
- "Ready" is the first painted element of the app's shell, not `DOMContentLoaded`: on streamed pages that event comes late and the overlay always runs to its cap.
- Do not send the overlay to sessions that will not see it (the server can read the session cookie and omit the markup). Inline SVG in a server-rendered component is written twice (HTML and payload) - keep it small; an external `<use>` is not a way out, WebKit drops its gradients.
- An installed iOS app shows its startup image (the still mark) first; replaying a draw after it looks like the logo vanishing - show the still there and say so to the owner.
- **An installed Android app already has a launch: the system splash.** Android draws the manifest's `background_color` and the icon, centred in the whole window at a size that differs by OS version, maker mask and icon choice, and the browser fades it out over the page's first paint. A custom overlay after it is a second splash, and a "matched still" cannot match. Skip the overlay there (a tiny gate before the launch script: Android + standalone display mode -> spend the launch, mark the document cold so the first page does not cascade either) and keep it for browser tabs, iOS home-screen apps and desktop apps. If the start URL redirects, carry the cold mark across the redirect (a timestamp, cold if younger than a few seconds).
- **The manifest's one colour is the app's page ground.** In an installed Android app the splash ground comes from `background_color` and the system navigation strip under the page from `theme_color` - one colour for both OS themes, baked into the installed package; the page's `theme-color` metas reach only the status bar. Pick the ground of the theme most people use (dark, if the app has a dark ground: a dark strip under a light page is ordinary on Android, a white strip under a dark app glares) and tell the owner the limit.
- **Installed apps refresh their manifest late.** The browser re-checks about a day after the last check and re-mints the app only when it is closed, charging and on Wi-Fi; an icon change may ask for approval. A complaint about "the old colour / the old icon" right after a release is usually the old installed package: check which colours the screenshot shows against the previous manifest before debugging, and tell the owner a reinstall applies it at once.
- **The first painted frame must already be the right theme.** If the dark class is set by a script, the very first frame can be light; the launch overlay used to hide it. The server writes the theme class from the cookie it already reads.
- Startup images: fully dithered palette PNGs speckle at gradient peaks next to many-coloured artwork.
- **A splash only hides loading where the page streams its shell early.** On a page that arrives in one chunk (an access check before any HTML), the whole draw is added time - know which of your pages are which before promising a number.
- Exit timing: declare ONE exit animation, identically in every state, and schedule it by lowering a delay variable (`animation-delay: var(--exit)`), never with `setTimeout` (it fires late behind hydration) and never by re-declaring the animation with a new delay (that restarts its timing and cuts instead of fading). Measure "gone" on the animation timeline, not at `animationend`.
- Decide before first paint with a tiny inline script that only sets an attribute; the overlay is hidden by default, so a failure shows the app, not a stuck splash.
- Once per launch: `sessionStorage` for an installed app, a session cookie across browser tabs; storage that throws means no overlay.
- Skip it under automation (`navigator.webdriver`), in frames and on pages that are not the app - or every screenshot tool captures the splash.
- The native splash hands over without a flash: the manifest's background colour equals the overlay's ground, and iOS needs startup images or it shows a white screen first.
- It never stacks with page-entrance motion: after a launch the first page cross-fades in; it does not rise or cascade.
- Reduced motion: the still mark for the time the shell needs, then a cut.
- The word under the mark is the brand's real wordmark, not system text.

## Micro-interactions

- A button that **becomes** its result (label -> spinner -> check + "Sent") beats a toast alone.
- A status tracker's connector draws when the status advances; the new step pulses once.
- OTP boxes: a short shake on a wrong code, a green settle on success.
- A tab indicator brightens once when it lands.

## "Alive" without being busy

Breathing glows and glints must be **perceptible** - if the brightest and dimmest frame cannot be told apart in a screenshot, it reads as static - and **calm**: 3-4 s cycles, small amplitude, long rests, paused when hidden.

## Proving it

- List the running animations and their properties (`element.getAnimations({subtree:true})`, read the keyframes' property names): anything other than transform / opacity / stroke-dashoffset is a finding.
- Sample a transform per frame during a transition to see a curve rather than a jump.
- Record frame strips (every 60 ms) for a reviewer; add a temporary slow-motion switch (multiply the duration variables by 5) for review only.
- **Headless browsers throttle animation frames** (sometimes to one or two a second) and a screenshot can land mid-transition, showing a "bug" that is not there. For stills, finish the animations first (`document.getAnimations().forEach(a => a.finish())`) or emulate reduced motion; judge the motion itself only from sampled values or a real browser.
- A shared automation browser may be navigated by another task mid-probe. If a result looks impossible, check the page URL before believing it.

## Motion checklist

- [ ] Tokens in one place
- [ ] Fade-and-rise default; accents only where they explain something
- [ ] Nothing waits for an animation; one entrance per navigation
- [ ] Only transform / opacity / dashoffset animate
- [ ] Bars grow, lines draw, numbers count - once, and end exact
- [ ] Reduced motion = final state; the person knows how to see the motion
- [ ] Shell does not move; RTL slides mirror
