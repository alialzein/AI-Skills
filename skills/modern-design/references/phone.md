# Phone - its own layout, not a shrunk desktop

Check every screen at **320, 390 and 440** wide. Targets are 44 px or more. Nothing is set under 12 px (one exception: tab-bar labels under 360 px, below). Fixed and floating elements add `env(safe-area-inset-*)` to their offsets.

## Screen anatomy

```
 [ glass top bar: brand / title .... (search) (bell) ]   floating, sticky, veil above
   Greeting, date
 [ HERO: label, big number, delta chip, sparkline    ]   one thing leads
 [ Today | Week | Month ]                                segmented control
 [ tile ] [ tile ]                                       two columns
   Recent ... list rows
 [ ( home ) ( orders ) ( products ) ( ai ) ( more ) ]    floating tab bar
```

## Floating tab bar

- A pill ~66 px tall, ~14 px from each side, 12 px above the bottom or the home indicator - whichever is taller: `bottom: max(12px, env(safe-area-inset-bottom))`.
- Four destinations plus **More**. A page none of them owns lights More, so the bar always says where you are. **A small app with five or fewer destinations needs no More** - put them all in the bar; if preferences and help need a home, More holds only those.
- Icon over label; labels `truncate` with full width so a long word cannot push its neighbours. Under 360 px a whole word must still fit: first tighten the letter-spacing, then shorten the label, and only then drop the tab labels (and nothing else) to 11 px. Never cut a word to "Overvi...".
- **The page owes the bar room:** bottom padding on the content equal to the bar + gap + inset, declared next to the bar so the two cannot drift.
- **Always there is the default** (see the spotlight bar below). If a bar must hide: hide on scroll down, return on scroll up, with a threshold (~48 px) measured from the last turn, one measurement per animation frame, never hidden near the top of the page, always shown after a navigation.
- **One family of icons.** Every cell uses the same stroke weight, size and ink. A multi-colour brand mark in a row of line icons looks like a sticker: give the assistant entry a monochrome line glyph (a sparkle, or the logo's letter drawn as a stroke) that lights exactly like its neighbours. Keep the colourful animated mark for places where it stands alone (a launcher button, a chat header).

### The spotlight tab bar (the cheap, always-there default)

Start here on a phone. It is the bar that costs nothing while the page scrolls, and it reads as designed: a short bright strip on the bar's **top** edge above the active tab, with a cone of light falling from it over the icon.

- **Always in place.** It never hides on scroll. The only time it is not drawn is while the on-screen keyboard is up.
- **Opaque token surface, one border, one static shadow.** No `backdrop-filter`, no breathing, no glint: `getAnimations()` at rest is empty.
- **One mover.** Strip and cone are one decorative element, moved by a single `transform: translateX` (about 220 ms) from the same `--n` / `--i` pair as the bell below. Reduced motion: it jumps.
- **The strip is the light source:** the accent lifted toward white, 3 px tall, about 28 px wide, rounded lower corners, one static glow. It sits ON the top border.
- **The cone is light, not a tile:** it flares from the strip's width to about twice that at its foot, reaches about two thirds of the bar's height, is brightest under the strip (about 50 % of the accent on a dark bar, 15 % on a light one) and has faded out before the label. Soft sides come from a mask or a second gradient, never a blur filter. The icon stands in the light; the label stands on the clean surface.
- **Lit against unlit is brightness, not only hue:** inactive icons and labels take the secondary ink (still 4.5:1 for 12 px labels), the lit tab a bright tint of the accent.
- **Light theme:** light cannot shine on a light bar. Same geometry, a saturated strip, a faint accent wash for the cone, the accent as the lit ink.
- **A badge keeps one place** in both states - the icon's upper corner, mirrored in RTL - with a 2 px ring in the bar's colour so it reads over the cone. A badge that steps aside when its tab lights looks like it belongs to the neighbour.
- **A ground scrim instead of blur.** Behind the bar, a plain gradient from transparent (about 48 px above the bar, eased over several stops so no line can be found) to exactly the page's base colour, running to the very bottom of the screen through the safe area. Nothing is readable around or under the bar, and the gesture area reads as the same surface.
- **Tap-first lighting.** The lit index must not wait for the route. On pointer-down the tapped tab takes a *pending* index and light, icon and label switch at once; `aria-current` stays on the true page. The bar returns to the true tab when the route arrives, when a scroll takes over the press, after a short time with no click, after a long time with no route, and on Back / Forward. Target: the bar answers inside 100 ms on a throttled phone while the route is still loading - a bar that waits for navigation feels dead.
- **Narrow phones:** below 360 px tighten the bar's side gap and inner padding, not the type; keep at least 6 px between neighbouring labels.

When to choose the bell below instead: when the owner wants the neon look and accepts its cost (a blurred bar and two looping lights).

### The sliding bell indicator (the "neon line")

One thin line runs along the bar's bottom edge and rises in a bell over the active tab; it slides to the tapped tab.

**No measuring.** The bar hands the track two custom properties and CSS does the rest:

```html
<nav class="md-tabbar" style="--n:5; --i:0">   <!-- n cells, i = active index -->
  <span class="md-tabline" aria-hidden="true">
    <span class="md-tabtrack">
      <span class="md-tabanchor">
        <span class="md-tabglow"></span>                 <!-- soft light inside the bell -->
        <svg width="1400" height="66" viewBox="-700 0 1400 66">
          <!-- the same path three times: wide bloom, coloured line, hot core.
               Baseline y = bar height - 1 (65 for a 66 px bar): the line lies ON the bar's edge. -->
          <path class="md-bloom" d="M-700 65H-54C-38 65 -36 52 -33 39C-29 20 -20 6.5 0 6.5S29 20 33 39C36 52 38 65 54 65H700"/>
          <path class="md-line"  d="M-700 65H-54C-38 65 -36 52 -33 39C-29 20 -20 6.5 0 6.5S29 20 33 39C36 52 38 65 54 65H700"/>
          <path class="md-core"  d="M-700 65H-54C-38 65 -36 52 -33 39C-29 20 -20 6.5 0 6.5S29 20 33 39C36 52 38 65 54 65H700"/>
        </svg>
      </span>
    </span>
  </span>
  <ul> ... cells ... </ul>
</nav>
```

```css
.md-tabline  { position:absolute; inset:0; overflow:hidden; border-radius:inherit; pointer-events:none; }
.md-tabtrack { position:absolute; inset-block:0; inset-inline:6px;      /* the cells' box */
               --dir:1; transform: translateX(calc(var(--dir) * var(--i) * 100% / var(--n)));
               transition: transform 340ms var(--md-ease-spring); }
[dir="rtl"] .md-tabtrack { --dir:-1; }
.md-tabanchor { position:absolute; inset-block:0; inset-inline-start: calc(50% / var(--n)); width:0; }
.md-tabanchor svg { position:absolute; top:0; left:-700px; height:100%; overflow:visible; fill:none; }
```

The full set (the three stroke layers, the breathing bloom, the corner mask, both surface options) is in `assets/modern.css`, section 4.

The bell is drawn in pixels around x = 0, so it keeps its shape at any cell width; the flat run extends 700 px each way and the pill clips it. The path here is a starting geometry (66 px bar, ~72 px cells) - widen the feet or cap the width for other sizes.

**Geometry rule:** the SVG is as tall as the bar and the path's baseline is `bar height - 1`. The bar has **no CSS border** on the side the line runs along - draw its hairline as an inset `box-shadow` (or drop it there) - otherwise the line sits a few pixels above the border and the bar has two edges.

What every first draft gets wrong, and the fix:

| Symptom | Fix |
|---------|-----|
| The line floats a few px above the bar's border - two edges | Put the line **on** the border's path; it *is* the edge |
| First / last tab: the bell's outer foot is clipped and the line starts mid-air | Fade the line into the pill's corner with a fixed mask so the bell reads as the border lifting |
| The line fades out before the far end | Mask relative to the **pill**, not the bell: full at the bell, never under ~55 % anywhere, into both corners |
| Bell too narrow and steep; neighbours' labels crowd it | Round crown, long gentle feet that run **under** neighbouring labels; bell width follows the cell, capped (~72 px) |
| The top of the bell runs behind a badge | Give the badge a ring in the bar's ground colour so the cut is clean; test with "99+" |
| Active icon barely different from the rest | Duotone: keep the stroke, fill at 30-35 %, lighter ink, a soft halo behind it |
| "Neon" that is a flat coloured stroke | Layer it: near-white core, coloured stroke, a tight bloom (~3 px) and a wide one (~12-16 px), a soft wash inside the bell |
| Glow smeared into a thick band on a light bar | Neon needs dark. On a light surface use a saturated core and a faint tint instead |
| "Alive" animation nobody can see | Breathe the wide bloom between ~0.55 and 1 opacity over 3-4 s; one brighten when the slide lands; an occasional glint (~1.4 s every 6-8 s; see "The glint on a responsive line" below) |

**The glint on a responsive line:** a pixel-length dash animated with `stroke-dashoffset` stops short or overshoots when the bar's width changes, because the path's length in pixels is not known to CSS. Make the bar a CSS container (`container-type: inline-size`), slide a narrow reveal window (~44 px, `overflow: hidden`) across it by `100cqw`, and counter-slide a copy of the line inside the window by the same amount - only `transform` moves, and it reaches the far corner at any width. Reverse the direction in RTL.

Rules for the light: pre-blur the bloom layers once and animate their **opacity** - never animate `filter` or `box-shadow`. Pause when the bar is hidden or the tab is in the background. Reduced motion: no slide, no breathing, no glint.

**The bar's surface is a choice to offer, with both shown:** dark glass in both themes (the strongest neon; a deliberate dark bar under light content) *or* a light-grey glass in the light theme (calmer, closer to the page; the glow becomes a tint). People split on this - build the tokens so it is a value change (`--tab-bg`, `--tab-ink`, `--tab-line-core`, ...).

## Glass top bar

Same family as the desktop bar: a floating rounded glass strip, sticky, the veil above it, the safe-area inset in its padding. Fold search into an icon that opens the palette - a full-width search field under the bar costs a row on every page.

## Hero first

A phone home opens on **one** large card: label, the key number very large, a delta chip, a sparkline along its foot; then the period switch; then tiles or the list. A grid of six equal tiles has no lead. With no data yet, the hero has a designed zero state (what will appear here and the first step) - not "$0.00" on a flat line.

## Sheets

- Detail, forms and quick actions rise from the bottom: glass or solid, large top corners, a drag handle, the page behind dimmed and stepped back (scale ~0.94).
- Dismiss by drag-down, backdrop tap, Escape. Focus returns to what opened it.
- **A sheet opened from a tab must let the other tabs take the tap.** Keep the tab bar above the backdrop (pointer events on): tapping another tab while the sheet is open goes straight there. If the first tap only closes the sheet, navigation feels broken.
- **A sheet either covers a floating top bar or clears it.** Half a bar showing behind the sheet's top edge reads as a glitch: dim and cover it with the scrim, or start the sheet a clear gap below it.
- An order sheet: header with status chip, items with pictures, a **status tracker** built from the real statuses, the total, one full-width action that shows pending and then **turns into its success state in place**.
- A save bar is a strip (glass, above the tab bar) that appears when something changed - never a bare pill floating over text. While it shows, the page owes it room too (extra bottom padding), and when the tab bar slides away on scroll the save bar drops to the bottom edge with it rather than hanging in mid-air.
- **The step-back trap:** scaling the page behind a sheet puts a `transform` on an ancestor, and every `position: fixed` element inside it (a veil, a save bar, a popover) then positions against that ancestor and jumps. Scale a wrapper that contains no fixed elements, or mark fixed elements with one shared attribute that the motion CSS hides or exempts during the move.

## A chat page under the keyboard

The message box must not move while the list scrolls. A fixed box whose place above the keyboard is written by script from the visual viewport's scroll events lands a frame late and trembles, and the panned viewport can carry a sticky top bar off the screen.

- **The page is a column of the visible height; the message list is the only scroller; the message box is a normal child at the foot.** Nothing is fixed, nothing listens to scroll. The column's height comes from CSS variables written on resize only (keyboard opens or closes, rotation).
- Prove it with a REAL smaller, panning visual viewport (a scaled page in mobile emulation gives genuine viewport offsets); a stubbed viewport shows nothing. Sample the box's top edge per composited frame: one value.
- Then prove the states the keyboard proof hides: **at rest** (is the box under the tab bar's ground fade? give it its layer back) and **content inserted above the column** without a resize (an offline strip, a banner) - the column must refit.
- No emulator has a real phone keyboard: list what only the owner's phone can confirm.

## A personal background

When people may choose their own page background, every band that was painted "in the page's colour" stops matching: the scrim under the tab bar, a chat page's opaque grounds, the veil. Give each background a top and a bottom colour (the median of its picture in the strip the band covers) and point only the bands at them; inputs keep the page's own colour so placeholders keep their contrast. In dark mode tint the cards and bars toward the background's hue - navy cards over a warm background look muddy. Backgrounds are static (no blur, nothing that moves), measured for contrast on rendered pages, written into the first HTML from a cookie, and fall back to the default under reduced transparency, reduced data and forced colours.

## The "More" screen

A long flat list of twenty rows is the weakest screen in most dashboards. Make it a sheet:

- search at the top (the palette's index);
- "Recent" or "Pinned" first (the last few pages opened from here);
- groups as cards, each a 3-4 column grid of tiles (tinted icon chip + short label, two lines allowed, badges on tiles);
- **no lonely tiles:** a group with one or two destinations must not get a full-width card that is mostly empty - let small groups share a row (two half-width cards) or fold them into a neighbour. A two-column list of icon + label rows avoids the problem and shows more per screen; build both and let the person choose;
- account, language, theme, help as a compact footer strip - with a label under each icon, because a phone has no tooltips.

Prefetch on intent, not all twenty links on open.

## RTL on a phone

Grids and logical insets mirror for free. The things that do not: a slide direction (multiply by a direction variable), an icon that points (chevrons, arrows: flip), and anything numeric or coded (digits, OTP boxes, phone numbers: isolate and keep LTR).

Three traps that only show in RTL:
- **Invisible elements widen the page.** An absolutely positioned element at opacity 0 (a chart tooltip waiting to appear) still extends the scroll area, and in RTL that shifts the whole page sideways. Compare `scrollWidth` with the viewport width **in RTL** on every page.
- **Physical `left` / `right` rules** (first bar `left: 0`, last bar `right: 0`) break; use `inset-inline-start` / `-end`.
- **Charts and digits need a decision, made once per product:** whether a time axis mirrors with the page or stays left-to-right (platform guidance leans to not mirroring graphs and media timelines; some products mirror them), and whether figures use Latin or the locale's digits. Either is defensible; mixing within one screen is not. Record the choice.

## Phone checklist

- [ ] 320 / 390 / 440; 44 px targets; nothing under 12 px
- [ ] Bar clears the home indicator; the page's last row is not under the bar
- [ ] Bar visible on load (check in a real phone-size viewport - a cropped emulator frame hides it)
- [ ] Indicator right on the first and last tab, with a badge, in RTL
- [ ] One icon family in the bar
- [ ] Hero leads; zero state designed
- [ ] Sheets return focus; save bar has a ground
- [ ] No horizontal scroll (checked in LTR **and RTL**: `scrollWidth` = viewport width); no label cut mid-word
- [ ] Nothing fixed jumps when a sheet steps the page back
