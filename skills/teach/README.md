# `teach` — skill guide

Turn the current directory into a stateful **teaching workspace**: the skill interviews
you on *why* you want to learn something, curates trusted sources, and produces short,
beautiful, interactive HTML lessons that build over multiple sessions.

- **Invoke:** `/teach <topic>` (user-invoked — it sets `disable-model-invocation: true`)
- **Author:** Matt Pocock — vendored from [mattpocock/skills](https://github.com/mattpocock/skills). See repo [LICENSE/attribution](../../README.md#attribution).

## Files in this skill
| File | Role |
|------|------|
| `SKILL.md` | The skill definition Claude loads. |
| `MISSION-FORMAT.md` | Template for `MISSION.md` (why the learner is studying). |
| `RESOURCES-FORMAT.md` | Template for the curated source list. |
| `LEARNING-RECORD-FORMAT.md` | Template for what the learner has demonstrably learned. |
| `GLOSSARY-FORMAT.md` | Template for the workspace's shared vocabulary. |
| `examples/leadership-course/` | A full worked example — a 7-lesson leadership course. |

## Deploy it

> Full repo-wide install options are in the [root README](../../README.md#install).
> Quick paths:

**Plugin (recommended, all machines):**
```
/plugin marketplace add alialzein/AI-Skills
/plugin install ai-skills@ai-skills
```

**Single skill, by hand:** copy this folder to your personal skills dir, keeping the
folder name `teach` and `SKILL.md` + the `*-FORMAT.md` files together:
```bash
cp -r skills/teach ~/.claude/skills/teach      # macOS/Linux
# Windows: C:\Users\<you>\.claude\skills\teach\
```
Or from the repo root, `./install.sh` symlinks every skill into `~/.claude/skills/`.

## Use it
```bash
mkdir ~/learn-spanish && cd ~/learn-spanish     # one folder per topic
/teach Spanish for ordering food in Mexico
```
Answer the mission questions, then keep returning to the **same folder** each session —
all state (mission, lessons, glossary, learning records) lives there. See
[`examples/leadership-course/`](./examples/leadership-course) for what a mature
workspace looks like, including links to view the rendered lessons.
