# The phone gate - build it, run it, read it

A phone gate is a script that opens every dashboard page as a phone, in every UI language, measures
it, and fails the merge when a page breaks a budget. It is what turns the rules in `SKILL.md` from
advice into a floor. One gate run on a production build replaces dozens of "looks fine on my phone".

## 1. What it does

For every entry in a page list × every language:

1. Open the page as a phone: **390 × 844, touch, `isMobile`, reduced motion**, signed in with a saved
   session.
2. Wait for the page to settle (network idle, fonts loaded, a short pause for streamed sections).
3. Measure inside the page (`page.evaluate(measurePage, budget)`).
4. Compare each figure to the entry's budget; collect offenders for the failures.
5. Write `report.md` + `results.json` (+ optional first-screen screenshots); exit 0 / 1 / 2.

## 2. The metrics

| Metric | Strict budget | How it is measured |
|---|---|---|
| Sideways overflow | 0 px | `scrollingElement.scrollWidth - innerWidth`. Offenders = the innermost visible elements whose box crosses either edge (RTL overflows to the LEFT), with their x range. |
| Targets < 44 px | 0 | Every visible interactive element's **hit rect**: its box, grown by a positioned `::before` / `::after` hit layer, and by its `<label>` for inputs. Exempt: links inside a sentence (`<p>` with other text - the WCAG 2.5.8 inline exception) and anything marked with an allow attribute. Width counts as well as height. |
| Text < 12 px | 0 | Every visible non-empty text node's computed `font-size`. |
| Fields < 44 px | 0 | Height of text inputs, selects, textareas and comboboxes. (48 px is the stricter choice some teams keep.) |
| Duplicate ids | 0 | Any `id` present more than once - hidden copies included, since that is where they come from. |
| Screens | ≤ 4 for a list page before paging | Page height / viewport height. Desk-style pages (logs, health) and chart pages carry their own number. |
| Primary | present, on the first screen, uncovered | The ONE element marked as the page's primary (e.g. `data-phone-primary`) is inside the first viewport and `elementFromPoint` at its centre lands on it - not on a toast, a bar or a floating button. |

**Primary and empty pages.** A list whose primary lives on its rows has none when the list is empty.
Mark the empty block (e.g. `data-phone-empty`) AND opt the entry in (`primaryOptionalWhenEmpty: true`);
the primary then scores "n/a (empty)". Without the opt-in the marker is ignored, so an empty state
can never silently excuse a page that lost its primary.

## 3. A `measurePage` to start from

Runs in the page. Plain DOM - no framework needed. Adjust selectors and attribute names to your app.

