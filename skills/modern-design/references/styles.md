# Styles - the catalogue, and how to let the person choose

"Modern" is not one look. Before redesigning anything, the person picks a style **from samples they can see**, because nobody can choose between words like "glassy" and "tonal".

## The choosing step (always before a redesign)

1. Open `assets/style-samples.html` for them (a local file in the browser, or publish / serve it). It shows the **same** small dashboard in every style below, with a light / dark switch and a phone preview.
2. Ask, as choices rather than open questions:
   - **Style** - which sample (one, or "A with B's tab bar").
   - **Default theme** - light, dark, or follow the device.
   - **Density** - comfortable or compact.
   - **Accent** - keep the brand colour, or pick from three you propose.
   - **Motion** - calm, standard, or lively (see `motion.md`).
   - **Scope** - which screens first (the home screen and the shell make the best trial).
3. Record the answers where the project keeps decisions. Trial the style on two or three screens before rolling it out.
   If only the style is known and the rest cannot be asked: theme follows the device, comfortable density, the brand's accent, standard motion, a dark-glass phone tab bar - each built as a setting or a token, so changing it later is a value, not a rebuild.
4. If they bring their own reference, name its patterns (`vocabulary.md`) and map it to the nearest style here; the reference wins where they differ.

If the person says "you choose": pick by the table under "Which style when", say why in one sentence, **show the sample in that same first message, and ask them to confirm or point at another** before the redesign goes further. Under time pressure a single small, reversible trial screen in the recommended style may be built while they look - labelled as a trial. The sample is never offered "for later".

## The styles

Each style is a set of token values plus a few structural habits. Components (`component-library.md`) are the same in all of them; only the recipe changes.

### 1. Aurora Glass (glassmorphism)
- **Look:** translucent blurred surfaces over a soft gradient mesh; light hairline borders; large radii; floating sidebar and bars.
- **Tokens:** surfaces at 0.6-0.8 alpha + `backdrop-filter: blur(18px) saturate(1.5)`; radius 18-22; coloured soft shadows.
- **Fits:** owner-facing dashboards, consumer SaaS, AI products; anywhere "premium" and "alive" matter more than density.
- **Costs / risks:** blur on cheap phones; contrast varies across a card; needs a ground. Full recipe: `glass.md`.

### 2. Clean Minimal (flat, "Linear / Stripe" school)
- **Look:** opaque white or near-black surfaces, 1 px hairlines instead of shadows, one accent used sparingly, tight type, generous whitespace, almost no decoration.
- **Tokens:** no blur; radius 8-12; shadow only on overlays; neutrals with a slight hue bias; accent for the primary action and the active state only.
- **Fits:** developer tools, B2B, finance, anything read all day; the safest choice for accessibility and speed.
- **Costs / risks:** can look plain if spacing and type are not precise - the craft is in alignment and hierarchy, not effects.

### 3. Soft Depth (soft UI, neumorphism-lite)
- **Look:** pastel-tinted surfaces that look gently raised; big radii (20-28); soft two-direction shadows; chunky, friendly controls.
- **Tokens:** surface and page a few points apart in lightness; shadows `8px 8px 24px` dark + `-6px -6px 18px` light, at low alpha; filled icon chips.
- **Fits:** wellness, education, family and consumer apps; a friendly merchant app.
- **Costs / risks:** real neumorphism fails contrast - keep **borders or fills on every control** so a button does not rely on shadow alone; dark mode needs its own shadow recipe.

### 4. Dark Neon (cyber, "night mode first")
- **Look:** deep navy / near-black, glowing accent lines, hot-core strokes, charts that glow, thin outlines.
- **Tokens:** background 8-12 % lightness with hue; accents cyan / blue / violet; glow = pre-blurred duplicate layers; radius 12-18.
- **Fits:** analytics, gaming, crypto, monitoring walls, a dashboard's dark theme taken further.
- **Costs / risks:** glow overuse reads as cheap; it has **no real light theme** (offer Clean Minimal as its light sibling); large saturated areas tire the eye - keep neon to lines and the active state.

### 5. Bento Bold
- **Look:** a grid of cards in different sizes, a few of them in strong solid colours, very large numbers and headings, playful but ordered.
- **Tokens:** radius 24-32; two or three brand colours used as card fills; type scale with a real display size; little or no shadow.
- **Fits:** home / overview screens, marketing-adjacent product pages, consumer finance, portfolio dashboards.
- **Costs / risks:** only the overview can be bento - tables and forms fall back to Clean Minimal; coloured cards need their own ink pairs for contrast.

### 6. Tonal (Material You school)
- **Look:** every surface tinted from one seed colour at different tones; pill-shaped buttons and navigation; filled tonal containers instead of borders.
- **Tokens:** surface tones (e.g. 98 / 96 / 94 / 92 in light, 10 / 14 / 18 / 22 in dark) from the seed hue; radius 16-28 and full pills; state layers (8 % / 12 % overlays) for hover and press.
- **Fits:** Android-first products, cross-platform apps, products that want a brandable theme per customer (one seed -> a whole theme).
- **Costs / risks:** needs a tone ramp generator or a careful hand-made ramp; can feel "default Android" without a distinctive type choice.

### 7. Dense Pro (data-dense, operator tools)
- **Look:** compact rows (32-36 px), small type (13 px), many columns, sticky headers, monospace numbers, colour only for status.
- **Tokens:** radius 4-8; spacing on a 4 px grid; borders over shadows; a calm neutral palette with semantic colours.
- **Fits:** back-office, support consoles, logistics, admin screens with big tables; "admin for power users".
- **Costs / risks:** hostile to phones - it needs a separate phone layout (cards instead of tables); easy to make ugly without strict alignment.

## Which style when

| Situation | Start from |
|-----------|-----------|
| A shop owner's or creator's dashboard, used on a phone, should feel premium | Aurora Glass |
| A tool people sit in eight hours a day | Clean Minimal |
| Heavy tables, many filters, expert users | Dense Pro (phone: Clean Minimal cards) |
| A friendly consumer app | Soft Depth or Tonal |
| An analytics wall, a dark-first product | Dark Neon (light theme: Clean Minimal) |
| The overview page must impress | Bento Bold on top of any base style |
| Each customer gets their own brand colour | Tonal |

## Mixing rules

- One **base** style per product; a second may be borrowed for one element (a dark-neon tab bar in an Aurora Glass app; a bento overview in a Clean Minimal app).
- Never mix surface languages inside one screen (a neumorphic button on a glass card).
- The laws in SKILL.md hold for every style: honest numbers, designed empty states, one edge, compositor-only motion, RTL, both themes designed.

## What stays the same in every style

Hierarchy (one thing leads), spacing rhythm (4 / 8 px grid), type scale, the phone rules (`phone.md`), motion rules (`motion.md`), and the review gate (`review.md`). A style changes the material; it does not excuse the craft.

## Adding a style

When a project produces a new look worth keeping: add a section here (look, tokens, fits, costs), add its token block to `assets/style-samples.html`, and a line to `CHANGELOG.md`.
