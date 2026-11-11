# Components - recipes and the failure each avoids

## Greeting header

"Good morning, Sara" + the date; when something needs attention, the count joins the date line ("Tuesday, Nov 10 - 3 things need you").

- No name on the profile -> the greeting alone, never "Good morning, undefined". Make sure the person **can** set their name somewhere.
- Nothing waiting -> say nothing. A section whose content is "nothing needs you right now" should not render at all: no heading, no empty card, no gap. A *failed* read is not zero - show the section with its error.
- A fallback that reserves no height, so the common "nothing" case does not flash a skeleton and collapse.

## Stat tile

Icon chip (tinted), label, the value large, a sub-line, an optional delta chip. Nothing else.

- **One rule for zeros** across all tiles (all full ink is the safe choice).
- A tile must be readable alone: "Orders - 7 days / 1 / 2 in the last 30 days / +114 % vs 30-day avg" - not "1 / 2 - 7 / 30 days".
- The delta chip says what it compares. On a phone show the short form ("+114 %") and put the comparison in the sub-line - **never an ellipsis in a number chip**.
- Decorative art in a tile corner is a taste choice (some owners love it): keep it quiet, clipped to the corner, and **never shaped like a chart** next to a real number.
- A row of tiles shares baselines: same padding, same icon position, same value line.

## Hero card

One per home screen. Gradient or accent surface, label, the key number at display size, delta chip, sparkline along the foot, the period switch attached. Counts up and draws on (see motion). If it repeats a number that is also a tile, remove the tile. When a chart lives inside the hero and there is no data, show **one** empty message - the hero's - not the hero's and the chart's.

## Charts

- Rounded bar tops, the accent colour, the current period highlighted; faint grid; labels from tokens so both themes read.
- A period switch as a segmented control in the card's header.
- **The empty chart** is the first thing a new owner sees. Not "$0.00" over an invented $1-$4 axis. Drop the scale; keep the period labels on a baseline; centre a quiet icon, one sentence ("No paid invoices in this period yet.") and the action ("Open Billing"). Composed at the card's full height.
- Always review a chart twice: with zero data and with fixture data.

## Lists and tables on glass

The filter bar is one glass strip (search + chip groups; **every** chip group labelled, or none - mixed labels put the groups on different baselines). Rows: avatar or thumbnail, primary + secondary text, status chip, actions at the end. On a phone, rows become cards or a two-line list with a row-actions sheet.

A table's header row has its own quiet fill - one token (`--table-head`: the brand colour at about 7 % over the card in light, one step over the card in dark), opaque, set in the shared table primitive. A header the same colour as the rows reads as another row; a translucent sticky header lets rows show through it.

## Content first (the "dense page" cure)

A page can pass every size and contrast check and still be hard to use: three rows of tabs and two paragraphs before an empty box. Total page length does not catch it. Measure these on the phone for every page, and budget them:

- **Content top** - where the first row, tile, field or empty state begins: 320 px or less (380 with a record header).
- **Navigation levels** stacked above it: two at most.
- **Wrapping rows** of tabs or filters: none.

The cures, each a rule:

| Seen | Rule |
|------|------|
| Three levels of tabs | Two levels on a phone. The section strip stays; the page's own tabs and its status filter merge into ONE chip row with counts - statuses first, a separator, then the other views ("To approve 3 · To be paid 1 · Done · Declined | History"). |
| Instructions as paragraphs | One line, then the "i". How-it-works text lives in the hint beside the title with a "read the guide" link; words that matter at the moment of action go on the action itself. A test fails a subtitle over a one-line character budget that has no hint. |
| A filter block before any data | Filters are chips in that same row ("This month", "Filters · n" opening a sheet). Search is an icon unless the page's job is search. With an empty list and no filter set, the filters are not drawn. |
| An empty box under a wall of controls | A queue opens on the first stage that has work. When everything is empty: one card - icon, title, ONE sentence, one useful action. No table frame, no "0 items" line. A count that failed to load is never read as "all caught up". |
| The record header repeated on every tab | Full header on the overview only; elsewhere one line with a "more" button. |
| One long form | A list of groups, each showing its current value and opening its own screen with its own save and eight fields at most. |
| Two filled buttons | One filled primary per screen; the rest outline; rare or destructive ones behind "more". |
| Verbs far from the record | The action sits on the record's row (Approve, Mark paid); the destructive one is last, behind "more". |