```js
// await page.evaluate(measurePage, { minTarget: 44, minText: 12, minField: 44 })
function measurePage({ minTarget = 44, minText = 12, minField = 44 } = {}) {
  // NOT innerWidth / innerHeight: under mobile emulation an overflowing element WIDENS the layout
  // viewport (innerWidth 390 -> 600), which hides the overflow and skews every other figure.
  // The root's client box stays at the device size.
  const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  const root = document.scrollingElement || document.documentElement;
  const shown = (el) =>
    el.checkVisibility?.({ visibilityProperty: true, checkVisibilityCSS: true }) ?? el.offsetParent !== null;
  const box = (r) => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40)}"`;
  const all = [...document.body.querySelectorAll("*")].filter(shown);

  // 1. Sideways overflow (both edges: RTL pages overflow to the left)
  const overflow = Math.max(0, root.scrollWidth - vw, innerWidth - vw);
  const crossing = overflow ? all.filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; }) : [];
  // innermost crossers, widest first: once the layout viewport has widened, everything on the far
  // side crosses too - the culprit is usually the widest leaf
  const overflowers = crossing.filter((el) => !crossing.some((o) => o !== el && el.contains(o)))
    .map((el) => ({ el, r: el.getBoundingClientRect() })).sort((a, b) => b.r.width - a.r.width)
    .slice(0, 8).map(({ el, r }) => ({ el: name(el), x: [Math.round(r.left), Math.round(r.right)] }));

  // 2. Targets: the box, grown by a positioned ::before/::after hit layer and by a <label>
  const hitRect = (el) => {
    const r = el.getBoundingClientRect();
    let [l, t, rt, b] = [r.left, r.top, r.right, r.bottom];
    const grow = (x) => { l = Math.min(l, x.left); t = Math.min(t, x.top); rt = Math.max(rt, x.right); b = Math.max(b, x.bottom); };
    const cs = getComputedStyle(el);
    if (cs.position !== "static") {
      // a positioned pseudo-element is placed from the PADDING box: start inside the border
      const ox = r.left + parseFloat(cs.borderLeftWidth), oy = r.top + parseFloat(cs.borderTopWidth);
      for (const p of ["::before", "::after"]) {
        const s = getComputedStyle(el, p);
        if (s.content === "none" || s.position !== "absolute") continue;
        const n = (v) => (v.endsWith("px") ? parseFloat(v) : NaN);
        const [pl, pt, pw, ph] = [n(s.left), n(s.top), n(s.width), n(s.height)]; // used values
        if ([pl, pt, pw, ph].every(Number.isFinite)) grow({ left: ox + pl, top: oy + pt, right: ox + pl + pw, bottom: oy + pt + ph });
      }
    }
    for (const lab of el.labels || []) if (shown(lab)) grow(lab.getBoundingClientRect());
    return { w: rt - l, h: b - t };
  };
  const inlineLink = (el) => el.tagName === "A" && (() => { const p = el.closest("p"); return p && p.innerText.trim().length > el.innerText.trim().length + 3; })();
  const INTERACTIVE = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=checkbox],[role=radio],[role=switch],[role=menuitem],[role=option],[tabindex]:not([tabindex="-1"])';
  const smallTargets = [...document.querySelectorAll(INTERACTIVE)]
    .filter((el) => shown(el) && !el.closest("[data-gate-allow]") && !inlineLink(el))
    .map((el) => ({ el, hit: hitRect(el) }))
    .filter(({ hit }) => hit.w < minTarget || hit.h < minTarget)
    .sort((a, b) => Math.min(a.hit.w, a.hit.h) - Math.min(b.hit.w, b.hit.h))
    .map(({ el, hit }) => ({ el: name(el), w: Math.round(hit.w), h: Math.round(hit.h) }));

  // 3. Small text
  const smallText = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode()); ) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || !shown(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < minText) smallText.push({ text: n.textContent.trim().slice(0, 40), px: fs });
  }

  // 4. Short fields
  const FIELDS = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]),select,textarea,[role=combobox]';
  const shortFields = [...document.querySelectorAll(FIELDS)].filter(shown)
    .filter((el) => el.getBoundingClientRect().height < minField)
    .map((el) => ({ el: name(el), h: Math.round(el.getBoundingClientRect().height) }));

  // 5. Duplicate ids (hidden copies count - that is where they come from)
  const seen = new Map();
  for (const el of document.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) || 0) + 1);
  const dupIds = [...seen].filter(([, c]) => c > 1).map(([id, c]) => `${id} ×${c}`);

  // 6. Screens (if your app scrolls inside <main>, measure that element instead)
  const screens = +(root.scrollHeight / vh).toFixed(2);

  // 7. Primary: on the first screen and not covered
  const primary = [...document.querySelectorAll("[data-phone-primary]")].find(shown);
  let primaryState = "missing";
  if (primary) {
    const r = primary.getBoundingClientRect();
    const onFirst = r.top >= 0 && r.bottom <= vh;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    primaryState = !onFirst ? "below the first screen" : hit && (primary === hit || primary.contains(hit)) ? "ok" : `covered by ${hit ? name(hit) : "nothing"}`;
  } else if (document.querySelector("[data-phone-empty]")) primaryState = "n/a (empty)";

  return { overflow, overflowers, smallTargets, smallText: smallText.slice(0, 10), smallTextCount: smallText.length,
           shortFields, dupIds, screens, primary: primaryState };
}
```

Notes on the measure:
- **Measure against the device size, not `innerWidth`.** Under mobile emulation (and on real
  phones) one overflowing element widens the layout viewport: `innerWidth` became 600 on a 390 px
  phone, `scrollWidth - innerWidth` read 0, and a fixed bar moved off the primary it covered. The
  root's `clientWidth` / `clientHeight` stay at 390 × 844.
- A hit layer that is wider than the drawn control (40 px drawn + a layer to 44) passes because the
  pseudo-element's box is counted. If your hit layer is drawn differently (an outline, a padding
  trick), teach `hitRect` about it rather than exempting the control.
- Serialise the function whole when it runs in another process (`page.evaluate` sends its source):
  keep constants inside it.
- Count closed `<details>` content as hidden (it is not rendered) - but remember the gate therefore
  never measures what is inside a fold; open one by hand.

## 4. A runner sketch (Playwright)

```js
import { chromium, devices } from "playwright";

