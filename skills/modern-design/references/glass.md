# Glass - ground, surface, contrast, cost

## 1. The ground comes first

Glass is only visible by what it lets through. Over a flat background a glass card is a white card with a shadow.

- Two or three large, soft colour fields from the brand's hues (a "gradient mesh"), on a base that is near-white in light and near-black-with-hue in dark. No hard shapes, no photo.
- **Put colour behind the first screen.** The commonest failure: the fields sit low on the page and the top row of cards has nothing behind it.
- **Let the ground scroll with the page.** A `position: fixed` ground loses its colour lower on long pages and vanishes in full-page captures.
- Keep the ground low-contrast. It exists to be seen *through* things, not looked at.
- Scope it: a class on the page wrapper, so pages that should stay plain can.

```css
.md-ground {
  background:
    radial-gradient(60% 50% at 12% 6%,  var(--md-glow-a), transparent 70%),
    radial-gradient(50% 55% at 92% 22%, var(--md-glow-b), transparent 70%),
    radial-gradient(70% 60% at 50% 100%, var(--md-glow-c), transparent 70%),
    var(--md-bg);
}
```

A photo behind a working dashboard looks striking in a concept video and hurts every day after: contrast changes from card to card. If a person wants one, offer it as an **optional personal setting** from a curated, pre-blurred, pre-tinted set with a protective scrim, never as the default and never a raw upload.

## 2. The surface recipe

One recipe, used everywhere, as a class or a component variant - never re-invented per page.

```css
.md-glass {
  background: var(--md-glass);                 /* translucent: ~0.62-0.78 alpha */
  border: 1px solid var(--md-glass-line);      /* a light hairline, not grey */
  border-radius: var(--md-radius-card);        /* 16-22 px */
  box-shadow: var(--md-shadow-card);           /* one soft shadow */
  -webkit-backdrop-filter: blur(18px) saturate(1.5);
  backdrop-filter: blur(18px) saturate(1.5);
}
```

- **Two opacities, not ten:** a thicker glass for bars and navigation (~0.8), a thinner one for content cards (~0.65). If cards look like plain white, they are too thick *or* the ground behind them is empty - check the ground first.
- `saturate()` matters as much as `blur()`: it is what makes the colour behind look rich instead of grey.
- A top-edge highlight (an inner 1 px lighter line) sells the material more than a stronger blur does.
- Nested glass (a glass tile inside a glass card) gets **no second blur**: give the inner one a faint tint and a hairline only.

## 3. Contrast - the part that goes wrong

On glass, the colour behind text changes across a single card.

- Check each ink against the **darkest and the lightest** point of the ground that can sit behind it, in both themes. Body and secondary text: 4.5:1. Large numbers: 3:1 is the floor, aim higher.
- **Run the check, do not eyeball it:** `node scripts/contrast.mjs spec.json` composites each surface over the ground and over every glow and prints the worst ratio per ink (the spec format is in the script's header). It does not model `saturate()` or blur, so anything that passes under about 5:1 is also checked by eye on the real page.
- The fix is usually to step the secondary and tertiary inks one shade stronger *inside glass scopes*, not to make the glass opaque.
- Never put running text directly on the ground. A page title may sit there; a paragraph may not.
- Muted "placeholder-grey" values on glass disappear. Decide one rule for zero values (all full ink, or all quiet) and keep it.

## 4. Cost - blur is expensive

- **Count blurred surfaces.** A desktop page can carry a dozen; a phone should carry a handful. On small screens keep blur for the bars and the two or three largest panels and give the rest a higher-opacity fill with no blur.
- **Never animate `backdrop-filter` or `filter`.** For a breathing glow, pre-blur a layer once and animate its `opacity`.
- One blur per bar - not one per button inside it.
- **The phone budget, from a measured build** (a glass dashboard, production build, 390 px, CPU x4, five pages, scrolling and at rest):

  | Run | Compositor work per scroll frame | Frames drawn per second at rest |
  |-----|----------------------------------|---------------------------------|
  | As designed (blur everywhere, ambient loops) | 5.3 ms | about 53, forever |
  | No endless animations | 3.8 ms (-29 %) | 0 |
  | + blur on the top bar only | 2.2 ms (-57 %) | 0 |
  | + no blur anywhere | 1.1 ms (-79 %) | 0 |

  So, **on phones: no animation that runs forever** (a drifting ground, looping tile art, breathing glows keep the whole page redrawing while nobody touches it - heat, battery, and a busy GPU when the scroll starts), **and blur on the top bar only**. Cards, veils and sheets become tinted translucent fills with the same border and top highlight, so they still read as the glass family; a sheet's fill is opaque enough that nothing behind it can be read. Desktop keeps the full recipe. One-shot entrances stay.
- Put that rule in one place (one phone-level block that names every loop) with a test that fails when a new infinite animation is added without a phone decision - loops arrive one innocent decoration at a time.
- The main thread was not the problem in that build (no long tasks); the compositor was. Measure both, at rest as well as while scrolling - "frames per second at rest" should be zero.
- A headless browser's software compositor gives the direction, not the real-phone figures: the owner's own phone is the last test.
- Fallbacks:

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .md-glass { background: var(--md-surface); }      /* solid card */
}
@media (prefers-reduced-transparency: reduce) {
  .md-glass { background: var(--md-surface); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

## 5. Light and dark

- **Light:** the glass is white-ish and thin; the ground carries lavender / mint / sky tints; shadows are soft and coloured (a blue-violet shadow, not black).
- **Dark:** the glass is the brand's dark hue at ~0.6-0.8 alpha; the ground has deep glows; borders are a light line at low alpha. Dark usually reads as glass with less effort - do not make it louder to match.
- **Dark glass in both themes** is a legitimate choice for one element (a phone tab bar, a media control): a dark floating bar under light content separates navigation from the page and is the only surface a neon effect works on.

## 6. Glass checklist

- [ ] Colour sits behind the first screen, not only low on the page
- [ ] One surface recipe, two opacities
- [ ] Inks pass on the darkest and lightest ground point, both themes
- [ ] No running text on the ground
- [ ] Blur count is low on phones; nothing animates a filter
- [ ] `@supports` and reduced-transparency fallbacks exist
- [ ] Nested glass has no second blur