**Chips that change the address are links** (`<a href>`, `aria-current` on the true page, the strip a `nav`); chips that toggle something on the page are buttons with `aria-pressed`. A link chip still answers a tap at once: the tapped chip takes the open look immediately (the framework's pending-link signal, or a small optimistic state reset on route arrival, Back / Forward and cancel), while `aria-current` waits for the route. A modified or middle click lights nothing.

**Advice is not content.** A home page that opens with "set up your shop", "needs a look" and "we noticed" before any number treats every owner as someone with homework. Numbers first; all advice folds into ONE quiet row (a compact button beside the page's actions on a desk) that opens a panel; each tip can be hidden for a period and shown again; urgent things (orders to confirm, unpaid invoices, limits reached) are not tips and stay on the page. When there is nothing to show, the row is not drawn.

## Portrait cards (agents, team, people)

- Desktop: a portrait-led card - a large picture area, the name and role over a gradient at its foot, a tint per category so five cards are not five identical panels; then a one-line "what they do", a status chip, the figures as a glass strip, the action.
- **Rows line up.** Fixed slots (description clamped to N lines, chip + meta on one line, figures strip and button pinned to the bottom) or `subgrid`. Unequal text must not push one card's figures 20 px off its neighbours'.
- **Phone:** never crop a face to a slice. Keep a ~144 px band on the card's tint with the **whole head and shoulders** as a contained figure on the start side (its inner edge masked into the tint) and the name **beside** the face, not over it. Check each crop individually (glasses, headsets, hair).
- Generated portraits: one consistent framing, light and background family so they read as a team; dressed for the role; a new file name whenever a picture changes (caches); and wherever the public can see them they must not read as real staff.
- Hover lift on desktop only.

## Profile page

- **The door must be findable.** A new personal page needs a labelled row ("My profile", with the picture or initials) where people already look - the Account menu on desktop, the More sheet's account strip on a phone. A bare avatar circle, or a pill that looks exactly like what was there before, is not a door: the owner will report the page as missing.
- Opens with **identity**: avatar 72-96 px (picture or initials) with a small camera button on its corner, the name as the heading, the role as a chip.
- Two columns on desktop (identity + sign-in / security | details + language and appearance), one on the phone. Not one narrow column beside an empty half.
- E-mail read-only with the reason; password as a link stating its consequence ("signs you out everywhere else").
- A state that cannot save **looks** read-only: flat disabled fields, no Save button - a banner alone is not enough.
- Copy is checked per audience: "ask the support team" is wrong on the support team's own page.
- Appearance: light / dark as a light segmented control; optionally a background picker from a curated set.

## Segmented OTP input

- **Six digits** for sign-in (four is too weak), one box each; `inputmode="numeric"`, `autocomplete="one-time-code"`; auto-advance, Backspace steps back, paste fills all, auto-submit on the last digit, and a visible Verify button too.
- The group is `dir="ltr"` with Latin digits even in an RTL page.
- States: idle, focused, filling, checking (disabled + spinner), wrong (one shake, cleared, focus to first, message in a live region), verified (green settle, then continue). A resend with a visible countdown.
- Each box labelled "Digit 1 of 6"; 44 px on a phone.
- The security lives on the server: codes hashed, single use, short life, attempt and resend limits, and enabling it requires passing one code first so nobody locks themselves out.

## AI chat panel

Presentation over an engine - the look must never require data the engine does not have.

- **Header:** the assistant's mark in a tinted chip, its name, a truthful state line (Ready / Thinking / Working on it / Waiting for you), and a response-time pill only from a measured time.
- **Bubbles:** the person and the assistant are clearly different surfaces; 16-18 px corners with the tail corner tighter; small timestamps; entrance <= 180 ms; a three-dot typing indicator; streamed text that never makes the thread jump (anchor to the bottom unless the person scrolled up, then a "New reply" chip).
- **Rich cards inside replies:** a quote, an order, a product, a proposed change is a card - icon tile, title, two or three facts, the figure large, actions in a fixed place - with distinct states (proposed, applying, applied, partial, refused with the reason, undone).
- **"What the assistant did":** a timeline - icon, sentence, time - arriving step by step, the running step with a quiet spinner, collapsing to "3 steps - 6 s" when done.
- **Context panel** (desktop): the thing the conversation is about - header, its real stage as a stepper, fact tiles filling in as they are learned, one action. Collapsed strip on a phone. No panel for general talk.
- **Composer:** a floating glass pill - attach, text, a round send button with real states (idle, sending, stop).
- **Empty state:** the mark, one line of what it can do *here*, four suggested asks for this screen.
- **Never** a score or probability the system does not compute.

## The assistant's mark

- Offer **three animated candidates on one comparison page** - real sizes (20 / 24 / 32 px), real contexts (launcher button, chat header, top bar, tab bar), both themes, states idle / thinking / has-a-note, a Moving / Still switch, the current icon beside them. Never ship one guess for a brand element.
- A candidate must look new **at rest**, not only in motion - most of the time it is still.
- Signals must survive 20 px: a halo pulse or a dot reads; a thin glint does not.
- **Judge a toolbar mark in the toolbar,** at its real size, beside its neighbours and today's icon. A drawing that is lovely at 96 px can be a smudge at 24 px: tall "figure holding a thing" compositions become totems and side-by-side pairs become two blobs.
- In a **combined icon** (a mark plus a companion figure) the main shape keeps at least 55 % of the box; put the companion around or under it, not beside it. Compositions that fail in the toolbar are still good illustrations for empty states and welcome screens.
- A note / status badge belongs to the whole icon, not to a nested part.
- **Making one shape read as INSIDE another at icon size:** three layers - a back layer (dark recess + glow), the content, then a front plate with the window cut out and glass over it. Let the plate overlap the content's edge and clip the content (and its glow) to the window. An object merely placed on a cup or stand reads as "on", never "in".
- **Making an icon feel "real":** one light source, three layers (a lit shell, a dark recess, a glowing core) and a contact shadow. Keep the shading static; animate only a light travelling along a path plus small moves. Fine detail (seams, bolts) vanishes under ~96 px, so choose between finishes at the shipping size in the real bar, not in the close-up.
- **Decide the forms before drawing candidates.** Owners reject a colour mark inside a row of line icons, so every candidate needs both forms from the first round, or a round is wasted.
- In a 16 px icon, a "thinking" animation only reads if the moving part is a **different colour** from the icon's ink (an accent-coloured scan, tip or trace); a 2 px movement in the same grey is invisible.
- Two forms: the colourful animated mark where it stands alone (a launcher button, a chat header); a monochrome line glyph where it sits in a row of icons (a tab bar, a sidebar row). A third place, a top bar of icon buttons, may want its own answer - an *animated line icon* in the row's ink - so ask rather than assume.
- Expect the pick to split by place: one owner chose a glass orb for the launcher and chat, a plain sparkle for the tab bar, and asked for a new "robotic" animated line icon in the top bar. Show each candidate in every place it could live.
- SVG + CSS, a couple of kB, static under reduced motion.

## Status tracker

Built from the entity's **real** statuses (never invented steps); done steps filled, the current one marked, the connector drawn between them; cancelled as its own terminal look. Mirrors in RTL.

## Component checklist

- [ ] Zero / empty state designed for every card that can be empty
- [ ] Each tile readable alone; deltas say what they compare
- [ ] Card rows share baselines
- [ ] No face cropped; no text over a face
- [ ] Read-only states look read-only
- [ ] Nothing shows a number the system does not have
