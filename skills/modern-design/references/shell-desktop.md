# Desktop shell - floating sidebar, glass top bar, veil

The shell frames every page a person will judge. Build it before the first page.

## Anatomy

```
+--gap--+------------------------------------------------+
| side  |  [ search .............. ]        (ai) (o) (b) |  <- floating glass top bar, sticky
| bar   |------------------------------------------------|
| float |  Page title                          [actions] |  <- ~24 px of air under the bar
| ing   |  [ hero / chart ......... ] [ donut ]          |
|       |  [tile] [tile] [tile] [tile]                   |
+-------+------------------------------------------------+
```

## Floating sidebar

- A gap of ~12 px from the top, bottom and start edge; 20-24 px corners; the thicker glass; one soft shadow. Height = viewport minus the two gaps; it scrolls **inside**.
- The brand row is pinned at the top and Help / Account at the bottom, **inside** the rounded panel.
- **Scrollbar:** a native scrollbar with arrows breaks a rounded panel. Use a thin overlay style (`scrollbar-width: thin`, a token colour, `scrollbar-gutter: stable`).
- **The active row must be in view.** On load and on route change, scroll it into view inside the sidebar's own scroller (`block: "nearest"`); fade the foot of the scroller so a cut row reads as "more below", not as clipped.
- Active row: a soft tinted ground plus a 3 px accent bar on the start edge. Group headings small, quiet, spaced.
- **Collapsed rail:** the same floating panel, icons only. Each icon shows a tooltip on hover *and focus* with the label and its badge, on the inline-end side, after ~150 ms; never on touch.
- A small **usage card** above the footer (plan name, the tightest limit as a thin bar, a link) is a good use of the foot - from data the layout already has, hidden on the rail.
- Logical properties throughout (`margin-inline-start`, `inset-inline-start`): in RTL it floats on the other side for free.
- Below the tablet breakpoint there is no sidebar. The phone has its own navigation.

## Glass top bar

- A separate floating rounded strip (same gap, ~18 px corners), `position: sticky`. One blur for the bar.
- **Search leads.** First on the start side, ~420-520 px wide at 1440, ~40 px tall, a placeholder that says what can be found ("Search orders, products, customers..."), the shortcut chip at its end. It is a button that opens the command palette - behaviour unchanged, only place and size.
- The assistant entry, theme, notifications and account sit at the end.
- At 768-1024 the search shrinks before anything wraps.

## The veil - a floating bar must own what is behind it

Without it, rows are readable in the strip between the window top and the bar, and cards slide out from behind its rounded corners.

```css
/* a fixed band over the content column, from the window top to 24 px under the bar */
.md-veil {
  position: fixed; top: 0; inset-inline: var(--md-col-start, 0) 0; z-index: 29;
  height: calc(var(--md-gap) + var(--md-bar-h) + 24px);
  pointer-events: none;
  background: linear-gradient(to bottom, var(--md-bg) 0 55%, transparent);
  /* or: backdrop-filter blur on this band + a mask that fades it out */
  opacity: 0; transition: opacity var(--md-dur-fast) linear;
}
html[data-scrolled] .md-veil { opacity: .82; }   /* set when scrollY > 4 */
```

- **The veil shows only once the page has scrolled.** At rest it would wash out the colour behind the first screen (law 1) for nothing - there is nothing to hide yet.
- Fixed over the content column, not sticky inside it: a sticky band overlaps the first row by the shell's top gap.
- Tune the wash strength until a card edge passing through reads as a clean fade, not a smudge (start around 80 %). Check it in RTL and in both themes, scrolled.

## Breakpoints (stated once)

| Width | Shell |
|-------|-------|
| under 768 | Phone: no sidebar, floating tab bar, phone top bar |
| 768 - 1099 | Icon rail (with tooltips), search shrinks before anything wraps |
| 1100 and up | Full floating sidebar |

Adjust the numbers to the product, but write them in one place and use them everywhere.

## One edge

- The bar's outer edges and the content column's edges are the **same** two lines. If the bar runs 20 px wider than the cards, every page has a step.
- Air: ~24 px from the bar's lower edge to the first row of any page - set once in the shell, never per page.
- Page content fills the desk: a profile or settings page that is one 700 px column on a 1440 screen is half empty. Centre it or give it two columns.

## Shell checklist

- [ ] Sidebar floats with a gap; brand and footer inside the panel; thin scrollbar
- [ ] Active row scrolls into view; foot fade
- [ ] Rail tooltips with label + badge, on hover and focus
- [ ] Top bar floats, sticky, one blur; search leads and is wide
- [ ] Nothing readable above or beside the bar while scrolling (veil), both directions
- [ ] Bar and content share edges; 24 px of air under the bar
- [ ] Focus order still makes sense (skip link, sidebar, search, content)
- [ ] The phone shell did not move by a pixel
