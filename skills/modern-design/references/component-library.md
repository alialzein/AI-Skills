# Component library - every part, in every style

Anatomy, sizes and states are the same in all styles; the **style column** says what changes. Dashboard-specific compositions (hero, portrait cards, AI chat, OTP, profile) are in `components.md`.

Style keys: **G** Aurora Glass - **M** Clean Minimal - **S** Soft Depth - **N** Dark Neon - **B** Bento Bold - **T** Tonal - **D** Dense Pro.

## Foundations (set once)

| Thing | Rule |
|-------|------|
| Spacing | 4 px grid; component padding 8 / 12 / 16; section gaps 16 / 24 / 32 |
| Type scale | 12 meta - 13/14 body - 16 lead - 20 title - 28 page title - 40+ display number; line-height 1.4-1.5 body, 1.1-1.2 headings |
| Numbers | `tabular-nums`; money and counts never wrap or truncate |
| Radii | One scale per style (control, card, panel, pill); nested radius = outer minus the padding |
| Elevation | Three levels only: surface, raised (cards / bars), overlay (menus, dialogs, sheets) |
| Focus | A visible 2 px ring in the accent with 2 px offset on every interactive element, both themes |
| Targets | 44 px on touch; 32-36 px is fine for mouse-only dense tools |
| States every control has | default, hover, focus-visible, pressed, selected, disabled, loading, error |
| Icons | One family, one stroke weight, 16 / 20 / 24; directional icons flip in RTL |

## Actions

| Component | Anatomy and rules | Style notes |
|-----------|-------------------|-------------|
| **Button** | Label (+ icon); primary (one per view), secondary, quiet / ghost, destructive. Heights 32 / 40 / 48. Loading = spinner replaces the icon, width does not change; then success in place where it matters | G: primary solid accent, secondary glass with hairline. M: secondary is a hairline outline. S: raised fill + soft shadow, pressed = inset. N: outline with glow on hover; primary filled accent. B: big pills, strong fill. T: filled / tonal / outlined / text ladder. D: 32 px, tight padding |
| **Icon button** | Square or round, tooltip always, 40 px touch | G/T: round with tinted ground on hover. M/D: square, ground appears on hover only |
| **Split / menu button** | Primary action + caret opening a menu | Same surface as Button; divider is a hairline |
| **Segmented control** | 2-4 options in one track; the thumb slides (transform); selected has the surface, not a full accent block | G: glass track, lighter thumb. M: grey track, white thumb. T: tonal thumb. N: outline thumb with glow |
| **FAB / launcher** | One floating round action (compose, assistant); clears the tab bar and safe area | G/N: the place for an animated brand mark. M/D: often unnecessary |
| **Link** | Accent ink, underline on hover / focus; external links marked | - |

## Inputs

| Component | Anatomy and rules | Style notes |
|-----------|-------------------|-------------|
| **Text field** | Label above (never placeholder-as-label), field 40-44 px, help text under, error text replaces help and is announced; prefix / suffix slots | G: translucent fill + hairline, solid enough for 4.5:1. M: 1 px border, accent ring on focus. S: inset look. N: dark fill, accent border on focus with a faint glow. T: filled container, bottom emphasis. D: 32 px |
| **Textarea** | Grows to a max height, then scrolls | as Text field |
| **Select / combobox** | Field + overlay list; search when > 8 options; selected item checked; on a phone it is a bottom sheet | Overlay is the style's overlay surface (G: thicker glass; M: white + shadow) |
| **Checkbox / radio** | 18-20 px box, label clickable, group has a legend | T/S: larger, rounder. D: 16 px |
| **Switch** | For instant settings only (forms that need Save use checkboxes); thumb slides | G/T: accent track when on. M: black / accent |
| **Slider** | Track, thumb 20 px+, value shown | N: glowing track fill |
| **Date / range picker** | Field + calendar overlay; presets (Today, 7 days, 30 days) first; sheet on a phone | - |
| **File upload** | Drop zone with icon + sentence + browse button; per-file row with progress, done, error + retry | G: dashed hairline on glass. M: dashed border |
| **Search** | Leading icon, clear button, shortcut chip; opens the command palette in app shells | See `shell-desktop.md` |
| **OTP input** | See `components.md` | - |
| **Form layout** | One column on phones; labels above; groups with headings; a sticky action bar that appears when the form is dirty | - |

## Display

