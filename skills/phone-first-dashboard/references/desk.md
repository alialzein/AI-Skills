# The desk - from `md` up

The phone rules hold below `md`. From `md` up, the client dashboard and the admin panel share ONE desk
design system: one scale, one table, one filter panel, one set of status tones. Write it down in one
document and treat it as the law for desk changes; every desk change is `md:` only, so the phone
numbers stay where the gate holds them. For the visual style itself, see `modern-design`.

## 1. One scale, set once

- **One scale cannot serve a 2K monitor at 100 % and a 1080p one at 125 %.** Pick one (this product
  chose a compact, browser-chrome-like scale after seeing screenshots on a 1080p screen) and keep a
  density switch as the fallback - never a second sweep of every page.
- The compact scale that held: desk body 13 px, captions 11, meta 12, page title 22; 32 px buttons and
  fields (28 small); 36 px table heads and 40 px rows; 32 px nav rows in a 220 px rail; a 48 px top
  bar. **Arabic on a desk keeps 14 / 12.** The phone keeps 14 / 12 regardless.
- **Set it in tokens, not pages:** with Tailwind v4, utilities read `--text-*`; redefine `text-xs`,
  `text-sm`, `text-2xl` from `md` and most of the change happens at once. Then the primitives, then the
  shell and the kit, then a sweep for page-local sizes a token cannot reach (`md:h-9`, `text-[15px]`,
  `p-6`, local `h-9` chips, `text-[10px]` / `text-[11px]` badges) - grep for them, never re-derive per
  page.
- **A shared primitive that public pages also render takes its size from a variable with the OLD size
  as the fallback** (`h-[var(--btn-h,2.25rem)]`): changing the classes outright would shrink every
  public checkout button that uses the same Button.
- **Teach tailwind-merge your custom size tokens**, or `cn()` drops `text-meta` beside a colour class.
- **A compact density attribute is for a WORKBENCH only** (an editor's root), never put on a page to
  fit more.

## 2. Status, disclosure, meter, section

- **Status is a tone, never a palette class.** `Badge tone="success|warning|danger|info|neutral"` and
  soft / fg token pairs replace raw `bg-amber-100` / emerald / sky / red: those had no dark theme and
  failed axe `color-contrast`. ONE map per domain owns the meaning (order status → tone). A number
  card's hue says WHAT the number is, never how it is doing; a section's hue says WHICH section.
- **A limit's colour is the rule's verdict, not the bar's share:** a one-login plan is "full" by
  design and is not a warning; no bar at all without a limit.
- **A dot's colour is its meaning:** news is the brand colour; red only for a warning - and the data
  says which.
- **Disclosure:** a bordered `<details>` that reads as a button, 48 px summary, a chevron that turns,
  key figures in the hint; keep the section's ids on it; closed on a page near its phone budget.
- **Meter:** `tone="auto"` < 80 % success, ≥ 80 % warning, ≥ 100 % danger, a limit of 0 = paused, a
  failed read draws "could not read" and an empty neutral bar.
- **Section:** an h2 + a ~65ch description + actions on the end edge.

## 3. The filter panel

One `rounded-xl border bg-card` panel: row 1 the chips (36 px pills, `aria-pressed` or `aria-current`,
a visible idle border, a focus ring); row 2 the controls, **each labelled above** (`<label htmlFor>`
reusing the words that were the select's `aria-label` - no new strings); ONE filled button (Filter /
Apply), Clear outline. A Radix `SelectTrigger` is `role="combobox"` and takes no name from its value:
no label = axe critical `button-name`. The phone keeps the chip row + filter sheet (`patterns.md`).

## 4. Tables

- Head 36-44 px, 13 px, **sentence case** on a raised surface (`uppercase` breaks Arabic); rows 40-48
  px; one primary cell `font-medium`; money and counts as `numeric` cells (end-aligned, tabular), money
  in `<bdi dir="ltr">`.
- **Past ~12-20 rows the card frame IS the scroller:** `max-h-[70vh]` + sticky `th` on an opaque fill,
  applied from `sm` so the phone's stack is untouched (one history table went from 3,114 to 1,433 px
  tall). Below that row count, let the page scroll.
- **A frame that scrolls sideways is a keyboard stop:** `tabIndex={0}` + a name + `role="group"` (axe
  `scrollable-region-focusable`); a `region` landmark there tripped `landmark-unique`.
- **Or make it fit:** let two-word heads wrap, move a column to `lg`, wrap cells; with 13 columns at
  1440, put two figures per cell before shrinking type.
- **A head is one row, one label per column:** the column sorts by its main figure and every other
  order lives in a Sort menu in the panel - not a stack of sort links per head.
- **A link in a dense row** is a 32 px box with a negative margin: the target grows, the row does not.
- **A row that highlights on hover must open on a click anywhere** (a `<tr onClick>` that ignores
  `a, button` targets; the name's button stays the keyboard's door); paint ONE solid hover tone on
  every cell, or a sticky cell shows a step.
