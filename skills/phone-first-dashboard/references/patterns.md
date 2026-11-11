# Patterns - recipes for shapes every dashboard grows

Each recipe is the version that survived review; the pitfalls behind it are in `pitfalls.md`.

Contents: Settings · Section of pages · Stepped wizard · Filter bar over the URL · Search that finds
everything · One sheet, many doors · Detail body, two doors · Page ordered by use · Read-only
measures card · Status card for an outside service · Floating button · Pinned chat composer · Propose
then confirm · Preview of a real surface · Bulk job from the open page · Writes behind a screen ·
Print

---

## Settings

**Phone: a list of rows, each a sub-screen.** The settings home on a phone is grouped rows (iOS
Settings look), a value per row (streamed in its own Suspense). A row opens `?section=<key>`: the
section's fields, its own pinned Save, and a 44 px "← All settings" link (`md:hidden`).

**Desk: the same groups as a rail or tab strip on the SAME `?section=`.** One address serves the desk
tab and the phone sub-screen, so deep links and search results work on both. The desk opens a default
tab when the address names none. Group the rail and the phone list from ONE groups constant.

**A long settings page becomes server tabs**, not one long form:
1. Each tab is a small server file reading only its own data, inside `<Suspense key={section}>` (the
   key is the address's own section, so list → section on a phone is a new boundary too).
2. Per-section save: one action, a discriminated union on `section`, writes only that tab's fields. A
   form from before the split (no section) gets "reload" instead of a partial write.
3. One save bar per tab = desk button + pinned pill, rendered LAST in the tab.
4. One highlight handler on the page, outside the keyed Suspense; every anchor id maps to its tab (a
   test fails on an id with none). An old section key keeps resolving (an alias, not a redirect, so
   `&highlight=` survives).
5. Forms report dirty to one unsaved guard; the strip and the back link confirm before leaving.
6. A tab that writes nothing the one Save writes (domains, notifications) draws no desk save bar.
7. Gate: one entry per tab; each saving tab's primary is its pinned Save; the list entry has none.

Folding ONE rarely used card behind a settings row is fine for a short page; past two or three cards,
split into tabs.

**A page that Settings opens as a page of its own** gets a "← Settings" link in every branch it
returns, and keeps the Settings row lit (an "also active" prefix on the nav item).

**A per-type switch or closed list**: a field component around the kit's switch / native select, a
`<Label htmlFor>`, a hint tied by `aria-describedby`, its words passed by the page only for the account
type that shows it, and a gate in the action that drops the key for types that do not show it.

**A settings editor over a registry of keys** (plan features, overrides): one row component per kind
(switch / number with a "No limit" switch / choice), values read through the gates' own readers,
only CHANGED keys sent, a key the registry does not know drawn read-only. **Save → a review step in
the SAME sheet** (Back keeps the edits): a pure change list, counts from one aggregate, a failed count
is "could not count", and a change that touches money asks for a typed confirmation the server checks
too.

## Section of pages

An area of related pages is **ONE sidebar row** that stays lit on every page under it, plus the
section's **tab strip** under each page title (one sideways row on a phone, wrapping from `md`).
Remove the old per-page rows in the same PR - two rows are two doors on a phone. A badge a removed
row carried moves to the one row. The search must still find each page (name them in the search
index, since the nav no longer lists them). A page's own sub-tabs never repeat a strip tab. A menu
group of ONE row named like its heading is a repeat - fold the row into a neighbouring group.

## Stepped wizard

For a long create form ("you don't know where to start, where to end, what is mandatory"):
1. **The step rules are pure:** the step list, which field lives on which step (every field on
   exactly one - a server refusal finds its step), where the screen opens, the first step with a
   problem.
2. **Draw ONE step at a time** (not hidden siblings). Focus a field on another step through
   run-after-render (`requestAnimationFrame` after the step drew).
3. **The step lives in the address** (`history.pushState` with `?step=` + a `popstate` listener) so
   the browser's Back walks the steps.
4. **A six-step strip does not fit 390 px:** on a phone the bar is one line ("Step 2 of 6 · Business")
   plus a progress bar; the clickable strip is `max-md:hidden`; the review step's **Change** links are
   the phone's way back.
5. **ONE pinned pill** with conditional props: Continue on every step, the final verb on the last.
6. A comparison is a closed `<details>` - never opened on hover (a phone has none).
7. Keep the stored values when cards merge: one list of stored values, one list of what is DRAWN, and
   pure maps between them - no deep link that names an old value breaks.

## Filter bar over the URL

One bar for several pages beats a GET form per page:
- **Date chips** (Today · 7 days · This month · Last month · Custom - the from / to fields only under
  Custom, starting from the range on screen).
- **A search combobox** for large sets (a server action, name OR slug, ~12 hits) - never a `<select>`
  of every record (a 1,000-row cap means the rest cannot be picked).
- Selects apply on change on a desk and wait in the **filter sheet** (a draft) on a phone.
- **The active filters as removable chips** + Clear all (32 px desk, 44 px phone), each a link to the
  same view without that param; the empty state names them and offers Reset.
- The bar sits OUTSIDE the list's keyed Suspense (it stays drawn while a filter loads).
- A pure `href(state)` drops defaults, keeps a stable key order and resets the page unless the patch
  names it; a round-trip test (`parse(href(state)) == state`) holds "shareable, Back works".
- **Filters run in SQL** (a security-invoker function with a filtered `count(*) over ()`), so paging
  is exact past a row cap; every pager link keeps the filters; a page past the end clamps.
- A text search over PostgREST `or=`: escape `%` / `_`, drop `, ( ) " \ *`, and AND two `or` groups in
  ONE term - a second `.or()` is not combined.
- **Click-to-filter in a dense desk row** is a link that sets one URL param, with an `aria-label` that
  contains the visible text; a filter set by a click is drawn read-only in the panel with its ×.
- **A sort a phone needs:** the desk's column links become two selects in the filter sheet on the same
  `?sort=&dir=`.
- A search a role must not run is refused in the pure half, not only hidden.

## Search that finds everything

A dashboard-wide search finds every page, tab, card and main button - a card with no entry is a
search that "finds nothing" for exactly the thing someone typed.
- **A new page, tab, card or main button gets a search entry in the same PR**; a test reads every
  page file and titled card and fails on one with no entry (with a reason list for detail pages).
- A result is a URL: `?section=<key>&highlight=<id>`; the highlight handler re-reads the address, so
  a pick on the page already open pulses too. A card with no field to pulse gets a `#fragment`, never
  the bare page address (the search drops a second entry with the same address).
- The launcher is in the shell; everything else (dialog, ranking, words) loads on intent, and the
  index comes from a server action on first open so dictionaries never reach a client chunk.
- One dialog, two doors (a top-bar field and a launcher): the launcher keeps the dialog, the bar opens
  it through a module store.

## One sheet, many doors

A sheet many surfaces open (an Upgrade sheet opened from any refusal) is **ONE mount in the layout,
behind a module store**, not a context: the host registers an opener and lazy-loads the sheet on first
open; a toast's action (outside React) and a button both call `open()`. It also opens on
`?upgrade=1` (then strips the param), so a surface that cannot hold a button links to it. The store's
unregister removes ONLY its own opener. A refusal toast gets its action from a cheap word test on the
message. When only one page's surfaces need it, a hook + `next/dynamic` rendered beside the surface's
own dialog is enough.

A state that must greet the user once (a trial ended) reuses that one host (`openOnMount`, guarded by a
ref) instead of a new banner; the layout decides from a row it already read.

## Detail body, two doors

Build a record's detail body ONCE on the server and hand the same element to the phone list row and to
the desk row's detail button; both draw it in one detail sheet (a bottom sheet on a phone, a side sheet
from the inline end on a desk). Two doors that describe one record (a notification bell and a "needs
me" list) read ONE pure describer, and a parity test walks every kind; the verbs come from one pure
module.

## Page ordered by use

For a long admin page: **three bands, in this order** - an "at a glance" strip of number tiles (each a
door to its section), then the everyday sections, then ONE **Advanced** section at the end: a native
`<details>` closed in the server HTML (the gate measures the folded page), distinctly styled, with a
"Rarely changed" hint. It opens itself after mount for a `#fragment` or `?highlight=` inside it, or for
the viewer's last choice in `localStorage` (only a real click is remembered). Nothing is removed: cards
move whole with their ids, saves and states. A dense desk table's first screen shows ROWS, not
furniture (fold explanatory notes; one row of to-do tiles on top).

## Read-only measures card

A card of figures on a page near its budget is ONE closed `<details>` on every width (no twin), its
summary carrying the headline numbers; its read starts in the page right after auth and is awaited in
its own Suspense; the words come from a pure module so every state is unit-tested; each state says
what it is ("Not available yet", "No readings yet", "Could not be read just now"), never 0.

## Status card for an outside service

Inside a settings tab with a pinned Save: slot the card into the form BEFORE the save bar; stream it in
its own Suspense (the form paints at once). Every row is **state + what to do**: a dot (ok / needs a
look / not readable here), the value, one hint line; a value this server cannot read says so and links
where to look. A secret is shown as "set · …last4" at most. A button whose answer must be FOLLOWED (a
test e-mail) keeps its result on the card (`role="status"`), not only in a toast.

## Floating button

One mount, the shell's last child, placed by CSS on a data hook (bottom inline-end corner: right in
LTR, left in RTL), above the bottom nav on a phone and sharing the action bar's row when the screen has
one; slides away with the nav on scroll (`visibility: hidden`); adds `scroll-padding-bottom`
everywhere, pads `<main>` only on a desk. Hidden where it would fight a page's own bottom chrome (a
full chat page, an editor). A decoration on it lives INSIDE the button (it moves with it, needs no
position of its own), is `pointer-events: none` + `aria-hidden`, animates only transform / opacity
inside `prefers-reduced-motion: no-preference`, and on a phone stays inside the circle - anything that
grows the button's footprint covers row actions in the inline-end column.

