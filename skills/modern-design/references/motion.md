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

Keep the previous values in a store keyed by id, not on the element: a re-render (a language or period switch) replaces the element and would lose where to count from. Use `font-variant-numeric: tabular-nums` so digits do not jitter.

## Live moments

One per product is enough: a new order arrives -> a small glass banner drops in under the top bar, the affected numbers count from old to new, the new row slides into the list.

- Reuse the signal the app already has (its notification read, push) before adding a connection or a faster poll - that is a cost decision, not a design one.
- Only while the tab is visible. No sound without a setting.

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
