# Pitfalls - grouped, each with the failure it prevents

Every item here broke something in production or in review once. The stack notes use React +
Next.js App Router + Tailwind + shadcn/ui (Radix) as the example; the rule itself is general.

Contents: 1 Hidden twins · 2 Layout and overflow · 3 Touch targets · 4 Fixed bottom layers and the
keyboard · 5 Sheets, dialogs and focus · 6 Forms · 7 Lists, tables and paging · 8 Navigation,
prefetch and tabs · 9 Streaming and server reads · 10 Honest numbers · 11 State that outlives a view ·
12 Fitting the screens budget · 13 Bundle weight · 14 Words, locks and plan-aware screens ·
15 Accessibility details · 16 Testing traps

---

## 1. Hidden twins (double mounts)

A `md:hidden` / `max-md:hidden` copy is hidden by CSS, not removed: it is **mounted, rendered and
running on every load at every width.**

- **Never mount a second copy of a stateful, polling, effectful or fetching component for the
  phone.** A list manager rendered twice ran its highlight-polling hook twice; the hidden copy polled
  every 5 s on every desktop visit. Hoist the hook ONCE and pass its result to both branches.
- **The same when the desk gains a control the phone row already has** (an optimistic Hide / Show):
  hoist the state - ONE reducer for both copies, never two that can disagree.
- **Two copies of a field** (a phone block and a desk block over one state) each get their own `id`
  (`-p` / `-d` suffix). A repeated `id` points labels, `aria-*` and fragment links at the hidden copy.
- **A hash link to a list drawn twice** (phone rows + desk table): ONE wrapper with the `id` around
  both copies, plus `scroll-margin-top` for the sticky top bar.
- **No `priority` / eager image in a phone list** - it loads, hidden, on every desktop visit. The
  same for any heavy preview: a 50-100 kB data URL in both copies of the server HTML is paid twice;
  draw it after mount.
- **No dead phone markup inside a desktop-only block**, and never mount a component defined inside
  another component's body (it remounts on every render) - call it as a function or hoist it.
- **A phone card the desktop now wants too:** do not add a desktop copy beside the phone one (two
  reads, two stateful lists). Lift the ONE card out of the phone block, keep the phone chrome in
  `md:hidden` and the desk header in `max-md:hidden` around the single list, and let the list hide
  its rows past the phone's share with `max-md:hidden`.
- **A sidebar entry the phone bar already has:** on a phone the sidebar IS the drawer that "More"
  opens, so a new sidebar entry is a second door. Hide it below `md` when a bottom bar is drawn.
- **A stateful control in a shared header drawn twice (phone / desk) and on every tab is a double
  mount.** Put a rarely used switch at the top of its own tab, once.
- **Stateful pieces of a filter bar (a combobox, a search field) are ONE mount for both widths;**
  only plain selects get a desk copy and a sheet copy.
- **When a list, form or wizard step is drawn one-at-a-time, draw ONE**, not hidden siblings: two
  mounted form copies each keep a full copy of the answers and the later `onChange` overwrites the
  earlier one with stale keys.
- **A hidden action bar still matches CSS `:has()`** rules keyed on it (it lifted a floating button
  over an empty list). Do not render the bar in the copy that is hidden.
- **A row that shows on a phone only when it holds something:** `max-md:hidden
  max-md:has-[[data-phone-item]]:flex`, its desk-only pieces `max-md:hidden`.
- **Swap by conditional render, not by `hidden`:** a Radix `asChild` trigger hands its classes to a
  Button that has `inline-flex`, and `hidden` loses that fight.
- **A read-only card can be ONE closed `<details>` on every width** - no twin at all, nothing
  double-mounted, the summary carrying the headline.

## 2. Layout and overflow

- **A grid with only breakpoint columns has an `auto` track below them**, sized to its widest
  unbreakable content. One long traffic-source string widened an analytics page past the screen
  while every demo account passed the gate. Write `grid grid-cols-1 lg:grid-cols-2`, never
  `grid lg:grid-cols-2` (`grid-cols-1` is `minmax(0,1fr)`).
  - **A Select's trigger** showing a long value ("Basic (legacy) - $15.00/mo - not offered to new
    accounts") grew a form grid's auto column and the page to +500 px at 390. The grid is
    `grid-cols-[minmax(0,1fr)]` below its breakpoint, the trigger `min-w-0`, and a mark after a name
    is short.
  - **A chip row** must never widen its parent: `min-w-0` on it, `minmax(0,1fr)` on the column
    holding it (one widened the layout viewport by 465 px).
  - **A dialog is a grid too:** shadcn's `DialogContent` is `grid` with an auto column, so a chip
    row inside it pushed the fields past the dialog's edge at 1440. Give it `grid-cols-[minmax(0,1fr)]`.
  - **A `ul.grid` of cards with a truncating line** measured 469 px at 390 for the same reason.
- **Measure with the LONGEST value a field can hold, not the demo account's.** A gate run only
  proves the data it saw.
- **An `sr-only` span escapes an `overflow-x-auto` strip** unless something above it is positioned:
  every page of one section was 509 px wide until one `relative` was added.