## Pinned chat composer

Reuse the action bar's slot (its height variables + an in-flow spacer); sticky in flow from `md`. The
keyboard, follow-the-newest and refocus rules are in `pitfalls.md` §4. Bubbles and chips
`min-w-0 [overflow-wrap:anywhere]`. A table in an answer wraps. A link under an answer comes from the
TOOLS that ran, never from the model's words. A server action used inside the thread is `import()`ed
on tap.

## Propose, then confirm

When an assistant (or any automated step) suggests a change: the card shows the change in facts a tool
read ("Order #57 · Out for delivery → Delivered"), and only its Confirm runs the page's own action. The
buttons send ONLY the saved proposal's id; the server reads it back, claims it in one conditional
update (two taps apply once) and gives the claim back on failure - the card holds no data worth
forging. Confirm + Discard share the row on a phone (`flex-1`). The settled state lives in the session
store, so every view of the thread agrees.

## Preview of a real surface

A preview of a public page drawn from unsaved settings is the REAL page in an iframe of a preview
route, sized to a REAL viewport (390 × 844, 1440 × 900) and scaled with `transform` inside a
`dir="ltr"` box - breakpoints answer only to a real viewport, never to a scaled div. The form posts its
unsaved state by `postMessage`; the frame accepts only a whitelist of keys and short values; the iframe
is `inert` and mounts only while its `<details>` is open (closed on a phone).

