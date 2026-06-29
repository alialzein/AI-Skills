# `production-readiness` — skill guide

An engineering-rigor auditor that finds the things teams reliably forget — untested seams,
missing CI, secret/rotation gaps, external-API fragility, non-atomic writes, uncapped AI
spend, theming, observability, backups — and reports them **ranked by severity and effort**,
with `path:line` evidence and concrete fixes.

- **Invoke:** model-invoked. It triggers automatically when you ask things like *"is this
  production-ready?"*, *"review my repo"*, *"what am I missing before launch?"*, *"set up CI
  and tests"*, or when scaffolding a new project. You can also force it with `/production-readiness`.
- **Best for:** web apps / SaaS, APIs/backends, and AI/LLM apps. Scales down sensibly to
  CLIs and libraries via scope profiles.

## What's in here
| Path | Role |
|------|------|
| `SKILL.md` | Lean workflow: scope → audit → severity rubric → report template → condensed checklist → quick grep audit. |
| `references/detailed-checklist.md` | The full 14-area audit with per-item "how to verify" (loaded on demand). |
| `references/grep-recipes.md` | Copy-paste `rg` commands to find each smell fast. |
| `references/stack-profiles.md` | Which areas apply to CLI vs SaaS vs library vs API vs AI vs mobile. |
| `assets/PRODUCTION-READINESS.md` | A fill-in checklist the skill drops into the audited repo. |
| `assets/report-template.md` | The exact report skeleton it fills in. |
| `examples/sample-review.md` | A worked example review so you can see the output shape. |

It uses **progressive disclosure**: only `SKILL.md`'s ~250 lines load when the skill
triggers; the deep references load only when a review actually needs them. That keeps it fast
and cheap on every invocation.

## Deploy it

> Repo-wide options are in the [root README](../../README.md#install). Quick paths:

**Plugin (recommended, all machines):**
```
/plugin marketplace add alialzein/AI-Skills
/plugin install ai-skills@ai-skills
```

**Single skill, by hand** — copy the whole folder (SKILL.md + references + assets) keeping
the name `production-readiness`:
```bash
cp -r skills/production-readiness ~/.claude/skills/production-readiness   # macOS/Linux
# Windows: C:\Users\<you>\.claude\skills\production-readiness\
```
Or from the repo root run `./install.sh` to symlink every skill into `~/.claude/skills/`.

## Use it
Just ask, in any repo:
```
Is this production-ready? What am I missing before launch?
```
The skill will scope the project, audit the relevant areas against the actual code, and hand
back a severity-ranked report. Then ask it to **"add the checklist and a CI workflow"** and it
will drop `PRODUCTION-READINESS.md` in and scaffold CI.

## Improving this skill
Built with the methodology in Anthropic's `skill-creator`. To iterate with evals (test
prompts → run with/without the skill → review → refine), open that skill and point it at
`skills/production-readiness`.