const PHONE = { ...devices["iPhone 14"], viewport: { width: 390, height: 844 }, reducedMotion: "reduce" };
// Playwright's iPhone 14 viewport is shorter (browser chrome); pick one height and keep it, so
// "screens" stays comparable between runs.
// BASE, PAGES (entries below) and measurePage (above) are yours.

const overBudget = (m, { budget: b, primaryOptionalWhenEmpty }) => [
  m.overflow > b.overflow && "overflow",
  m.smallTargets.length > b.targets && "targets",
  m.smallTextCount > b.text && "text",
  m.shortFields.length > b.fields && "fields",
  m.dupIds.length > b.dupIds && "dup ids",
  m.screens > b.screens && "screens",
  !(m.primary === "ok" || (m.primary === "n/a (empty)" && primaryOptionalWhenEmpty)) && "primary",
].filter(Boolean);

const browser = await chromium.launch();
const results = [];
for (const lang of ["en", "ar"]) {
  const context = await browser.newContext({ ...PHONE, storageState: "scratch/session.json" });
  await context.addCookies([{ name: "ui_lang", value: lang, url: BASE }]); // however your app picks the language
  const page = await context.newPage();
  for (const entry of PAGES) {
    try {
      const res = await page.goto(BASE + entry.path, { waitUntil: "networkidle" });
      if (!res || res.status() >= 400) throw new Error(`HTTP ${res?.status()}`);
      await page.evaluate(() => document.fonts.ready);
      const m = await page.evaluate(measurePage, { minTarget: 44, minText: 12, minField: 44 });
      results.push({ entry, lang, m, failed: overBudget(m, entry) });
    } catch (e) {
      results.push({ entry, lang, error: String(e), failed: ["error"] });
    }
  }
  await context.close();
}
```

A page entry:

```js
{ group: "orders", key: "list", path: "/orders",
  budget: { screens: 4, overflow: 0, targets: 0, text: 0, fields: 0, dupIds: 0 },
  primaryOptionalWhenEmpty: true,   // the list's primary lives on its rows
  account: "has-paid-plan",         // a page whose state the default account cannot show
  langs: ["en", "ar"] }