## Bulk job from the open page

A paid run of many calls (generate N pictures): the run lives in a lazy component kept mounted once
used and OUTSIDE its dialog (✕ never stops it); the entry shows progress ("3 of 8") from a callback.
One server action per item in a loop over a pure reducer (start · working · done · failed · halt ·
stop · finish), an `alive` ref flipped on unmount (the call in flight still lands). Unknown answers
STOP the run. Everything paid is a record the moment it exists, and a "waiting (n)" entry is the door
back after a closed page. A bulk verb on a full phone bar goes in the bar's ⋯ sheet.

## Writes behind a screen

- **A multi-row write is ONE database call** (a reorder that reads, checks and writes row by row is
  neither atomic nor race-safe): a `security invoker` SQL function (row rules still apply,
  `search_path` pinned, executable by signed-in users only) that locks the parent row, checks the id
  set and writes in one statement. A form's save never rewrites a column another verb owns.
- **A read-modify-write of a JSON column is a compare-and-set**: update where the column equals what
  was read; 0 rows = "changed meanwhile, reload". `jsonb` equality is semantic; a stale-write hash over
  a `jsonb` document must hash KEY-SORTED JSON (jsonb reorders keys).
- **Never a free JSON box over a production column**: one key per save, the key from an enum, the
  value checked by the same strict schema the main editor uses.
- **A limit a purchase raises stores what it ADDED** and adds it once to the current allowance
  (claimed per row with a conditional update) - never a recompute from the plan's number.
- **"Who set this?" comes from the audit log**, not a sidecar key in the data.
- **A user-facing page over an admin-only table** keeps the table's row rules; the server-only loader
  re-checks the role before using elevated access; what leaves is decided by PURE code - an explicit
  allowlist of event codes, a sanitised payload, a mapper that builds a NEW object of safe fields.
- **A write the server already made is mirrored, never re-staged**: the form runs the same pure
  arithmetic on its own list so unsaved edits elsewhere survive.
- **Purge caches only for what a public page reads** - compare before / after, not the patch.

## Print

A print button prints the WHOLE shell (sidebar, top bar, bottom nav) unless you stop it: portal the
piece to `<body>` and hide every other body child with `display: none` while printing (never
`visibility`, which keeps the room and pushes the piece to page 2), one `@page` margin,
`break-inside: avoid`. Many sheets: each `break-after: page` (the last `auto`), photos capped in `mm`
for print, the print copy's images eager, and the Print button waits for every image (load OR error,
a cap) before `window.print()` - the print snapshot draws a half-loaded photo as a blank box. Words
printed ON the content follow the content's language, the toolbar's the UI's. The browser's "Save as
PDF" is the PDF. Prove it with Playwright `page.pdf()`: the right page count, only the piece.
