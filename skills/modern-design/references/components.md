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

## Portrait cards (agents, team, people)

- Desktop: a portrait-led card - a large picture area, the name and role over a gradient at its foot, a tint per category so five cards are not five identical panels; then a one-line "what they do", a status chip, the figures as a glass strip, the action.
- **Rows line up.** Fixed slots (description clamped to N lines, chip + meta on one line, figures strip and button pinned to the bottom) or `subgrid`. Unequal text must not push one card's figures 20 px off its neighbours'.
- **Phone:** never crop a face to a slice. Keep a ~144 px band on the card's tint with the **whole head and shoulders** as a contained figure on the start side (its inner edge masked into the tint) and the name **beside** the face, not over it. Check each crop individually (glasses, headsets, hair).
- Generated portraits: one consistent framing, light and background family so they read as a team; dressed for the role; a new file name whenever a picture changes (caches); and wherever the public can see them they must not read as real staff.
- Hover lift on desktop only.

## Profile page

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