- **User text** (chat bubbles, chips, table cells in a chat answer) gets `min-w-0
  [overflow-wrap:anywhere]`: one pasted URL widens the page.
- **A flex row of fixed-width controls needs ONE member that gives way** (`min-w-0` + `truncate`).
- **A notice with a link on a phone:** let the link WRAP under the sentence (`flex-wrap`) - a link
  beside the text left an Arabic sentence five lines tall at 390.
- **Every new card on a phone costs about 100 px.** Labelled figures in one sentence
  ("10 visitors (+6%) · 2 orders · $20.00") read as well as a three-column grid and cost one line.
- **A half-width tile label is about 18 characters at 390**; beyond that it truncates. Give phone
  tiles short labels and keep the long ones for the desk.
- **A third line on a row's trailing column is fine; a sentence there squeezes the meta line.**
- **A percentage margin is a share of the box's WIDTH**, not its height: a decorative scene that
  stood on `mt-[6%]` sank 138 px on a wide card. Never a percentage margin for vertical placement,
  never a height past 100 %; size with container units when the box follows its width.
- **`cn()` (tailwind-merge) drops classes it thinks conflict:** a caller's `absolute` drops a
  component's `relative`; `pl-x-hint pl-x-err` built with `cn()` lost one id (it looked like two
  padding classes). Never build `aria-describedby` or other id lists with `cn()`; teach it custom
  size tokens or it drops them beside colour classes.
- **A focus ring inside `overflow-hidden` is cut** - use an inset ring.
- **A translucent card cannot back a sliding (swipeable) row** - the row needs an opaque background.

## 3. Touch targets

- **A row's target box is the ROW's height** (`min-h-11 self-stretch flex flex-col justify-center`
  on the link) - a link sized to its two text lines measured 42 px and failed 44.
- **An in-flow text link inside a banner or caption is a 44 px target too.** Alert banners' "Review"
  links measured 49 × 20 and failed every page the moment an alert was live - the gate only saw it
  while an alert showed. A link inside a real sentence (`<p>`) is the inline exception; a link that
  stands alone (in a caption, a `<dt>`, a list) is `inline-flex min-h-11 min-w-11 items-center`.
- **Width counts too:** a one-word link ("Other") was 38 px wide. A short inline link gets a hit
  layer at least 44 WIDE without a fixed width:
  `before:inset-x-[min(-0.25rem,calc(50%_-_1.4rem))]` (1.4rem, not 1.375rem - a 31.98 px word
  measured 43.98 px and failed by a rounding).
- **A hit layer for every Button on a phone lives in a CSS layer** (`@layer components`): an
  unlayered `position: relative` beat a caller's stretched-row trick. A button that paints its own
  `::after` must be drawn at 44.
- **A gate can count a positioned target's `::before` / `::after` box**, so 40 px drawn + the layer
  passes 44 (see `gate.md`).
- **A radio or checkbox is grown by its `<label>`**: a `min-h-11` label row around a 16 px radio.
- **Size every badge, count and conditional button for the phone when you write it** (`max-md:text-xs`,
  `max-md:min-h-11`): an 11 px count badge and a 32 px conditional button passed every gate run
  until real data made them appear.
- **A toolbar reused from a desk page brings 32 px buttons:** grow them from the container
  (`[&_[data-slot=button]]:max-md:h-11`).
- **A back link that is 20 px of text** needs `max-md:min-h-11`.
- **A drag has a non-drag twin** (stepper buttons, WCAG 2.5.7): 44 px handles on 12 px dots; a swipe
  is never the only way (a ✕ on every swipeable row).

## 4. Fixed bottom layers and the keyboard

- **The action bar renders an in-flow spacer: it must stay the page's LAST element.** A card added
  after the component that renders the bar slid its buttons under the fixed pill. When a form owns
  the bar and the page adds a second card, the form takes `children` and draws them between its
  card and the bar. A dialog rendered after the bar is fine (it portals out of flow).
- **Never show the action bar and a bulk-selection bar together** - they share a position; hide the
  pill while a selection is active.
- **One primary per page** (per state): a second card's Save is in-card and full-width, unmarked.
- **A field Tabbed to near the bottom hid under the fixed bars**: the browser scrolls a focused
  field only to the viewport's edge. Set `scroll-padding-bottom` on `html:has([data-bottom-nav])` /
  `html:has([data-action-bar])` below `md`, from the same height constants as the bars. A new fixed
  bottom element gets a hook and its height in that padding. Check it by Tabbing to the LAST field
  and probing `elementFromPoint` at its top, middle and bottom.
- **Every fixed bottom bar tells the floating button** (a hook + one CSS rule beside the action
  bar's): a bulk bar with no hook let the floating AI button sit on Delete.
- **A floating button:** ONE mount per layout, the shell's LAST child (never inside a sticky header,
  whose z-index caps it), placed by unlayered CSS on a data hook because it depends on other fixed
  pieces; on a phone it shares the action bar's row instead of stacking another layer above it, and
  it slides away WITH the bottom nav (`visibility: hidden`, so it leaves the Tab order). **Padding
  added to every page is paid by the pages already at their budget** (it failed two pages' screens
  budgets) - use `scroll-padding-bottom`, which costs no page height. Anything added ON the button
  counts toward the corner's height: measure the stack, not the button. A list row that may sit under
  it gets a stretched target so a covered button is never the only way in.