| Component | Anatomy and rules | Style notes |
|-----------|-------------------|-------------|
| **Card** | Surface + optional header (title, action) + body + footer; padding 16-24 | G: glass recipe. M: hairline, no shadow. S: raised. N: outline + faint inner glow. B: solid colour fills, big radius. T: tonal container. D: 12 px padding |
| **Stat tile / hero** | See `components.md` | B: one tile in a strong fill; N: number with a faint glow |
| **Badge / chip** | Status = tinted ground + same-hue ink (+ a dot); filter chips are toggle buttons; count badges are pills, "99+" past 99 | M: quiet tints. N: outline chips. T: tonal. Semantic colours are not the accent |
| **Avatar** | Picture or initials on a tinted ground; sizes 24 / 32 / 40 / 72; a ring when stacked | - |
| **Table** | Sticky header, sortable headers with a visible sort state, row hover, selection column, numeric columns right-aligned (end-aligned in RTL), row actions at the end; empty and loading states; on a phone -> cards or a two-line list | G: rows on one glass panel, hairline dividers. M: plain rows. D: 32-36 px rows, zebra optional, column resize |
| **List row** | Leading (avatar / icon / thumb), primary + secondary text, trailing (value, chip, chevron); 56-64 px | - |
| **Tabs** | Underline or pill tabs; the indicator slides; overflow scrolls sideways with fade edges | G/T: pill tabs. M/D: underline |
| **Accordion** | Header button with chevron; one or many open; content fades in, height is not animated on big blocks | - |
| **Progress** | Bar (determinate), ring (goals), stepper (stages); always with the number or the step name | N: glowing fill. G: gradient fill |
| **Chart** | See `components.md` and `motion.md` | N: glow on the current bar / line. M: single accent + greys |
| **Skeleton** | The shape of the content, shimmer optional and slow; no skeleton for things that may turn out empty | G: translucent blocks. M: grey blocks |
| **Empty state** | Icon, one sentence, one action; composed in the space, not stuck at the top | All styles |
| **Timeline / activity** | Icon, sentence, time; newest first; grouped by day | - |
| **Tag input, rating, code block, map, calendar** | Follow the same surface and focus rules; add to this table when a project needs one | - |

## Navigation

| Component | Anatomy and rules | Style notes |
|-----------|-------------------|-------------|
| **Sidebar** | See `shell-desktop.md` | G: floating glass panel. M/D: flush column with a hairline. T: tonal rail with pill highlights. N: dark panel, active row with an accent edge glow |
| **Top bar** | See `shell-desktop.md` | G: floating strip. M/D: flush with a hairline |
| **Tab bar (phone)** | See `phone.md` | G/N: floating pill, bell or pill indicator. M: flush bar with a hairline, tinted active icon. T: pill-shaped active indicator behind the icon |
| **Breadcrumbs** | Only when depth > 2; the last crumb is the page, not a link; collapses to a back button on phones | - |
| **Pagination** | Prev / next + page numbers, or "Load more"; never both; shows the range ("21-40 of 312") | - |
| **Command palette** | Overlay, input on top, grouped results, keyboard hints, recent first | G: thick glass. M: white, strong shadow |
| **Stepper (wizard)** | Steps with labels, the current one clear, done ones checked, Back always available | - |

## Overlays and feedback

| Component | Anatomy and rules | Style notes |
|-----------|-------------------|-------------|
| **Dialog** | Title, body, actions (primary at the end); focus trapped and returned; Escape closes; on a phone it becomes a sheet | G: thick glass + dim. M: white + shadow. Blur-to-sharp entrance is allowed here |
| **Confirm (destructive)** | Says what will be lost; the destructive button is named by the verb ("Delete 3 products") | - |
| **Bottom sheet** | See `phone.md` | - |
| **Drawer / side panel** | Slides from the inline end; for detail and assistants; page stays visible | - |
| **Menu / dropdown** | 8 px from its trigger, 36-40 px items, icons aligned, destructive item last and separated; closes on select | Overlay surface of the style |
| **Tooltip** | Label for icon-only controls and truncated text; 150 ms delay; on hover and focus; never the only place for essential information | - |
| **Popover** | Small interactive overlay anchored to a control; dismiss on outside click | - |
| **Toast** | One line + optional action (Undo); 4-6 s; stacked at the bottom (above the tab bar) or top-end; errors that need action are banners, not toasts | - |
| **Banner / notice** | Inline, full width of its container, tinted by meaning, dismissible when not critical | - |
| **Notification panel** | Bell with count; a list grouped by day; read / unread; each row opens its thing | - |
| **Loading** | Under 300 ms: nothing. Up to ~1 s: a spinner in the control. Longer: skeleton or progress with words | - |

## Onboarding and help

| Component | Rules |
|-----------|-------|
| **Setup checklist** | Progress ("6 of 8 done"), the next step emphasised with one button, done steps checked and quiet, optional steps separate, "Hide for now" |
| **Coach mark** | One at a time, points at the control, dismissible, never blocks the task |
| **Inline hint / info tip** | A small "i" with a tooltip for the *why*; the *what* is in the label |

## Per-style quick sheet

| | G Aurora Glass | M Clean Minimal | S Soft Depth | N Dark Neon | B Bento Bold | T Tonal | D Dense Pro |
|---|---|---|---|---|---|---|---|
| Surface | translucent + blur | opaque | opaque, tinted | dark, opaque / faint glass | solid colour blocks | tone ramp | opaque |
| Separation | hairline + soft shadow | 1 px hairline | soft dual shadow | outline + glow | colour + gaps | tone difference | borders |
| Radius (card) | 18-22 | 8-12 | 20-28 | 12-18 | 24-32 | 16-28 | 4-8 |
| Accent use | actions, active, charts | very sparing | fills, chips | lines, glow, active | card fills | derived tones everywhere | status only |
| Motion | standard-lively | calm | standard | lively (glow, draw-on) | standard | standard | calm |
| Density | comfortable | comfortable-compact | comfortable | comfortable | airy | comfortable | compact |
| Phone | floating bars, sheets | flush bars | chunky controls | floating dark bar | stacked blocks | pill nav | cards, not tables |
| Biggest risk | contrast, blur cost | plainness | weak affordance | glow overload | only suits overviews | "default Android" | ugly without rigour |

Add a row or a column whenever a project needs a component or a style that is not here.