- **The first screen shows rows, not furniture:** three banners + a note + two rows of tiles + a filter
  panel pushed a table head to y = 782 at 1440 × 900. Fold the notes; keep one row of to-do tiles; move
  the rest under the list.
- **One vocabulary per page:** a row that says "Active today" must not open a panel that says "Last
  seen: Never"; a card and a chip that carry the same word carry the same number.

## 5. The shell below `lg` - measure 768 every round

- Every page was 186-243 px wider than a 768 screen: a 240 px rail left the top bar 528 px for ~660 px
  of controls, none of which could shrink. Fix: the rail folds to a 64 px icon rail between `md` and
  `lg` by itself (opening it there lasts for the page and never writes the stored preference); search
  is an icon below `lg`, a short pill at `lg`, a full field + shortcut from `xl`; the end group has
  `md:min-w-0` and the account switcher truncates first.
- **A flex row of fixed-width controls needs ONE member that gives way.** Anything added at `md:` is
  looked at at 768.
- **A sticky, foldable sidebar rail:** `sticky top-0 h-svh` with the nav as its only scroller; folds
  240 → 64 px by a header toggle (`aria-expanded` + `aria-controls`, the icon mirrored in RTL) or
  Ctrl/⌘ B (never inside a field). The choice is a cookie read by the layout on the server, so the
  first HTML is right. Every folded style is scoped to the rail's NAMED group, because the phone drawer
  renders the same nav outside it and must never fold. A folded label is clipped to 1 px (the link
  keeps its name). Rail tooltips are ONE `position: fixed`, `aria-hidden` element owned by the shell,
  placed from `getBoundingClientRect` beside the rail's inline end, mirrored for RTL, dismissable
  (WCAG 1.4.13).
- **A centred name in a phone top bar needs real columns** (`grid-cols-[6.25rem_minmax(0,1fr)_6.25rem]`),
  two icons at most on the end side; a third icon goes to the start column.
- **Every nav item renders twice** (rail and drawer): scripts scope to the drawer.

## 6. Charts and digits on a desk

- recharts writes `font-size` as an SVG attribute: size the desk ticks with a descendant selector from
  `md` and leave the phone's 12 px. Legend and tooltip words in the card's ink (the series colour was
  under 4.5 : 1). Name every chart; give Pie slices `aria-label`s.
- A tile value passed as a bare number prints Latin digits on an Arabic page - format it.
- **A chart-free sparkline** is a server-drawn polyline inside the tile's hint: no chart library, no
  kit change.

## 7. Smaller ones

- **Contrast traps:** an inactive tab at 60 % ink on a muted strip; a hint at 75 % white on brand blue;
  brand blue on a 20 % brand tint in dark (4.14 : 1). A tint over a card is a COMPOSITE colour - check
  the pair as composited, not the token alone.
- `Card py-6` + `CardContent pt-6` = a 48 px empty band at the top of every card.
- **One filled button per view on a desk;** a second becomes outline / soft. The phone's filled pill
  stays.
- **A restyle changes no words** - but it does change screenshots; list the help pictures to re-take.
- **A link that must look like a round button** is `<Button asChild>` around the link, so it carries
  the button's own data hooks.
- **A secondary card's controls on an admin page that must also read RTL** use logical properties even
  when the admin is English-only.

## 8. Parallel page waves - freeze the shared files

When several agents restyle many pages at once, the primitives, the page shell, the shell, the kit and
the design document are off limits. A page agent that needs a shared change writes a **shared-component
request** (file, defect, measured numbers, proposed diff) and works around it with what the frozen
piece already accepts (a `className` with a hit layer, a label around a small switch). The integrator
applies the requests ONCE, after the wave. Two agents editing one primitive = two looks and a
conflict. A defect every group calls "the shell's" belongs to the integrator.

## 9. The desk gate - floors and how they are measured

**Floors: 28 px targets, 11 px text, 0 overflow** (32 / 13 before the compact scale), plus axe.

A desk-shots script opens every admin and dashboard page on a local production build, at 1440 and 390
(light and dark, both languages) with axe, and again at 1280 and 768 (light, one language); it writes a
report, a results file and a picture gallery. A test fails when a new page file has no entry.

- **Reuse ONE saved session** (a session file outside the repo, refused inside it): sign-in limits are
  counted in production and shared by every agent and real users - a baseline run once locked a real
  admin out for 15 minutes.
- **A count that is the same on every page is the shell or a kit piece** (an 18 px switch, a 24 px
  language toggle, an 11 px sidebar badge) - read the offender list, not only the count.
- **Navigation-only runs cannot open a sheet, a drawer or a fold**, and demo data lacks many states:
  name each as unverified rather than calling it checked.
- **A gate that runs the branch against production data** that does not have the branch's migration
  yet will measure a page missing those facts: a new table read can degrade by itself, but a new
  column added to an existing select fails the whole row read. Say which states the gate could not
  see, and walk them on a local stack.