```

## 5. Rules that keep it honest

- **Strict mode is the merge mode:** every metric at its budget; a page with a looser `screens` must be
  marked as a desk or chart page - a looser number on an ordinary page is not honoured.
- **Budgets ratchet.** Never loosen one to pass. Fix the page (usually fold - see `pitfalls.md` §12)
  or say in the PR why the number moved.
- **Skip is not pass.** No build, a build older than the newest changed file, no session file, no
  browser: report SKIPPED with the reason. A gate that "passed" on pages it did not build is worse
  than no gate.
- **Run against a production build** (`next build && next start`), not a dev server: dev renders
  differently and is slow enough to change what "settled" means. If `next start` dies mid-run (out of
  memory on a big app), re-run the step alone with a larger heap and say so - never report a half run
  as a pass.
- **Which pages:** every group the diff touched; a change to the shell, the kit, the global stylesheet,
  the middleware or the root layout means every group. Add any page your change grew near its budget.
- **A new page gets its gate entry in the same PR** (a test can count pages vs entries).
- **Give a state its own entry:** if the default test account cannot show a state (a paid plan, an
  alert, a long list), add an entry with an account that can. The default accounts are usually demos
  with short, tidy data - the real failures live in long names and live badges.
- **Name what the gate cannot see** in the PR: closed sheets and folds, controls that only draw with
  live data, drags, the keyboard, real devices.

## 6. Exit codes and the report

- Exit **0** pass · **1** a budget failed or a page errored · **2** usage / browser / sign-in problem.
- `report.md`: one row per page × language - Screens, Overflow, Targets < 44, Text < 12,
  Fields < 44, Dup ids, Primary, Result - with over-budget cells in **bold**. Under it, **What failed**:
  for each failing page, the overflowing elements with their x range, the five smallest targets,
  small-text samples, short fields and repeated ids. That list is where to look - a count that is the
  same on every page is the shell or a kit piece, not the page.
- `--shots` (optional): a first-screen screenshot per row, for the reviewer.

## 7. Sessions and safety

- **Sign in once, save `storageState` outside the repo, reuse it** for every viewport and language
  (switch the language with its cookie, not a new sign-in). Sign-in endpoints are rate-limited per
  account and per IP, and every local agent shares one IP: repeated sign-ins lock out real people.
- **Give each local browser context its own `x-forwarded-for`** if your rate limit keys on it.
- **Never copy the session's theme / language cookies into every context** - set them per context.
- **Never read or print a login file;** pass its path. Do not log request headers or bodies around a
  sign-in (a failed request's log prints the Cookie header), and do not sign in against a dev server
  whose log prints server-action arguments.
- **Two scripts must not share one saved session at once** - a refresh-token rotation in one revokes
  the other.
- **Keep runs to the pages that changed** when the app pulls images or data from a metered backend.
- **Check the port is yours:** a stale `next start` from another session can hold the port and serve
  an old build ("nothing changed"); check the process start time or take a free port.

## 8. Verifying without a login or a database

- **A view that takes its data as props is checkable with fixtures:** a temporary preview route renders
  the views with fixture data and the SAME `measurePage` measures them at 390 in both languages, light
  and dark - deleted before the PR. It shows states no test account has (every empty state, the
  longest values).
- **A static render + a compiled stylesheet + Playwright at 390** measures a single component with no
  server at all.
- **Render tests** (`renderToStaticMarkup`) pin "one primary per state", "the action bar is the last
  element", "one `aria-current`" across every state × variant.

## 9. Probes beyond the gate

- **Focus not obscured (WCAG 2.4.11):** Tab to the LAST field of a screen, then `elementFromPoint` at
  its top, middle and bottom - each must hit the field, not a fixed bar.
- **Sheets mid-slide:** sample `boundingBox()` at 50 / 300 / 800 ms before calling a layout broken.
- **Animations within bounds:** pause `document.getAnimations()` at set times and check every painting
  descendant's box stays inside its stage, at 390 and at wide desk widths.
- **Swipes:** CDP `Input.dispatchTouchEvent` (Playwright has no swipe).
- **Lazy loading:** on a production build, the chunk request appears only on the toggle / tap.
- **Broken images:** route `/_next/image**` to 504 and check the fallback draws.
- **Print:** `page.pdf()` - the expected page count and only the piece.

## 10. The desk gate

The same idea from `md` up, with desk floors: **28 px targets, 11 px text, 0 overflow** at 1440, 1280
and 768, light and dark, plus axe. Details in `desk.md`. A test can fail when a new page file has no
desk entry.