- **iOS keeps `position: fixed` on the LAYOUT viewport, so the keyboard covers a fixed composer.**
  While the keyboard is open (`innerHeight - visualViewport.height > 120`), place it on the
  keyboard's edge with an inline `bottom` from `visualViewport` - phone only, no nav offset, no
  transition. A sheet footer drops its safe-area padding while the keyboard is up (it sat 34 px above
  an iPhone keyboard).
- **A chat thread under a pinned composer** follows the newest message through a sentinel with
  `scroll-margin-bottom` = composer + nav, only when the reader was within ~120 px of the bottom
  (their own new question always). A streaming answer grows without a new message: follow its length
  too, one scroll per frame, still only near the bottom - never drag a reader who scrolled up.
- **Return focus to the composer after an async answer only if it was there** (or on a fine
  pointer): a refocus after a tapped suggestion pops the keyboard over the answer.
- **Off a bottom-bar tab, the top bar shows a back arrow in the menu button's place.** It is
  `router.back()` while the app has its own history, and the owning tab when it has none - never a
  guessed parent path (could be a 404). An installed home-screen app has no browser Back.

## 5. Sheets, dialogs and focus

- **Latch the surface while open.** The responsive dialog chooses dialog vs sheet on open and keeps
  it; the form inside mounts exactly once, a resize does not remount it. Opened on first paint (a
  `?open=` shortcut) it draws nothing for one frame until the width is known - by design.
- **A sheet's confirm is a SIBLING of the sheet, not a child** - the sheet unmounts as the question
  opens.
- **Return focus, always.** Every controlled dialog without its own Radix trigger uses the
  return-focus hook. A dialog opened from a row-actions sheet returns to THAT sheet's opener (the row
  inside the sheet is gone by then): set the target in the sheet verb's `onSelect`, reset it in every
  other open path. When buttons vanish after a result, move focus to the settled line
  (`tabIndex={-1}`), never `<body>`. When the pressed link leaves the screen as it draws, move focus
  on the next frame (`requestAnimationFrame`) to what replaced it.
- **A paged list and a move:** a move must not carry the row past the page edge out of sight - open
  the next page first, so the row and its ⋯ (where focus returns) stay drawn.
- **One ⋯ per header on a phone:** a component with its own ⋮ menu folds its verbs into the header's
  ONE sheet instead of drawing a second menu.
- **Stable tree positions:** a control that must survive an async state change (a ⋯ whose sheet may
  be open when the state lands) stays at ONE position in the React tree - fixed slots around it that
  fill in, never an early `return` of another wrapper with the control at a different child index.
  Otherwise the open sheet closes and focus on the ⋯ is dropped.
- **A sheet opened by an action must outlive the re-render that action causes.** An action
  revalidated, the page re-rendered without the card that opened the sheet, and the sheet died with
  it. Keep ONE tree: the card stays mounted and draws nothing but its sheet.
- **A sheet whose title/description are needed before a lazy body loads** keeps the (sr-only) title
  and description in the wrapper (Radix warns "DialogTitle missing").
- **A sheet body that needs a feature-gated block takes it as a `ReactNode` slot** from the wrapper,
  so the lazy body never imports the feature.
- **A toast covers a full-screen sheet's pinned header** (the toaster is top-centre above every
  sheet): a sheet opened right after a save clears the toasts as it opens.
- **The primary in a sheet header keeps its SHORT label while pending** (the spinner says it): a long
  "Sending the invite…" truncated the title at 390. Long words go to an `sr-only` `role="status"`.
- **The edit dialog moved onto the responsive dialog keeps Cancel on desktop only** (the sheet has
  ✕); a footer on the sheet draws an empty bordered strip.
