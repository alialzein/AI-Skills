# RTL, Arabic and mixed-direction text

Written from an English + Arabic dashboard; most of it applies to Hebrew and Persian too (the digit
and plural rules are Arabic-specific - check your language's CLDR data).

## 1. Direction and mirroring

- **Logical properties only:** `ms-` / `me-`, `ps-` / `pe-`, `start-` / `end-`, `inset-inline-*`,
  `text-start` / `text-end`, `rounded-s-*` / `rounded-e-*`. Then Arabic mirrors by itself. A table
  head that is `text-left` (shadcn's default) needs `text-start`.
- **The first HTML is already right:** write `<html lang dir>` on the server from the language
  cookie / path, so the first paint of an Arabic page is `rtl`. A client stamp is only the fallback.
- **Portals render on `<body>`:** with `dir` on `<html>` sheets mirror; a dialog portalled out of a
  page in ANOTHER language than the shell takes its own `dir`.
- **A switch slides with an `rtl:` translate** - the knob was drawn outside the track in Arabic.
- **Directional icons flip** (`rtl:-scale-x-100`: arrows, chevrons, back, undo, a "send" plane, a
  scooter). **Media controls do not** (a Play triangle keeps its direction). A picture with no
  direction does not flip.
- **A picture is not mirrored on an Arabic page, so neither are points ON it:** a 3 × 3 focal-point
  picker for a photo is `dir="ltr"`.
- **Clip / reveal effects run to the inline END** and mirror (a before / after split).
- **A bar in an RTL card fills from the right by itself** when the fill is a block child with
  `inline-size: N%` - no `rtl:` class, no transform.
- **A chat bubble's tail corner uses logical radii** (`rounded-ee-md` / `rounded-es-md`) so it mirrors.
- **Arrow keys in RTL:** in a native radio group, Chrome's Left / Right still mean previous / next -
  test with Down / Up.
- **`uppercase` and `tracking-tight` break Arabic:** sentence case for heads; `rtl:tracking-normal` on
  titles.
- **Do not put `dir="auto"` on a block that relies on the page's direction**; use `<bdi>` for user
  text inside a sentence (a `<bdi>` is auto by default).
- **An English admin page that must also read in Arabic** takes `?lang=ar`, `dir` + `lang` on the page
  root, and a second gate entry; text an AI model reads stays English inside `dir="ltr" lang="en"`
  blocks. A page that switches its own `dir` keeps the shell's strip OUTSIDE its wrapper.

## 2. Digits

- **One digit system per screen.** In this product counts are Arabic-Indic (٠١٢٣٤٥٦٧٨٩); money and
  order numbers stay Latin. Decide once, per kind of number, and use ONE helper for each.
- **`(123).toLocaleString("ar")` gives Western digits in current ICU** - do not use it for counts.
  Use an explicit numbering system (`Intl.NumberFormat("ar-u-nu-arab")`) or one digits module.
- **Converting digits goes through ONE module** (both directions), never a private table per file.
- **Every count passes a formatter:** chip counts, filter-count badges, tile values (a bare number in
  a tile prints Latin digits on an Arabic page), pager text, chart axes. Kits take a `formatCount` prop
  and have no default locale.
- **Group thousands in the count helper too** (U+066C ARABIC THOUSANDS SEPARATOR in Arabic).
- **A signed count:** use U+2212 (minus sign) and Arabic-Indic digits in your own helper - `Intl` adds
  stray direction marks to a negative Arabic number.
- **A separator between figures is a WORD in the dictionary:** « · » before «٠» reads as a second
  zero («· ٠ من ١٠٠»). Use «، » or «: » in Arabic; a render test keeps Arabic cards free of « · ».
  "What an answer did" is one tag per note (`<li>`), never a « · » join.

## 3. Dates and time

- **All dates through ONE formatter** with the dashboard's month names and digits - never a bare locale
  tag, `toLocaleDateString`, or a date library's `ar` locale in UI code. A lint rule or test can fail
  on each.
- **A default time zone in that formatter.** A client component's date is formatted twice - on the
  server (UTC on most hosts) and in the browser (the user's zone) - and "21:47" vs "23:47" is a
  hydration text mismatch (React #418). Pass a zone only to mean another one.
- **An Arabic date never sits in an LTR isolate.**
- **A fixture date across a daylight-saving change moves a local day** in tests.

## 4. Plurals and counted phrases

- **Plurals through CLDR forms, never number + singular noun.** Arabic has six categories (zero, one,
  two, few, many, other): «طلب واحد», «طلبان», «٣ طلبات», «١١ طلباً», «١٠٠ طلب». One helper
  (`countText(n, forms, locale)`) for every counted noun, including units like credits.
- **A counted noun after a quantifier word** ("Ask for 100 more try-ons" / «اطلب ١٠٠ تجربة إضافية"):
  English puts the noun after "more", Arabic agrees it with the number. Pass BOTH the bare count
  `{n}` and the counted phrase `{count}` to the template and let each language's string pick.
- **A missing plural form of an existing set is not a new string** - add it.

## 5. Bidi - mixing Latin and Arabic

- **Isolate a Latin number or code inside an Arabic sentence:** `<bdi dir="ltr">…</bdi>` in markup,
  or U+2066 (LRI) … U+2069 (PDI) in a plain string. "#57" alone in an Arabic line draws as "57#";
  "$5.00" in a filled sentence draws «5.00$».
- **A name of unknown direction inside a sentence:** U+2068 (FSI) … U+2069.
- **Never put an LTR isolate around Arabic words** - the sentence then runs backwards.
- **Write the isolates as escapes in source** (`\u2066`, `String.fromCharCode(0x2066)`), never as the
  invisible characters themselves. Editors, file-writing tools, JSON tools, shell heredocs and `node -e` have all turned
  escapes into the invisible characters; grep the diff for U+2066-2069 before committing.
- **A Latin run with a digit inside an Arabic card line** ("100 ml") goes in an LTR isolate, or it
  reads «ml 100». A helper that isolates every Latin run is cheaper than finding each.
- **Links and @handles inside Arabic text** each get an LTR isolate; copied text stays exactly as
  written.
- **Brand names stay Latin.**
- **A row's second-language name goes LAST**, in its own `<bdi dir lang class="min-w-0 truncate">`, so
  the ellipsis cuts its own end.
- **A `<bdi>` inside a truncating RTL block cuts the START of an English title** ("…u sent when I was
  sick"): make the `<bdi>` itself the truncating block (`<bdi class="block truncate rtl:text-right">`).
- **An e-mail inside an Arabic row:** give the `<p>` itself `dir="ltr"` + `truncate rtl:text-end` - a
  `<bdi dir="ltr">` inside a truncating RTL line cuts the address's start.
- **Money in tables and tiles** in `<bdi dir="ltr">`, end-aligned, tabular figures.

## 6. Words

- **A formal register on every dashboard string** (for Arabic: فصحى, not colloquial), the editor,
  imports and e-mails included; **one word per thing** across the product - keep a small glossary.
- **A help text names a label only as the UI prints it** - a test can fail on a quoted label missing
  from the source.
- **Strings live in typed modules per surface** (`{ en, ar }` or a `dict(locale)` function); a
  reworded label is a NEW key (pinned catalogues stay unchanged). Kind-aware words (a restaurant vs a
  shop) go through a second parameter with a default.
- **Arabic is wider:** chips over a fixed shape, tile labels and tab labels must be measured at 390 in
  Arabic, not only English. Shorten the English when the Arabic needs the room.
- **The browser's own words leak into Arabic screens** (file inputs, validation bubbles): draw your
  own.
- **A short visible abbreviation gets an `aria-label` with the full word**, never an `sr-only` tail.

## 7. Charts and exports

- **A one-series chart in Arabic:** reversed x-axis, y-axis on the right, the tooltip's `direction`
  set; mirror sparklines like the page's charts.
- **Compact money ticks in Arabic** («$22 ألف» / «$1.3 مليون»): the Latin amount in an LTR isolate
  inside an RTL isolate, so the SVG text in the chart's LTR box reads in Arabic order - never a Latin
  K / M on an Arabic screen. Money axes get wider labels or they clip at 390.
- **recharts writes `font-size` as an SVG attribute** - size ticks with a descendant selector; legend
  and tooltip words in the card's ink, not the series colour (contrast).
- **A CSV for Excel with Arabic starts with a UTF-8 BOM.** A unit test must read it with
  `new TextDecoder("utf-8", { ignoreBOM: true })` - `Response.text()` silently drops it. Cells: quote
  `, " \n`, and prefix `= + - @` with an apostrophe (formula injection).
- **Phone numbers in an RTL `.xlsx` need `readingOrder: ltr`** on the column, or Excel draws `+44 20…`
  reversed; text cells keep the "@" format.

## 8. Sizes

- Arabic body text ≥ 14 px; bottom-bar labels 12 px (13 in Arabic). On a desk scale that shrinks
  English to 13 / 11 px, Arabic keeps 14 / 12.

## 9. Checking it

- Run every gate page in both languages; the overflow check must read `scrollWidth` in RTL too
  (overflow goes to the LEFT, and invisible absolutely-positioned elements widen the page).
- A fresh reader of the language reviews every new Arabic screen for mirroring, bidi, register,
  digits and counts - with a flagged list and one sample page.
