# Review - the gate

The builder's first draft is never the finished design. Plan for two to three rounds, and make each round cheap: small slices, real screenshots, numbered requests.

## The stance

Review like a demanding creative director with the reference open beside the draft. The question is not "does it work?" but "put next to the reference, does it hold its own or win?" Accept only when the answer is yes - and say "accepted" plainly when it is.

**When there is no reference image** (a written brief only): the reference is the chosen style's panel in `assets/style-samples.html` plus a one-sentence pattern brief written before building (see `vocabulary.md`). Review against those two. A self-review by the builder is a first pass, not the gate - someone who did not build it reviews it.

## What the builder hands over

- The branch / commits and where it runs (URL, port, how to sign in).
- Screenshots as files: **desktop (1440, and 1920 if the layout stretches) and phone (390, plus 320 / 440 for bars), light and dark, both directions if the product is bilingual.**
- For anything that moves: a frame strip (every ~60 ms) or a recording.
- Each state: at rest **and scrolled**, zero data **and** full data (say which are fixtures), the first and last item active, an item with a badge.
- Test and gate results as they are, failures included.
- What was decided against, and what could not be done.

## What the reviewer checks

**1. Against the reference** - name three things the reference does that the draft does not yet do.

**2. The material**
- Does glass read as glass on the first screen, in light?
- Text contrast on the worst point of the ground?
- Any text straight on the ground?

**3. The frame**
- Scroll a long page: anything readable above or beside a floating bar?
- Do bars and content share edges? Is there air under the bar?
- Is the active nav item visible? Is half the screen empty?

**4. The data**
- Zero state composed? Fixture state good?
- Can each tile be read alone? Zeros styled one way?
- Does anything decorative look like data? Is any number invented?

**5. The phone**
- 320 / 390 / 440; safe areas; 44 px targets; no cut labels; no horizontal scroll.
- The bar on load, with the first tab, the last tab, a badge.
- Faces whole; text not over faces.

**6. Motion** (open it live - screenshots cannot show this)
- List running animations and their properties; anything but transform / opacity / dashoffset is a finding.
- Sample a transition frame by frame: a curve, or a jump?
- Double entrances? Anything that makes a page feel slower?
- Is "alive" motion actually visible? Is anything tiring?
- Reduced motion: truly still?

**7. Direction and theme** - RTL mirrored where it should be and not where it should not (digits, codes); dark designed, not inverted.

**8. Nothing lost** - every guarantee the old component had (focus return, hide-on-scroll, badges, permissions) still holds.

## Writing the review

- First line: the verdict ("not accepted yet - six changes", "accepted with two notes").
- Say what was reviewed and what was **not** (e.g. "from screenshots; motion not opened live").
- List what is good and must stay - or the next round will "fix" it.
- **Numbered requests**, each with: where it shows (which screenshot or state), what is wrong, what "right" looks like, and a suggested way if there is one. No vague "make it pop".
- Separate blockers from notes.
- Say what to send next round.

Example:

> 2. Two lines at the bottom. The accent line sits 3 px above the pill's own border, so the edge reads as a grey stroke with a blue one floating over it (all four close-ups). In the reference the glowing line IS the edge. Put the line on the border's path, or drop the bottom border where the line runs.

## When the owner disagrees with the review

The person whose product it is outranks the reviewer. If they chose something the review asked to remove, the review drops the request, records the choice, and judges the next round on their terms ("the art-on-glass card", not "the reference's plain tile"). Offer the concern once, as a note.

## When the owner tests it themselves

- Tell them the URL, the five things to click, and anything their own machine hides (animations switched off in the OS; a browser's phone preview cropped by a small window, which hides bottom bars and cuts the right edge - zoom the preview out).
- A report of "it does not show / does not move" gets tested in a real phone-size viewport before anything is changed.

## The recurring first-round failures

| Area | Failure seen | Rule that prevents it |
|------|--------------|-----------------------|
| Glass | White cards over a flat top-of-page | Colour behind the first screen |
| Shell | Rows visible above the floating bar | The veil |
| Shell | Bar wider than the content | One edge |
| Shell | Active nav row hidden behind the footer | Scroll it into view |
| Tab bar | Line above the border; clipped at the ends; dies before the far corner | The line is the edge; mask relative to the pill |
| Tab bar | A brand-colour mark among line icons | One icon family |
| Tab bar | Neon on white | Neon needs dark; offer both surfaces |
| Tiles | Zeros in three styles; cryptic values; cut chips | One zero rule; readable alone; no ellipsis in numbers |
| Charts | Blank grid with an invented axis | Designed empty state |
| Cards | Rows of cards misaligned | Fixed slots or subgrid |
| Portraits | Face sliced; name over the mouth | Whole figure beside the name |
| Profile | A form, not a profile; half the desk empty | Identity header; two columns |
| Forms | Read-only that looks editable; save pill with no ground | Disabled look; action bar |
| Motion | Breathing nobody can see | Perceptible and calm |
| Brand | Candidates that look like the old icon at rest | New at rest; show the current beside them |
| Honesty | A score with no data behind it | No invented metric |

Add a row whenever a round shows a new one.