- **A dialog that had its own Radix trigger, moved onto a controlled dialog:** the trigger becomes a
  plain button that sets `open`, the old `onCloseAutoFocus` becomes `returnFocusTo`, and the body's
  children need their own spacing (the dialog's grid gap is gone).
- **A dropdown item that opens a dialog instead of navigating:** keep it a real link (modifier clicks
  open a tab), `preventDefault()` on a plain click - which ALSO skips Radix's select-and-close, so
  make the menu controlled and close it yourself; the dialog returns focus to the menu's trigger.
- **Interactive content goes OUTSIDE `AlertDialogDescription`** - the description is read as one
  sentence.
- **A destructive verb sits at the FOOT** with the other destructive verbs, behind a destructive
  verb dialog that says what it will remove - never in a verb row beside the primary.
- **An (i) with a long explanation** opens a sheet on a phone tap (chosen at tap time with
  `matchMedia`, so nothing mounts twice) and a bubble on hover / focus on a computer; the bubble's
  text stays in the HTML for `aria-describedby`. Several (i)s on one screen each get their own name.
- **A popover inside a tile with `isolation: isolate; overflow: hidden`** is `position: fixed` and
  raises its tile while open, or the next tile paints over it.
- **Derive a sheet's open state from the path it was opened on** (`open = openedOn === pathname`),
  so any navigation closes it without an effect.
- **The shadcn / Radix Sheet slides even with reduced motion**: a new sheet adds
  `motion-reduce:animate-none motion-reduce:data-[state=closed]:animate-none`.
- **Server-rendered markup returned from an action can hide the whole sheet:** its first use needs
  client chunks not yet loaded, a plain `setState` suspends to the nearest boundary above, and React
  hides the shown tree with `display: none` (the sheet vanished and its slide replayed). Put the
  update in `startTransition` AND wrap the node in its own `<Suspense>` inside the sheet.
- **A controlled sheet keeps the last record mounted while it closes** (`shownId` beside `openId`),
  or its content blanks mid-animation.

## 6. Forms

- **A refused primary goes to the problem.** On a phone the primary is a pinned pill, so an error
  box at the end of the page is invisible. Scroll to the unfinished part, draw the words under its
  heading, mark the fields (`aria-invalid`) and move focus in (the invalid field, else the first
  unanswered group, else the heading; `scroll-margin-top` for the top bar). Read the problem LIVE
  after the first refusal.
- **A collapsed section that holds a failing field opens itself** and focuses the field on the next
  frame. An error behind a closed row is an error nobody sees.
- **A switch that removes fields clears their errors.**
- **A field the server did not receive keeps its stored value**; an emptied clearable field posts
  `null` explicitly. An absent key means "keep".
- **A field shown in another unit than stored (GB over MB) sends NOTHING when untouched** - otherwise
  an unrelated save rounds the stored value. Send only changed keys.
- **An edit action writes a new column only when the form sent it** (a tab opened before the deploy
  must not switch it off); a create writes the default.
- **`setBusy(true); await action(); setBusy(false)` freezes on a throw** (a dropped connection, a tab
  older than the deploy). Use `try / finally` or a settle helper that turns a throw into
  `{ ok: false }`.
- **Disable a verb through the refresh, not only the write:** `locked = busy || isPending` from
  `useTransition`; with busy cleared before the refresh lands, a second quick tap acts on stale state.
- **Save-at-once switches:** ONE busy key disables every control while any saves; the old value goes
  back on a refusal.
- **A value changed in a row (a role select):** while it saves, show the CHOSEN value, disabled, with
  a spinner, and drop the pending value inside the refresh's transition so it never flicks back.
- **A form drawn from initial values that something else can change** (an AI fill, Undo) needs a
  `key` bumped on each outside change, or the next keystroke writes the stale copy back.
- **A builder field whose stored value is a different spelling of what is typed** (a phone number
  stored as a link): remember what the field last wrote and ignore the document's echo of it, or it
  rewrites itself under the typist.
- **A choice that sets another field gives it back when left;** a value that must follow another is
  DERIVED at render, never kept in sync by edits.
- **A choice that only makes sense with another** is hidden or disabled with the reason in the hint -
  never a field that silently does nothing. A hidden choice's old value must not post.
- **Per-section saves:** one action with a discriminated union on the section writes only that
  section's fields; a pure merge REPLACES the section and keeps the rest - never "post the whole
  object from page load" (a second tab's stale copy undoes the first).
- **Refuse what you can in the client before the call** (a taken name in a list you already hold)
  so the refusal is in the screen's language.
- **A refusal comes back as a CODE** and the client words it; a code→words mapper must pass through a
  server sentence it does not know instead of swallowing it as "Something went wrong".
- **Phone inputs at 16 px** (`max-md:text-base`): iOS zooms on focus below that. A code field is
  `dir="ltr"` + monospace in both languages; its error line comes from the SAME pure checker the
  server runs.
- **A closed-list field on a phone is a native `<select>`** (the phone's own picker), 44-48 px, a
  `<Label htmlFor>`, a first "Not chosen" option that posts `null`.
- **A numeric field:** `type="number"` + `inputMode="decimal"` + `dir="ltr"`.
- **A file input's own words are the browser's** ("Choose Files / No file chosen" in English on an
  Arabic screen): make the input `sr-only peer` and draw a `<label htmlFor>` button with your words.
  Copy `Array.from(e.target.files)` BEFORE `e.target.value = ""` - a FileList is live.
- **With react-hook-form + a schema resolver:** the resolver hands submit the schema's OUTPUT
  (normalised values) typed as the form's input; if the server parses again anyway, submit what was
  typed.
- **A form over a column a migration has not added yet:** probe the column and hide the field until
  it answers; a switch that would promise something the database cannot keep refuses to turn on.
- **Leaving with half-typed edits:** each form reports dirty to one guard (`beforeunload` + the tab
  strip / back link ask "Discard changes?").

## 7. Lists, tables and paging

- **Page at ~20 with the total; pages come from the database's count**, never from "read the newest
  200 and filter in JS" (that lost rows and miscounted tabs).
- **A long folded list:** fold rows past N behind "Show all (n)" in one mount.
- **In a stacked-table CSS fallback, unlayered CSS beats every utility:** a `[data-stack] tr
  { display: block }` rule outside `@layer` made `max-md:hidden` on a row do nothing. Fold with a
  data attribute and your own unlayered rule.
- **A list of sentences is not a list row:** a row title truncates to one line, and a 200-character
  note must be read whole - use the list box with your own wrapping `<li>`.
- **A short list whose rows carry a select** (≤ 10 rows) is ONE list for both widths, the select on
  its own full-width line on a phone (`order-last basis-full md:order-none md:basis-auto`), with an
  `aria-label` that names the row ("Role for Sam"). An empty spacer of the same width keeps the
  desk's selects from zig-zagging.
- **A row's warnings that must be read whole** go on their own wrapping line, never in the truncating
  meta.
- **Group, then page:** slice the page first and draw one heading per group RUN in what it shows.
- **A sub-filter over a small list filters on the CLIENT** when the page already reads every row
  (≈ 5-10 ms instead of a 300 ms server render per tap); keep the choice in the address with
  `history.replaceState` (Next mirrors it into `useSearchParams` with no request; never
  `router.replace`, which is a server navigation).
- **A filter strip with ONE choice is noise** - draw it from two choices up.
- **A chip strip is a phone pattern; on a desk a long list WRAPS** (13 categories hid off the right
  edge at 1440). Keep the strip in `md:hidden` and a wrapping twin of plain toggles in `max-md:hidden`
  (stateless, so mounting twice is fine; no id inside either).
- **A table inside a chat answer wraps, it never scrolls:** `min-w-0 align-top
  [overflow-wrap:anywhere]` cells in a `w-full` table; amounts aligned to the end in LTR isolates. A
  streaming table is held back until its header, separator and one full row arrived (never a flash
  of raw pipes).
- **A table in a narrow drawer: drop a COLUMN before you shrink a cell** (move a state chip under the
  name in the pinned first column).
- **A table that scrolls sideways says so:** an end-side fade and one hint line while it overflows
  (a ResizeObserver + scroll listener), hint id from `useId`.
- **A swipeable row:** a ✕ on every row too, `touch-action: pan-y`, axis lock at ~10 px, a drag
  never opens the link (`onClickCapture`), screen edges left to the phone's Back gesture.
- **A view model built from `select *` drops every column the mapper does not name:** a feature probe
  on the raw row passed every unit test and never fired in production. Carry the field through every
  mapper and test the mapper's output.

## 8. Navigation, prefetch and tabs

- **Always-rendered nav lists prefetch on intent, never on sight.** With the default viewport
  prefetch, a sidebar's ~20 links fired ~20 server renders on every desktop load AND every refresh
  (and some language toggles then hard-navigated). Sidebar, drawer, section tabs: `prefetch={false}`
  + prefetch on hover / focus / touchstart. A phone bottom bar (≤ 5 links) keeps the default; links
  inside page content are left alone. In Next.js 16, `router.prefetch(href)` defaults to `auto`, so
  pass the kind you mean.
- **In Next.js, a same-route `?tab=` / `?filter=` change never shows `loading.tsx`** (its boundary is
  above, already revealed): the old tab stays frozen until every read finishes. Render the title,
  then `<Suspense key={the URL's own fields}>` around the body - a NEW boundary in a transition shows
  its fallback. Key on the address's fields (never a computed `now`), and never on a search box that
  lives inside the boundary (a key on it remounts the field mid-typing).
- **The price of a skeleton is React's ~300 ms reveal throttle:** once a fallback has shown, React
  holds the content until ~300 ms after. Worth it where reads are slow.
- **A tab route's `loading.tsx` draws ITS page's frame** (the title, the tab strip with the tapped tab
  open, a body skeleton of that page), not a generic skeleton.
- **In Next.js, a `loading.tsx` above a layout that calls `notFound()` makes the 404 a 200** (the
  fallback streamed first). Put loading files with each page group, never above a layout that may
  404.
- **In Next.js, a `redirect()` in a page under a `loading.tsx` becomes HTTP 200 + a meta refresh.**
  A real permanent redirect for a moved page lives in middleware / the proxy; keep the old page as a
  redirect stub for prefetches the middleware never sees. A `#hash` never reaches a server.
- **A moved page keeps its address:** a redirect stub that keeps the query (and maps old tab keys);
  every deep link, search entry and in-app link moves in the same PR.
- **After an action that revalidated, no `router.refresh()`.** In Next.js the action's response
  already carries the re-rendered page; a refresh after it is a SECOND full render (a "6-7 s" Discard
  was ~180 ms of work and two renders). `router.refresh()` is only for a change no action
  revalidated - inside `startTransition` when a control shows pending for it. A stale page after a
  save is a bug to find, not a timer to add.
- **A file export is a plain navigation, never a `<Link>`** (`location.assign(href)` or
  `<a download>`): a Link prefetches the export route on hover / in the viewport.
- **A server action fired alongside a navigation is aborted.** "Mark read on tap" beside a link is a
  `keepalive` POST to a route handler.
- **A link that is also an in-place opener** is an `<a href>` whose onClick calls the opener and
  `preventDefault()`s only when it opened (a modifier click still opens a tab).
- **`navigator.share` must run inside the tap** (a read after it loses the gesture on iPhone); use it
  on `(pointer: coarse)` only.
- **One door per section in the menu:** a section of related pages is ONE sidebar row that stays lit
  on every page under it, plus the section's tab strip. Two rows are two doors on a phone.
- **A tab strip's words come from ONE helper** - passed page by page, a tab vanishes from the page
  that forgot it.
- **A tab or option hidden for a kind of account hides everywhere it is listed:** the strip, the
  phone list, the crumb, the page (`notFound`), the action, and the search.

## 9. Streaming and server reads

- **Phone-only server reads must not block the desktop render:** stream them in their own Suspense'd
  server component, never in the page's `Promise.all`, and never client-fetch them in the hidden
  branch only.
- **A streamed card's read starts in the PAGE, not in the Suspense child** - an async child starts
  only after the page's own reads resolved. Start the promise right after auth, pass it down, await it
  in the child; add a no-op `.catch` so a page that throws first leaves no unhandled rejection.
- **A streamed value that feeds a CLIENT control:** pass the promise down un-awaited and let the
  control paint at once without the value (`use()` inside its own Suspense). Its Suspense is KEYED per
  server render - a navigation / refresh is a transition and React would hold the whole commit on an
  already-revealed boundary that suspends again. The promise never rejects (a rejected `use()` throws
  into the page).
- **Derive a second streamed value from the first ON THE SERVER:** a `.then()` on a streamed promise in
  a client render is a new promise every render and suspends again.
- **A notice on EVERY page goes in a shell slot, streamed with `fallback={null}`:** start its read in
  the layout, hand the promise to an async child; the pages with nothing to say draw nothing and shift
  nothing.
- **Size a skeleton to the SHORTEST answer:** a heading + three tall rows collapsing to one-line "All
  clear" moved the page up. Rows only ever grow it downwards. Keep a closed row's state line short so
  it does not outgrow its skeleton.
- **One read shared by the banner, the layout count and the card:** wrap it in React `cache()`.
- **A query builder that is a thenable starts only when awaited** (Supabase): to run reads in
  parallel inside `Promise.all`, pass the builders themselves - building one first and awaiting it
  later runs serially.
- **A count the form needs on open rides the list read** (an embedded count), never a read on open.
- **Work the layout does on every visit** (a "last seen" stamp) goes in `after()` behind a guarded
  helper (`after` throws outside a request scope), as one conditional UPDATE that matches no row after
  the first visit of the day - never a read first.
- **An attribute a client script sets on server HTML is a hydration warning:** `suppressHydrationWarning`
  on exactly those elements.

## 10. Honest numbers

- **A count that failed is NO number (`null`), never 0.** "Hidden 0" over hidden products is a lie.
  "Could not count", "Not available yet (next deploy)", "No readings yet" - every state says what it
  is. A 0 ms speed reading reads as "instant".
- **A count with no source is said in words**, never a 0 tile.
- **A total the user reads is never a JS sum over one capped read:** an aggregate in the database,
  proven equal to the JS reducer on a shared fixture. PostgREST returns at most 1,000 rows whatever
  `.limit()` asks. A long list pages with a unique last sort column, and a failed page is an error,
  never "the end of the list".
- **A check that decides a DELETE is complete or absent** - one shared paged check.
- **A badge and the list it opens count the SAME kinds**, and the chip for a list reuses the list's
  own exact total instead of counting twice. Pin it with a fixture test.
- **A list and the total above it come from ONE function** (a cancelled line was listed under a total
  without it).
- **Two readers of one limit:** one pure function for "effective allowance", and every surface (meter,
  includes list, compare block, team page) takes its result.
- **A count that mixes two kinds (sold vs gifted) is split, never relabelled.**
- **A tile that counts something links to the list behind it.**
- **A filter by a related table keeps the database's count** (an inner embed filter), never a JS
  filter of one page and never a long `in.(ids)` list in the URL.
- **`count(*) filter (where not x)` counts nothing when x is NULL** - `coalesce(x, false)`.
- **Samples are not stock:** a cap line counts what the cap counts (real rows, not seeded samples);
  an offer that depends on the user's first real thing shows nothing until then.
- **A number is never truncated in a tile:** use a compact form and keep the exact figure in an
  `sr-only` span.
- **A chart is never the only way to read its numbers** - print them beside the bars. An empty card
  is a STATE with words, never a zero chart; a sparkline for an empty week is `null` (a flat line says
  "steady" when the truth is "nothing yet").
- **Colour says WHAT a number is or a STATE, from one map - never colour alone** (an icon AND a word:
  "Active").

## 11. State that outlives a view

- **Browser-wide state shared by chunks lives in ONE store**, never a local copy (a phone banner with
  its own install-prompt copy showed a dead Install button). Announce changes through the store so
  mounted readers re-read it.
- **A stateful view inside a closable sheet keeps its state OUTSIDE the sheet** (a store held by the
  layout): closing a chat drawer loses nothing and an answer keeps streaming.
- **Anything a person can navigate away from inside one shell** (a chat, a long draft) is held by the
  shell's LAYOUT, never the page. Across a reload remember only the record's id in `localStorage`
  (guarded, per scope) and reload it through the normal server path; never store the content itself
  in the browser.
- **A module-level store is SHARED BY EVERY REQUEST on the server.** One seeded per account on the
  server drew the first visitor's rights for the next one (React does not patch attributes on
  hydration). Create such stores in the browser only; the server snapshot of `useSyncExternalStore`
  is THIS caller's prop; per-caller rights come from props computed per request. Test by rendering two
  callers in a row.
- **A per-account client list keeps an idle server snapshot** (the empty state), so the first HTML
  and the hydrated tree agree.
- **Optimistic state is a pure reducer:** start → saved / failed (put back EXACTLY what was there) →
  refreshed (drop what the new list already shows, never the one still being written). An
  optimistic reducer that must hear the refreshed list adjusts during render
  (`if (seen !== items) { setSeen(items); dispatch(…) }`), not in an effect.
- **Back to a cached list needs a client memory of what was opened:** the router cache keeps the old
  page, so opened keys go into a small per-tab store the list applies on mount.
- **A long run of many calls from the open page** lives in a component kept mounted once used,
  outside its dialog (✕ never stops it), one call per item over a pure reducer; unmount stops after
  the current call; unknown answers STOP the run; everything paid for is a record the moment it
  exists, with a door to find it later.

## 12. Fitting the screens budget

- **Fold, never loosen.** A page at its budget gets a new desk table / card / legend as ONE closed
  `<details>` on the phone whose 44-48 px summary carries the headline ("1 of 10 today · $0.55 this
  month (est.)"); on a desk the tiles in `max-md:hidden`, or the same `<details>` on every width.
- **Budget arithmetic:** about 100 px per card or hint row; five folded disclosure rows ≈ 280 px. On a
  page near its budget keep EVERY group folded, not only those after the first.
- **A card measured EMPTY grows the page once real data lands** (Analytics went 5.4 of its 5 screens
  with the first real chats). On a phone keep the title and count tiles and fold the detail behind
  one 44 px toggle - one mount, hidden `max-md:` only while closed. Check a data card's page with data
  in it.
- **A charts page at its budget pages its LAST list shorter on a phone** (10 rows) rather than taking
  a looser budget.
- **A setup state is a mode of the page, not one more card:** one pure rule decides it, and the page
  drops its zero tiles and duplicate checklist.
- **Count the layers on a first visit:** an install banner, a coach tip, a samples box, the pinned
  pill and a floating button before one row of content. One notice at a time; the next step goes
  FIRST in its box, not under the pinned pill.
- **Long settings pages:** see `patterns.md` (server tabs on one `?section=`).
- **A gate measures folds CLOSED.** It does not see what is inside a closed `<details>` except its
  targets - so open one by hand at 390 in both languages before merging.
- **Do NOT use `content-visibility` to save work** - it hides off-screen content from the gate.

## 13. Bundle weight

- **The kit and the shell are in every route's bundle.** A new sidebar icon or kit prop grows every
  route. Reuse icons the shell has; build page-specific twists from slots; keep empty-state art and
  other page-only pieces outside the kit.
- **A client module never imports a VALUE from a dictionary hub** (a module with both languages' full
  words): one language toggle importing a cookie helper from the hub carried ~9.5 kB gz of another
  feature's words into every route. Pass words as props, typed as a `Pick<>` of the dictionary.
- **A server action used inside a client view is loaded with `import()` on tap** - a static import
  pulls a `"use server"` module into the view's chunk and into every render test.
- **In Next.js, a server component importing a module that holds `() => import("./client-x")` thunks
  bundles every target into the page's first load** (+12 kB on the route, no lazy chunk). The server
  reads an import-free ids/flags module; the loader map lives in a module only the client imports.
- **Every async chunk adds an entry to the one webpack runtime shared by the whole app:** lazily
  loading an admin-only dialog put bytes on every public route. When a budget fails by a few bytes on
  routes you never touched, compare the runtime chunk first; for an admin-only dialog a static import
  may be the cheaper choice. Many lazy chunks can be one named chunk.
- **A lazy preview inside a closed `<details>` loads on the `toggle` event, never on mount** - a closed
  body is still in the React tree.
- **Any new client module on a hub page (the home / overview) may be paid by every sibling route**
  (shared client-reference grouping). Use a tiny launcher: the button only, the dialog via
  `next/dynamic` on hover / focus / tap.
- **A schema library that does not tree-shake** (zod 4 classic) costs a budget line in any client
  module that holds a top-level schema: keep schemas in their own module, load them lazily, validate
  on the server anyway.
- **Measure a bundle change with an A/B in the SAME folder** (two builds of one checkout): two
  worktrees differ by ~300-400 B of noise.

## 14. Words, locks and plan-aware screens

- **Words follow what the account can do:** a plan without a feature never names it - titles, tabs,
  tiles and refusals read one helper.
- **An option the account cannot get is not drawn** (a disabled "coming soon" reads as a broken
  promise). A stored value the screen no longer offers is SHOWN and posted only when moved.
- **An advanced piece the plan does not include is a LOCK, never a hole:** where the control would be,
  a note with the plan's name, its price (from one source, never typed in a component) and the door
  to upgrade. A locked tab beats a missing one.
- **A primary the viewer may not use stays drawn, `aria-disabled`, and its tap says why** - never
  `disabled` (no tooltip on a phone) and never hidden (the page's primary would vanish). Its
  accessible name carries the reason. A tool off WITH a reason on a desk tile stays tappable the same
  way.
- **A locked control says WHO set WHAT**, shows the effective value read-only, and keeps the user's
  own saved choice for later.
- **A narrow role (e.g. "orders only") is held three times:** the database's row rules, the actions,
  and the pages (redirect to its one page) - and its shell is just its menu (no search, no AI button,
  nothing that only answers "not authorized").
- **The price is ON the primary** for a paid action ("Make it · 10 credits"); short of credits the
  primary becomes "Buy credits".
- **A request that leads to an invoice gets a confirmation step** (the pinned pill only opens the
  dialog; only the dialog's primary posts).
- **A dependent write after the main one reports, never undoes**, and says why with the way out.
- **A sentence on every page names its subject** ("AI margin check: …", not "Not enough data").
- **A separator is a WORD in the dictionary** (see `rtl.md`: « · » between Arabic-Indic digits reads
  as a zero).
- **A short chip label ("Mon") gets `aria-label` with the full word**, never a visible abbreviation +
  an `sr-only` tail (it reads as "Mon day").
- **A stored English summary is a KEY, never copy:** write a known key, translate on read, show an
  unknown value as stored.

## 15. Accessibility details

- **A chat log announces the SETTLED answer once:** VoiceOver ignores `aria-busy` and re-reads text
  nodes that rich text swaps mid-stream. Keep the in-flight answer `aria-hidden`, the log
  `aria-live="off"`, speak the finished answer once through an `sr-only` polite region.
- **A frame that scrolls sideways is a keyboard stop:** `tabIndex={0}` + a name + `role="group"`
  (axe `scrollable-region-focusable`). A long `<pre>` in a sheet the same, plus `dir="ltr"`.
- **A Radix `SelectTrigger` is `role="combobox"` and takes no name from its value** - label it.
- **`aria-controls` must point at a rendered element**; a glyph span with `aria-label` needs
  `role="img"`.
- **A link whose accessible name differs from its text must CONTAIN the visible text** (WCAG 2.5.3).
- **Rail tooltips** appear on hover and `:focus-visible`, and go on Escape, pointer leave, blur,
  scroll and navigation (WCAG 1.4.13).
- **A before / after slider:** an invisible `<input type="range">` carries keyboard and screen reader,
  the frame's pointer handlers carry the finger (`touch-pan-y` keeps vertical scroll).
- **An info tip on a list row can be a native `<details>` whose `<summary>` IS the row** - no
  tooltip, no client code, a disclosure for screen readers.
- **A radio-tile gallery:** one visually hidden native radio per tile inside its `<label>` (the whole
  tile is the target, the ring on `focus-within`, arrows move the choice natively).
- **Reduced motion means the final state** - and design what the animation DRAWS at rest; the
  author's own machine may have animations off, so say so where it matters ("Play shows a fade only").

## 16. Testing traps

- **Every phone list has a hidden desktop twin:** scope locators to the visible copy
  (`locator("…").locator("visible=true")`, or a drawer test id) or the test finds the hidden one.
- **Wait for either surface:** `:is([data-slot=dialog-content],[data-slot=sheet-content])`.
- **A screenshot right after a wait can catch a sheet mid-slide:** sample `boundingBox()` at 50 / 300 /
  800 ms before calling a layout broken.
- **A screenshot script reusing a signed-in session must not copy its theme / language cookies**
  into every context - every "dark" and "ar" shot came out light and English.
- **A double-click is two clicks:** Playwright's `dblclick` fires both within ~4 ms; a human repro is
  down / up · wait 120-250 ms · down / up.
- **Playwright has no swipe:** use CDP `Input.dispatchTouchEvent`.
- **`.fill()` before hydration submits an empty form:** wait, fill, READ the value back (or
  `pressSequentially`).
- **A killed browser is not a closed sheet** - cleanup on close never ran; read the close path before
  reporting a leak.
- **A React key warning is reproducible without a browser:** render the real component with fixtures
  under a `console.error` spy.
- **A render test of a list that imports a heavy dialog can time out:** mock the dialog module (it is
  closed in that render). A client link breaks static-markup tests without a mocked router.
- **A fixture date across a DST change moves a local day.**
- **Parallel builds and test runs starve each other** (timeouts in unrelated files): run the build,
  the gate and the full suite alone; re-run failing files alone before reading an assertion.
- **A probe whose state comes from live data** (alerts, badges, tips) is invisible on an empty demo -
  check those pages with the state present.
